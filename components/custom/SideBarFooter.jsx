'use client';
import { HelpCircle, LogOut, Settings, Wallet } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

function SideBarFooter() {
  const router = useRouter();
  const pathname = usePathname();

  const options = [
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings'
    },
    {
      name: 'Help Center',
      icon: HelpCircle,
      path: '/help-center'
    },
    {
      name: 'My Subscription',
      icon: Wallet,
      path: '/subscription',
    },
  ];

  const handleSignOut = async () => {
    try {
      // Try to use next-auth if available
      if (typeof window !== 'undefined' && window.next?.auth?.signOut) {
        await window.next.auth.signOut({ redirect: false });
      } else if (typeof window !== 'undefined' && window.next?.auth) {
        // Handle case where signOut is directly on auth object
        await window.next.auth.signOut({ redirect: false });
      }
      
      // Clear any local storage or session data if needed
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        sessionStorage.clear();
      }
      
      // Redirect to home page
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path) => {
    return pathname === path ? 'bg-accent' : 'hover:bg-accent/50';
  };

  return (
    <div className="p-2 mb-10">
      {options.map((option, index) => (
        <Button
          key={index}
          variant="ghost"
          className={`w-full flex justify-start my-1 ${isActive(option.path)}`}
          asChild
        >
          <Link href={option.path} className="flex items-center gap-2">
            <option.icon className="h-4 w-4" />
            <span>{option.name}</span>
          </Link>
        </Button>
      ))}
      
      <Button
        onClick={handleSignOut}
        variant="ghost"
        className="w-full flex justify-start my-1 hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
} 

export default SideBarFooter;
