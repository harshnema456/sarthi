'use client';

import { UserDetailContext } from '@/context/UserDetailContext';
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import Link from 'next/link';
import React, { useContext, useEffect, useState } from 'react';
import { useSidebar } from '../ui/sidebar';

function WorkspaceHistory() {
  const { userDetail } = useContext(UserDetailContext);
  const [workspaceList, setWorkspaceList] = useState([]);
  const convex = useConvex();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    if (userDetail) fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetail]);

  const fetchWorkspaces = async () => {
    try {
      const result = await convex.query(api.workspace.GetAllWorkspace, {
        userId: userDetail?._id,
      });
      // ensure array
      setWorkspaceList(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
      setWorkspaceList([]);
    }
  };

  // small helper to get readable date
  const formatDate = (workspace) => {
    const possible =
      workspace?.updatedAt ||
      workspace?.lastUpdated ||
      workspace?._creationTime ||
      workspace?.messages?.[0]?.createdAt ||
      workspace?.messages?.[0]?.timestamp;
    if (!possible) return 'Unknown';
    const d = new Date(possible);
    if (isNaN(d.getTime())) return String(possible).slice(0, 16);
    return d.toLocaleDateString();
  };

  return (
    <div className="w-full">
      {/* Page title area — keep it lightweight in case parent already renders Projects header */}
      <div className="mb-6">
      </div>

      {/* Dark rounded panel containing the list (matches screenshot) */}
      <div className="bg-slate-800/60 rounded-2xl p-6 max-h-[72vh] overflow-y-auto custom-scrollbar">
        {/* When no chats */}
        {workspaceList.length === 0 ? (
          <p className="text-slate-400 text-sm">No chats yet</p>
        ) : (
          <div className="space-y-4">
            {workspaceList.map((workspace) => {
              const id = workspace._id || workspace.id || workspace.workspaceId;
              const rawTitle = workspace?.messages?.[0]?.content || workspace?.title || 'Untitled Chat';
              const title = String(rawTitle).length > 60 ? String(rawTitle).slice(0, 60) + '…' : String(rawTitle);
              const last = formatDate(workspace);

              return (
                <Link
                  href={`/workspace/${id}`}
                  key={id}
                  onClick={toggleSidebar}
                  className="block"
                >
                  {/* Pill-like item with rounded left cut and very rounded right edges */}
                  <div className="flex flex-col justify-center gap-1 p-4 pl-6 bg-slate-900/70 rounded-l-md rounded-r-xl hover:bg-slate-900/90 transition">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white leading-tight">
                        {title}
                      </h3>
                      {/* optional status badge placeholder (keeps layout like screenshot) */}
                      {/* <span className="text-xs text-slate-400">Open</span> */}
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      Last updated: {last}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        /* small custom scrollbar so it feels like screenshot */
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.06);
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}

export default WorkspaceHistory;
