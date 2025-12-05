"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    // Clear any session data
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Redirect to login page
    router.push('/login');
    router.refresh();
  };

  return (
    <SignOutButton>
    <button 
      onClick={handleSignOut}
      className="flex items-center gap-2 w-full p-2 text-sm rounded-md hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
    </SignOutButton>
  );
};

export default SignOutButton;