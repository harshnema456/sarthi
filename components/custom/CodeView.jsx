// src/components/custom/CodeView.jsx
"use client";

import React, { useEffect, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import { Loader2Icon, Github } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

function CodeView({ projectFiles }) {
  const { id } = useParams();

  const [files, setFiles] = useState(Lookup.DEFAULT_FILE ?? {});
  const [loading, setLoading] = useState(false);

  // whenever dashboard updates projectFiles, update Sandpack
  useEffect(() => {
    if (projectFiles && Object.keys(projectFiles).length) {
      setFiles(projectFiles);
    }
  }, [projectFiles]);

  const publishToGitHub = async () => {
    try {
      if (!Object.keys(files).length) {
        toast("No files to publish to GitHub");
        return;
      }

      const repoName = `ai-workspace-${id || Date.now()}`;
      setLoading(true);

      const res = await fetch("/api/github-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (error) {
      console.error(error);
      toast("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* HEADER */}
      <div className="codeview-header w-full flex items-center justify-between">
        <div className="font-semibold text-white/70">Code Editor</div>

        {/* GitHub publish */}
        <button onClick={publishToGitHub} className="codeview-publish">
          <Github className="w-4 h-4" /> Publish to GitHub
        </button>
      </div>

      <SandpackProvider
        files={files}
        template="react"
        theme="dark"
        customSetup={{
          dependencies: { ...Lookup.DEPENDANCY },
        }}
        options={{ externalResources: ["https://cdn.tailwindcss.com"] }}
      >
        <SandpackLayout style={{ height: "80vh" }}>
          <SandpackFileExplorer style={{ height: "80vh" }} />
          <SandpackCodeEditor style={{ height: "80vh" }} />
        </SandpackLayout>
      </SandpackProvider>

      {/* LOADING SPINNER */}
      {loading && (
        <div className="codeview-loading-overlay absolute top-0 w-full h-full flex flex-col gap-4 justify-center items-center">
          <Loader2Icon className="animate-spin w-10 h-10 text-white" />
          <h2 className="text-white/80">Processing...</h2>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .codeview-header {
          background: #0c1120;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 10px;
        }
        .codeview-publish {
          background: #1f1f1f;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 8px 14px;
          border-radius: 8px;
          display: flex;
          gap: 8px;
          align-items: center;
          color: white;
        }
        .codeview-publish:hover {
          opacity: .85;
        }
        .codeview-loading-overlay {
          backdrop-filter: blur(4px);
          background: rgba(0,0,0,0.45);
          z-index: 50;
        }
      `}</style>
    </div>
  );
}

export default CodeView;
