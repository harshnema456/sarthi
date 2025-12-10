"use client";

import React, { useEffect, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import { Loader2Icon, Github, Link as LinkIcon, Copy } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

function CodeView({ projectFiles }) {
  const { id } = useParams();

  const [files, setFiles] = useState(Lookup.DEFAULT_FILE ?? {});
  const [loading, setLoading] = useState(false);

  // repo info state
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoBranch, setRepoBranch] = useState("main");

  // whenever dashboard updates projectFiles, update Sandpack
  useEffect(() => {
    if (projectFiles && Object.keys(projectFiles).length) {
      setFiles(projectFiles);
    }
  }, [projectFiles]);

  // load existing repo info for this project (adjust endpoint if needed)
  useEffect(() => {
    if (!id) return;

    const loadRepoInfo = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`); // <-- adjust this endpoint to your actual project metadata endpoint
        if (!res.ok) return;
        const data = await res.json();
        // expect data.githubRepoName and/or data.githubRepoUrl and/or data.githubBranch
        if (data.githubRepoUrl) {
          setRepoUrl(data.githubRepoUrl);
          // extract repo name (last path segment) as fallback
          try {
            const u = new URL(data.githubRepoUrl);
            const name = u.pathname.split("/").filter(Boolean).pop();
            if (name) setRepoName(name);
          } catch {
            // if invalid URL, fall back to provided name
            if (data.githubRepoName) setRepoName(data.githubRepoName);
          }
        } else if (data.githubRepoName) {
          setRepoName(data.githubRepoName);
        }

        if (data.githubBranch) setRepoBranch(data.githubBranch);
      } catch (err) {
        // silent fail — repo info is optional
        // console.debug("loadRepoInfo error", err);
      }
    };

    loadRepoInfo();
  }, [id]);

  const saveRepoMetadata = async (meta = {}) => {
    if (!id) return;
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
    } catch (err) {
      // non-fatal — best-effort
      // console.debug("saveRepoMetadata error", err);
    }
  };

  const publishToGitHub = async () => {
    try {
      if (!Object.keys(files).length) {
        toast("No files to publish to GitHub");
        return;
      }

      const repoNameToUse = repoName || `ai-workspace-${id || Date.now()}`;
      setLoading(true);

      const res = await fetch("/api/github-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoName: repoNameToUse, files, branch: repoBranch }),
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

      // Success: update local repo info (use repoUrl if provided; derive repoName otherwise)
      if (data.repoUrl) {
        setRepoUrl(data.repoUrl);
        try {
          const u = new URL(data.repoUrl);
          const name = u.pathname.split("/").filter(Boolean).pop();
          if (name) setRepoName(name);
        } catch {
          // fallback
          if (data.repoName) setRepoName(data.repoName);
        }
      } else if (data.repoName) {
        setRepoName(data.repoName);
      } else {
        // fallback to what we attempted to publish
        setRepoName(repoNameToUse);
      }

      // persist metadata to project record (best-effort)
      saveRepoMetadata({
        githubRepoName: repoNameToUse,
        githubRepoUrl: data.repoUrl || undefined,
        githubBranch: repoBranch,
      });

      toast("Published successfully!");
      if (data.repoUrl) window.open(data.repoUrl, "_blank");
    } catch (error) {
      console.error(error);
      toast("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const openRepo = () => {
    if (!repoUrl) return toast("No repo URL available");
    window.open(repoUrl, "_blank");
  };

  const copyRepoUrl = async () => {
    if (!repoUrl) return toast("No repo URL to copy");
    try {
      await navigator.clipboard.writeText(repoUrl);
      toast("Repository URL copied to clipboard");
    } catch (err) {
      toast("Unable to copy URL");
    }
  };

  const changeBranch = async () => {
    const newBranch = window.prompt("Enter branch name:", repoBranch || "main");
    if (!newBranch) return;
    setRepoBranch(newBranch);
    // best-effort persist
    saveRepoMetadata({ githubBranch: newBranch });
    toast(`Branch set to ${newBranch}`);
  };

  return (
    <div className="relative">
      {/* HEADER */}
      <div className="codeview-header w-full flex items-center justify-between">
        <div className="font-semibold text-white/70">Code Editor</div>

        <div className="flex items-center gap-3">
          {/* repo display (left side of publish button) */}
          <div className="repo-info text-sm text-white/70 flex items-center gap-2">
            {repoName ? (
              <>
                {repoUrl ? (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="repo-link underline-offset-2 hover:underline"
                  >
                    {repoName}
                  </a>
                ) : (
                  <span>{repoName}</span>
                )}

                {/* quick action buttons for repo */}
                <button
                  onClick={openRepo}
                  title="Open repository"
                  className="repo-action ml-2 px-2 py-1 rounded"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={copyRepoUrl}
                  title="Copy repository URL"
                  className="repo-action px-2 py-1 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={changeBranch}
                  title="Change branch"
                  className="repo-action px-2 py-1 rounded"
                >
                  <span className="text-xs">{repoBranch}</span>
                </button>
              </>
            ) : (
              <span className="text-white/40">No repo</span>
            )}
          </div>

          {/* GitHub publish */}
          <button onClick={publishToGitHub} className="codeview-publish">
            <Github className="w-4 h-4" /> Publish to GitHub
          </button>
        </div>
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
        .repo-info a {
          color: rgba(255,255,255,0.85);
          text-decoration: none;
        }
        .repo-info a:hover {
          text-decoration: underline;
        }
        .repo-action {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.04);
          margin-left: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }
        .repo-action:hover { opacity: .9 }
      `}</style>
    </div>
  );
}

export default CodeView;