"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessagesContext } from "@/context/MessagesContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import Prompt from "@/data/Prompt";
import Lookup from "@/data/Lookup";
import {
  ArrowRight,
  Loader2Icon,
  Trash2,
  Link,
} from "lucide-react";

/* ---------------- TOKEN COUNTER ---------------- */
export const countToken = (inputText) => {
  if (!inputText) return 0;
  return String(inputText).trim().split(/\s+/).filter(Boolean).length;
};

export default function ChatView({ openCode, projectId, initialPrompt }) {
  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);

  const [userInput, setUserInput] = useState(initialPrompt || "");
  const [loading, setLoading] = useState(false);

  const UpdateToken = useMutation(api.users.UpdateToken);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const pendingAiMessagesRef = useRef(null);

  /* ---------------- HELPERS ---------------- */

  function safeExtractResultText(data) {
    if (!data) return null;
    if (typeof data.result === "string" && data.result.trim()) return data.result;
    if (data.response?.text?.trim()) return data.response.text;

    if (Array.isArray(data.response?.candidates)) {
      return data.response.candidates
        .map((c) => c.text || c.content)
        .filter(Boolean)
        .join("\n\n");
    }
    return null;
  }

  /* ---------------- AI CALL ---------------- */

  async function callAi(currentMessages) {
    if (!currentMessages?.length) return;
    if (!projectId) return;

    setLoading(true);
    const PROMPT =
      JSON.stringify(currentMessages) + " " + Prompt.CHAT_PROMPT;

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: PROMPT }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const data = await response.json();
      const textResult = safeExtractResultText(data);
      if (!textResult) throw new Error("Empty AI response");

      const aiMsg = {
        role: "ai",
        content: textResult,
        timestamp: new Date().toISOString(),
      };

      const newMessages = [...currentMessages, aiMsg];
      setMessages(newMessages);

      // token accounting
      try {
        const used = countToken(JSON.stringify(aiMsg));
        const newToken = (userDetail?.token ?? 0) - used;
        setUserDetail((p) => ({ ...(p || {}), token: newToken }));
        if (userDetail?._id) {
          UpdateToken({ userId: userDetail._id, token: newToken });
        }
      } catch {}

      // code generation
      try {
     const codeRes = await fetch("/api/gen-ai-code", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: currentMessages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n"),
  }),
});


        if (codeRes.ok) {
          const codeData = await codeRes.json();
          if (codeData?.files) {
            window.dispatchEvent(
              new CustomEvent("AI_FILES_READY", {
                detail: {
                  files: codeData.files,
                  projectId,
                  title: "Chat generated project",
                },
              })
            );
            openCode?.();
          }
        }
      } catch (e) {
        console.error("gen-ai-code failed", e);
      }
    } catch (err) {
      console.error("callAi error", err);
      toast.error("AI generation failed");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- SEND MESSAGE ---------------- */

  function sendUserMessage(content) {
    const text = String(content).trim();
    if (!text) return;

    if (!projectId) {
      toast.error("Create or open a project first");
      return;
    }

    if ((userDetail?.token ?? 0) < 10) {
      toast.error("Not enough tokens");
      return;
    }

    const newMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...(prev || []), newMessage];
      pendingAiMessagesRef.current = updated;
      return updated;
    });

    setUserInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function clearConversation() {
    setMessages([]);
    toast.success("Conversation cleared");
  }

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {
    if (!pendingAiMessagesRef.current) return;
    const msgs = pendingAiMessagesRef.current;
    pendingAiMessagesRef.current = null;
    callAi(msgs);
  }, [messages]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const pending = localStorage.getItem("pendingPrompt");
    if (pending) {
      localStorage.removeItem("pendingPrompt");
      sendUserMessage(pending);
    }
  }, []);

  /* ---------------- RENDER ---------------- */

  return (
    <div className="h-[83vh] flex flex-col">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#071127]">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Chat</h3>

          <div className="inline-flex items-center gap-2 bg-[#0b1624] px-3 py-1 rounded border border-slate-800 text-sm text-slate-300">
            <span>{messages?.length ?? 0} msgs</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#0b1624] px-3 py-1 rounded border border-slate-800 text-sm text-slate-300">
            <span>Tokens:</span>
            <span className="font-medium">
              {userDetail?.token ?? 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearConversation}
            className="p-2 rounded bg-[#0f1724] border border-slate-800"
          >
            <Trash2 size={16} />
          </button>
          <button className="p-2 rounded bg-[#0f1724] border border-slate-800">
            <Link size={16} />
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6"
        style={{ background: "#0b0b0c" }}
      >
        <div className="mx-auto max-w-6xl">
          {!messages || messages.length === 0 ? (
            <div className="text-slate-400 italic">
              No messages yet — start the conversation
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="mb-4">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-2 mt-4">
              <Loader2Icon className="animate-spin" />
              Generating…
            </div>
          )}
        </div>
      </div>

      {/* INPUT */}
      <div className="px-6 pb-6 pt-2 bg-[#0f1318] border-t border-slate-800">
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) =>
            (e.ctrlKey || e.metaKey) &&
            e.key === "Enter" &&
            sendUserMessage(userInput)
          }
          placeholder={Lookup.INPUT_PLACEHOLDER}
          className="w-full bg-transparent resize-none outline-none text-slate-100 min-h-[84px]"
          disabled={loading}
        />

        <div className="mt-3 flex justify-end">
          <button
            onClick={() => sendUserMessage(userInput)}
            disabled={loading || !userInput.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#2b66d6]"
          >
            {loading ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
            <span>Generate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
