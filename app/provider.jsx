'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import Header from '@/components/custom/Header';
import { MessagesContext } from '@/context/MessagesContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSideBar from '@/components/custom/AppSideBar';
import { ActionContext } from '@/context/ActionContext';
import { useRouter } from 'next/navigation';

function Provider({ children }) {
  // make messages an array by default so components can safely map/length
  const [messages, setMessages] = useState([]);
  const [userDetail, setUserDetail] = useState(null);
  const [action, setAction] = useState(null);
  const router = useRouter();
  const convex = useConvex();

  useEffect(() => {
    void isAuthenticated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAuthenticated = async () => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('user');
    if (!raw) {
      router.push('/');
      return;
    }
    let user = null;
    try {
      user = JSON.parse(raw);
    } catch (e) {
      console.error('Invalid user JSON in localStorage', e);
      localStorage.removeItem('user');
      router.push('/');
      return;
    }
    if (!user?.email) {
      router.push('/');
      return;
    }
    const result = await convex.query(api.users.GetUser, { email: user.email });
    setUserDetail(result);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY || ''}>
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
          <MessagesContext.Provider value={{ messages, setMessages }}>
            <ActionContext.Provider value={{ action, setAction }}>
              <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                <SidebarProvider defaultOpen={false}>
                  <AppSideBar />
                  <main className="w-full">
                    <Header />
                    {children}
                  </main>
                </SidebarProvider>
              </NextThemesProvider>
            </ActionContext.Provider>
          </MessagesContext.Provider>
        </UserDetailContext.Provider>
   
    </GoogleOAuthProvider>
  );
}

export default Provider;