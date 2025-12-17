'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import { ActionContext } from '@/context/ActionContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';

function Provider({ children }) {
  const [messages, setMessages] = useState([]);
  const [userDetail, setUserDetail] = useState(null);
  const [action, setAction] = useState(null);

  const { user, isLoaded, isSignedIn } = useUser();
  const convex = useConvex();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace('/login');
      return;
    }

    void syncUserWithConvex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

const syncUserWithConvex = async () => {
  if (!user) return;

  // 1. Ensure user exists (idempotent)
  const userId = await convex.mutation(api.users.CreateUser, {
    name: user.fullName ?? user.username ?? "User",
    email: user.primaryEmailAddress?.emailAddress ?? "",
    picture: user.imageUrl,
    uid: user.id, // Clerk UID
  });

  // 2. Fetch user BY UID (NOT EMAIL)
  const convexUser = await convex.query(api.users.GetUserByUid, {
    uid: user.id,
  });

  setUserDetail(convexUser);
};


  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <MessagesContext.Provider value={{ messages, setMessages }}>
        <ActionContext.Provider value={{ action, setAction }}>
          <NextThemesProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider defaultOpen={false}>
              <main className="w-full">
                {children}
              </main>
            </SidebarProvider>
          </NextThemesProvider>
        </ActionContext.Provider>
      </MessagesContext.Provider>
    </UserDetailContext.Provider>
  );
}

export default Provider;
