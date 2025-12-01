'use client';

import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import { api } from '@/convex/_generated/api';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import Prompt from '@/data/Prompt';
import { useConvex, useMutation } from 'convex/react';
import { ArrowRight, Link, Loader2Icon } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSidebar } from '../ui/sidebar';
import { toast } from 'sonner';

// simple token counter
export const countToken = (inputText) => {
  if (!inputText) return 0;
  return String(inputText)
    .trim()
    .split(/\s+/)
    .filter((word) => word).length;
};

function ChatView() {
  const { id } = useParams();
  const convex = useConvex();
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const UpdateMessages = useMutation(api.workspace.UpdateMessages);
  const { toggleSidebar } = useSidebar();
  const UpdateToken = useMutation(api.users.UpdateToken);

  useEffect(() => {
    if (id) {
      GetWorkspaceData();
    }
  }, [id]);

  /**
   * Get Workspace data using Workspace ID
   */
  const GetWorkspaceData = async () => {
    try {
      const result = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: id,
      });
      setMessages(result?.messages ?? []);
    } catch (err) {
      console.error('GetWorkspaceData error:', err);
      toast('Failed to load workspace messages');
    }
  };

  // whenever last message is from user, call AI
  useEffect(() => {
    if (messages?.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'user') {
        GetAiResponse();
      }
    }
  }, [messages]);

  const GetAiResponse = async () => {
    if (!messages || messages.length === 0) return;

    setLoading(true);
    const PROMPT = JSON.stringify(messages) + ' ' + Prompt.CHAT_PROMPT;
    console.log('[ChatView] PROMPT:', PROMPT);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: PROMPT }),
      });
      console.log('[ChatView] /api/ai-chat response:', response);

if (!response.ok) {
  const text = await response.text().catch(() => '');
  console.error('AI Chat API failed:', response.status, text);
  toast('AI response failed. Please try again.');
  return;
}


      const data = await response.json().catch((err) => {
        console.error('Failed to parse AI response JSON:', err);
        throw new Error('Invalid JSON from AI API');
      });

      if (!data || !data.result) {
        console.error('AI Chat API: missing result field', data);
        toast('AI returned an empty response');
        return;
      }

      const aiResp = {
        role: 'ai', // or 'assistant' if you prefer
        content: data.result,
      };

      // update local messages
      setMessages((prev) => [...(prev ?? []), aiResp]);

      // update messages in DB
      await UpdateMessages({
        messages: [...(messages ?? []), aiResp],
        workspaceId: id,
      });

      // update token usage
      const usedTokens = Number(countToken(JSON.stringify(aiResp)));
      const currentToken = Number(userDetail?.token ?? 0);
      const newToken = currentToken - usedTokens;

      console.log('Token used:', usedTokens, 'New token:', newToken);

      setUserDetail((prev) => ({
        ...(prev ?? {}),
        token: newToken,
      }));

      if (userDetail?._id) {
        await UpdateToken({
          token: newToken,
          userId: userDetail._id,
        });
      }
    } catch (error) {
      console.error('AI Chat API error:', error);
      toast('Something went wrong while generating AI response');
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = (input) => {
    const text = input.trim();
    if (!text) return;

    if (userDetail?.token < 10) {
      toast("You don't have enough token to generate code");
      return;
    }

    // push user message; useEffect will trigger GetAiResponse
    setMessages((prev) => [...(prev ?? []), { role: 'user', content: text }]);
    setUserInput('');
  };

  return (
    <div className="relative h-[83vh] flex flex-col">
      <div className="flex-1 overflow-y-scroll scrollbar-hide pl-10">
        {messages?.length > 0 &&
          messages.map((msg, index) => (
            <div
              key={index}
              className="p-3 rounded-lg mb-2 flex gap-2 items-center justify-start leading-7"
              style={{
                backgroundColor: Colors.CHAT_BACKGROUND,
              }}
            >
              {msg?.role === 'user' && (
                <Image
                  src={userDetail?.picture}
                  alt="userImage"
                  width={35}
                  height={35}
                  className="rounded-full"
                />
              )}
              <ReactMarkdown className="flex flex-col">
                {msg?.content}
              </ReactMarkdown>
            </div>
          ))}
        {loading && (
          <div
            className="p-3 rounded-lg mb-2 flex gap-2 items-center justify-start"
            style={{
              backgroundColor: Colors.CHAT_BACKGROUND,
            }}
          >
            <Loader2Icon className="animate-spin" />
            <h2>Generating response...</h2>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="flex gap-2 items-end">
        {userDetail && (
          <Image
            onClick={toggleSidebar}
            src={userDetail?.picture}
            alt="userImage"
            width={30}
            height={30}
            className="rounded-full cursor-pointer"
          />
        )}
        <div
          className="p-5 border rounded-xl max-w-2xl w-full mt-3"
          style={{
            backgroundColor: Colors.BACKGROUND,
          }}
        >
          <div className="flex gap-2">
            <textarea
              placeholder={Lookup.INPUT_PLACEHOLDER}
              className="outline-none bg-transparent w-full h-32 max-h-56 resize-none"
              onChange={(event) => setUserInput(event.target.value)}
              value={userInput}
            />
            {userInput && (
              <ArrowRight
                onClick={() => onGenerate(userInput)}
                className="bg-blue-500 p-2 w-10 h-10 rounded-md cursor-pointer"
              />
            )}
          </div>
          <div>
            <Link className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatView;