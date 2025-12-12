"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
// import ChatView from "@/components/custom/ChatView";
// import CodeView from "@/components/custom/CodeView";

export default function WorkspacePage({ params }) {
  const workspaceId = params.id;

  // 1️⃣ Fetch workspace data
  const workspace = useQuery(api.workspace.getById, { id: workspaceId });

  // 2️⃣ Fetch project linked to this workspace
  const project = useQuery(api.projects.getByWorkspaceId, {
    workspaceId,
  });

  if (workspace === undefined || project === undefined)
    return <div>Loading...</div>;

  if (!workspace)
    return <div>Workspace not found</div>;

  return (
    <div className="p-3 pr-10 mt-3">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Workspace: {workspaceId}</h1>
        {project ? (
          <p className="text-lg">Project linked: {project.name}</p>
        ) : (
          <p className="text-lg text-red-400">
            No project is linked to this workspace.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* <ChatView /> */}
        <div className="col-span-2">
          {/* <CodeView project={project} /> */}
        </div>
      </div>
    </div>
  );
}
