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
import { Loader2Icon, Github } from 'lucide-react';
import { countToken } from './ChatView';
import { UserDetailContext } from '@/context/UserDetailContext';
import { toast } from 'sonner';
import { ActionContext } from '@/context/ActionContext';

function CodeView() {
  const { id } = useParams();
  const convex = useConvex();

  const [files, setFiles] = useState(Lookup?.DEFAULT_FILE ?? {});
  const [loading, setLoading] = useState(false);

  const { messages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { action } = useContext(ActionContext);

  const UpdateFiles = useMutation(api.workspace.UpdateFiles);
  const UpdateToken = useMutation(api.users.UpdateToken);

  useEffect(() => {
    if (id) GetFiles();
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
      toast('Failed to load workspace files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages?.length > 0) {
      const last = messages[messages.length - 1];
      if (last?.role === 'user') GenerateAiCode();
    }
  }, [messages]);

  const GenerateAiCode = async () => {
    if (userDetail?.token !== undefined && userDetail.token < 10) {
      toast("You don't have enough token to generate code");
      return;
    }

    if (!messages?.length) return;

    setLoading(true);

    try {
      const PROMPT =
        JSON.stringify(messages) + ' ' + (Prompt.CODE_GEN_PROMPT ?? '');

      const res = await axios.post('/api/gen-ai-code', { prompt: PROMPT });
      const data = res?.data || {};

      const aiFiles =
        data.files || (data.result && data.result.files) || {};

      const mergedFiles = {
        ...Lookup.DEFAULT_FILE,
        ...aiFiles,
      };

      setFiles(mergedFiles);

      if (id) {
        await UpdateFiles({
          workspaceId: id,
          files: aiFiles,
        });
      }

      const used = Number(countToken(JSON.stringify(aiFiles)));
      const newToken = Number(userDetail?.token ?? 0) - used;

      setUserDetail((p) => ({ ...(p ?? {}), token: newToken }));

      if (userDetail?._id) {
        await UpdateToken({
          token: newToken,
          userId: userDetail._id,
        });
      }
    } catch {
      toast("Failed to generate code");
    } finally {
      setLoading(false);
    }
  };

  const publishToGitHub = async () => {
    try {
      if (!Object.keys(files).length)
        return toast('No files to publish to GitHub');

      if (!userDetail?.name)
        return toast('Please sign in before publishing to GitHub');

      const repoName = `ai-workspace-${id || Date.now()}`;
      setLoading(true);

      const res = await fetch('/api/github-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName, files }),
      });

      const raw = await res.text();
      let data = null;

      try {
        data = JSON.parse(raw);
      } catch {
        toast("GitHub publish failed");
        return;
      }

      if (!data.success) {
        toast(data?.error || "GitHub publish failed");
        return;
      }

      toast("Published successfully!");
      if (data.repoUrl) window.open(data.repoUrl, "_blank");
    } catch {
      toast("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">

      {/* HEADER */}
      <div className="codeview-header w-full flex items-center justify-between">

        {/* FIXED LABEL (NO PREVIEW TAB ANYMORE) */}
        <h2 className="codeview-tab-active px-4 py-1 text-sm">Code</h2>

        {/* GitHub publish */}
        <button onClick={publishToGitHub} className="codeview-publish">
          <Github className="w-4 h-4" /> Publish to GitHub
        </button>
      </div>

      {/* CODE EDITOR ONLY */}
      <SandpackProvider
        files={files}
        template="react"
        theme="dark"
        customSetup={{
          dependencies: { ...Lookup.DEPENDANCY },
        }}
      >
        <SandpackLayout>
          <SandpackFileExplorer
            className="sandpack-explorer sandpack-fullheight"
            style={{ height: '80vh' }}
          />

          <SandpackCodeEditor
            className="sandpack-fullheight sandpack-editor-bg"
            style={{ height: '80vh' }}
          />
        </SandpackLayout>
      </SandpackProvider>

      {/* LOADER */}
      {loading && (
        <div className="codeview-loading-overlay absolute top-0 w-full h-full flex flex-col gap-4 justify-center items-center">
          <Loader2Icon className="animate-spin w-10 h-10 text-white" />
          <h2 className="text-white/80">Processing...</h2>
        </div>
      )}

      {/* INLINE CSS */}
      <style>{`
        .codeview-header {
          background: #0c1120;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 10px;
        }
        .codeview-tab-active {
          color: #3b82f6;
          background: rgba(59,130,246,0.15);
          padding: 6px 14px;
          border-radius: 999px;
          font-weight: 600;
        }
        .codeview-publish {
          background: #1f1f1f;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 8px 14px;
          border-radius: 8px;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .codeview-loading-overlay {
          backdrop-filter: blur(4px);
          background: rgba(0,0,0,0.45);
          z-index: 50;
        }
        .sandpack-explorer {
          background: #1a1e31 !important;
        }
        .sandpack-editor-bg {
          background: #0d0f14 !important;
        }
        .sandpack-fullheight {
          height: 80vh;
        }
      `}</style>

    </div>
  );
}

export default CodeView;
