// src/components/WorkspaceHistory.jsx
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
  const [loading, setLoading] = useState(false);
  const convex = useConvex();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    if (userDetail) fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetail]);

  const fetchWorkspaces = async () => {
    if (!convex) {
      console.warn("Convex client not ready");
      setWorkspaceList([]);
      return;
    }
    setLoading(true);
    try {
      const result = await convex.query(api.workspace.GetAllWorkspace, { userId: userDetail?._id });
      setWorkspaceList(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
      setWorkspaceList([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (workspace) => {
    const possible =
      workspace?.updatedAt ||
      workspace?.lastUpdated ||
      workspace?._creationTime ||
      workspace?.messages?.[0]?.CreatedAt ||
      workspace?.messages?.[0]?.timestamp;
    if (!possible) return 'Unknown';
    const d = new Date(possible);
    if (isNaN(d.getTime())) return String(possible).slice(0, 16);
    return d.toLocaleDateString();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-slate-300 text-sm">Chats • {workspaceList.length}</div>
        <div>
          <button onClick={fetchWorkspaces} className="px-3 py-1 rounded bg-slate-700 text-xs">Refresh</button>
        </div>
      </div>

      <div className="bg-slate-800/60 rounded-2xl p-6 max-h-[72vh] overflow-y-auto custom-scrollbar">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : workspaceList.length === 0 ? (
          <p className="text-slate-400 text-sm">No chats yet</p>
        ) : (
          <div className="space-y-4">
            {workspaceList.map((workspace) => {
              const id = workspace._id || workspace.id || workspace.workspaceId;
              const rawTitle =
                workspace?.messages?.[0]?.content ||
                workspace?.title ||
                'Untitled Chat';
              const title =
                String(rawTitle).length > 60
                  ? String(rawTitle).slice(0, 60) + '…'
                  : String(rawTitle);
              const last = formatDate(workspace);

              return (
                <Link href={`/inhubdashboard/${id}`} key={id} onClick={toggleSidebar} className="block">
                  <div className="flex flex-col justify-center gap-1 p-4 pl-6 bg-slate-900/70 rounded-l-md rounded-r-xl hover:bg-slate-900/90 transition">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white leading-tight">
                        {title}
                      </h3>
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}

export default WorkspaceHistory;
