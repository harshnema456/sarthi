'use client';
import React, { useContext, useEffect, useState } from 'react';

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
} from '@codesandbox/sandpack-react';
import Lookup from '@/data/Lookup';
import { MessagesContext } from '@/context/MessagesContext';
import Prompt from '@/data/Prompt';
import axios from 'axios';
import { useConvex, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { countToken } from './ChatView';
import { UserDetailContext } from '@/context/UserDetailContext';
import { toast } from 'sonner';
import SandpackPreviewClient from './SandpackPreviewClient';
import { ActionContext } from '@/context/ActionContext';

function CodeView() {
  const { id } = useParams();
  const convex = useConvex();

  const [activeTab, setActiveTab] = useState('code');
  const [files, setFiles] = useState(Lookup?.DEFAULT_FILE ?? {});
  const [loading, setLoading] = useState(false);

  const { messages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { action } = useContext(ActionContext);

  const UpdateFiles = useMutation(api.workspace.UpdateFiles);
  const UpdateToken = useMutation(api.users.UpdateToken);

  // auto switch to preview for deploy/export
  useEffect(() => {
    if (action?.actionType === 'deploy' || action?.actionType === 'export') {
      setActiveTab('preview');
    }
  }, [action]);

  // load existing files for workspace
  useEffect(() => {
    if (id) {
      GetFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const GetFiles = async () => {
    try {
      setLoading(true);
      const result = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: id,
      });

      const mergedFiles = {
        ...Lookup.DEFAULT_FILE,
        ...(result?.fileData ?? {}),
      };
      setFiles(mergedFiles);
    } catch (err) {
      console.error('GetFiles error:', err);
      toast('Failed to load workspace files');
    } finally {
      setLoading(false);
    }
  };

  // when user sends a message, auto-generate code
  useEffect(() => {
    if (messages?.length > 0) {
      const last = messages[messages.length - 1];
      const role = last?.role;
      if (role === 'user') {
        GenerateAiCode();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const GenerateAiCode = async () => {
    // token guard
    if (userDetail?.token !== undefined && userDetail.token < 10) {
      toast("You don't have enough token to generate code");
      return;
    }

    if (!messages || messages.length === 0) return;

    setLoading(true);

    try {
      const PROMPT =
        JSON.stringify(messages) + ' ' + (Prompt.CODE_GEN_PROMPT ?? '');
      console.log('[CodeView] CODE PROMPT:', PROMPT);

      const res = await axios.post('/api/gen-ai-code', { prompt: PROMPT });
      const data = res?.data || {};
      console.log('[CodeView] /api/gen-ai-code response:', data);

      // Support both shapes:
      // 1) { files: {...} }
      // 2) { result: { files: {...} } }
      const aiFiles =
        data.files ||
        (data.result && data.result.files) ||
        {};

      if (!aiFiles || typeof aiFiles !== 'object') {
        console.error('AI code API did not return files object:', data);
        toast('AI did not return valid files structure');
        return;
      }

      // merge with default files
      const mergedFiles = {
        ...Lookup.DEFAULT_FILE,
        ...aiFiles,
      };
      setFiles(mergedFiles);

      // save files to DB
      if (id) {
        await UpdateFiles({
          workspaceId: id,
          files: aiFiles,
        });
      }

      // token usage
      const usedTokens = Number(countToken(JSON.stringify(aiFiles)));
      const currentToken = Number(userDetail?.token ?? 0);
      const newToken = currentToken - usedTokens;

      console.log('[CodeView] Tokens used:', usedTokens, 'New token:', newToken);

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
    } catch (err) {
      console.error('GenerateAiCode failed', err?.response?.data || err);
      toast.error?.(
        err?.response?.data?.error || 'Failed to generate code'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="bg-[#181818] w-full p-2 border">
        <div className="flex items-center flex-wrap shrink-0 bg-black p-1 w-[140px] gap-3 justify-center rounded-full">
          <h2
            onClick={() => setActiveTab('code')}
            className={`text-sm cursor-pointer ${
              activeTab === 'code' &&
              'text-blue-500 bg-blue-500 bg-opacity-25 p-1 px-2 rounded-full'
            }`}
          >
            Code
          </h2>
          <h2
            onClick={() => setActiveTab('preview')}
            className={`text-sm cursor-pointer ${
              activeTab === 'preview' &&
              'text-blue-500 bg-blue-500 bg-opacity-25 p-1 px-2 rounded-full'
            }`}
          >
            Preview
          </h2>
        </div>
      </div>

      <SandpackProvider
        files={files}
        template="react"
        theme="dark"
        customSetup={{
          dependencies: {
            ...Lookup.DEPENDANCY,
          },
        }}
        options={{ externalResources: ['https://cdn.tailwindcss.com'] }}
      >
        <SandpackLayout>
          {activeTab === 'code' ? (
            <>
              <SandpackFileExplorer style={{ height: '80vh' }} />
              <SandpackCodeEditor style={{ height: '80vh' }} />
            </>
          ) : (
            <>
              <SandpackPreviewClient />
            </>
          )}
        </SandpackLayout>
      </SandpackProvider>

      {loading && (
        <div className="p-10 bg-gray-900 bg-opacity-80 absolute top-0 w-full h-full flex justify-center items-center">
          <Loader2Icon className="animate-spin w-10 h-10 text-white" />
          <h2>Generating your files...</h2>
        </div>
      )}
    </div>
  );
}

export default CodeView;