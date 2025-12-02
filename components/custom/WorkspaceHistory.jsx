'use client';
import { UserDetailContext } from '@/context/UserDetailContext';
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import Link from 'next/link';
import React, { useContext, useEffect, useState } from 'react';
import { useSidebar } from '../ui/sidebar';
// WorkspaceHistory component
function WorkspaceHistory() {
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [workspaceList, setWorkSpaceList] = useState(); // state for list of workspaces
  const convex = useConvex(); // convex client
  const { toggleSidebar } = useSidebar(); // sidebar toggle
// fetch all workspaces when userDetail changes
  useEffect(() => {
    userDetail && GetAllWorkspace();
  }, [userDetail]);
// function to get all workspaces for the user
  const GetAllWorkspace = async () => {
    const result = await convex.query(api.workspace.GetAllWorkspace, {
      userId: userDetail?._id,
    });
    setWorkSpaceList(result);
  };
// render workspace history
  return (
    <div>
      <h2 className="font-medium text-lg">Your Chats</h2>
      <div>
        {workspaceList &&
          workspaceList?.map((workspace, index) => (
            <Link key={index} href={'/workspace/' + workspace?._id}>
              <h2 onClick={toggleSidebar} className="text-sm text-gray-400 mt-2 font-light hover:text-white cursor-pointer">
                {workspace?.messages[0]?.content}
              </h2>
            </Link>
          ))}
      </div>
    </div>
  );
}

export default WorkspaceHistory;
