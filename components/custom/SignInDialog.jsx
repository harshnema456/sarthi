"use client";
 
import React, { useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
 
import Lookup from "@/data/Lookup";
import { Button } from "../ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import uuid4 from "uuid4";
import { useRouter } from "next/navigation";
 
function SignInDialog({ openDialog, closeDialog }) {
  const { setUserDetail } = useContext(UserDetailContext);
  const CreateUser = useMutation(api.users.CreateUser);
  const CreateWorkspace = useMutation(api.workspace.CreateWorkspace);
  const router = useRouter();
 
  /* ---------------- GOOGLE LOGIN ---------------- */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: ` Bearer ${tokenResponse?.access_token} `},
          }
        );
 
        const user = userInfo.data;
 
        // Create user in Convex
        const userId = await CreateUser({
          name: user?.name,
          email: user?.email,
          picture: user?.picture,
          uid: uuid4(),
        });
 
        console.log("Convex User ID:", userId);
 
        // Create empty workspace
        const workspaceId = await CreateWorkspace({
          messages: [],
          user: userId,
        });
 
        console.log("Workspace ID:", workspaceId);
 
        // Store locally
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("workspaceId", workspaceId);
        }
 
        // Save in context
        setUserDetail(user);
 
        // Close popup and redirect to Create page (NOT dashboard)
        closeDialog(false);
        router.push("/login/Create");
 
      } catch (err) {
        console.error("Google login error:", err);
      }
    },
 
    onError: (errorResponse) =>
      console.log("Google Login Error:", errorResponse),
  });
 
  return (
  <Dialog open={openDialog} onOpenChange={closeDialog}>
    <DialogContent
      className="
        bg-gradient-to-b from-[#0f2235] to-[#0a1520]
        border border-[#1e3a52]
        rounded-2xl
        shadow-2xl
        text-white
        max-w-md
        p-8
      "
    >
      <DialogHeader>
        <DialogTitle />
        <DialogDescription className="text-gray-300 text-center text-sm">
          {Lookup.SIGNIN_SUBHEADING}
        </DialogDescription>
      </DialogHeader>
 
      <div className="flex flex-col gap-6 mt-6">
        {/* Heading */}
        <h2 className="font-bold text-2xl text-center">
          {Lookup.SIGNIN_HEADING}
        </h2>
 
        {/* Divider like login page */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[#1e3a52]" />
          <span className="text-xs text-gray-400"></span>
          <div className="flex-1 h-px bg-[#1e3a52]" />
        </div>
 
        {/* Google login button — same feel as Sign in */}
       <Button
  onClick={() => googleLogin()}
  className="
    w-full
    flex items-center justify-center gap-3
    py-3
    rounded-lg
    bg-[#10D6C6]
    hover:bg-[#0fcabb]
    text-black
    font-semibold
  "
>
 
 
 
          <div className="flex items-center justify-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.35 11.1H12v2.92h5.26c-.23 1.36-1.07 2.52-2.27 3.3v2.73h3.68c2.16-1.99 3.41-4.9 3.41-8.95 0-.61-.05-1.2-.16-1.78z" />
              <path d="M12 22c2.97 0 5.46-.98 7.28-2.65l-3.68-2.73c-1.02.68-2.33 1.08-3.6 1.08-2.76 0-5.1-1.86-5.93-4.36H2.3v2.77C4.1 19.53 7.79 22 12 22z" />
              <path d="M6.07 13.34a6.95 6.95 0 010-4.68V5.89H2.3a10 10 0 000 12.22l3.77-2.77z" />
              <path d="M12 4.3c1.62 0 3.07.56 4.22 1.66l3.16-3.16C17.45.99 14.97 0 12 0 7.79 0 4.1 2.47 2.3 5.89l3.77 2.77C6.9 6.16 9.24 4.3 12 4.3z" />
            </svg>
            Sign in with Google
          </div>
        </Button>
 
        {/* Agreement text */}
        <p className="text-gray-400  text-center text-xs leading-relaxed">
          {Lookup.SIGNIn_AGREEMENT_TEXT}
        </p>
      </div>
    </DialogContent>
  </Dialog>
);
}
 
export default SignInDialog;