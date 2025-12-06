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
            headers: { Authorization: `Bearer ${tokenResponse?.access_token}` },
          }
        );

        const user = userInfo.data;
        console.log("Google User Info:", user);
        const userId = await CreateUser({
        name: user?.name,
        email: user?.email,
        picture: user?.picture,
        uid: uuid4(),
});

console.log("Convex User ID:", userId);

const workspaceId = await CreateWorkspace({
  messages: [],
  user: userId, // MUST be convex id, not google id
});


        console.log("Workspace ID:", workspaceId);
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
        }
        setUserDetail(user);
        closeDialog(false);

        const createdId = userId || user?.sub || user?.email;
        console.log("Navigating to workspace with ID:", workspaceId);
        router.push(`/InhubDashboard/${workspaceId}`);
      } catch (err) {
        console.error("Google login error:", err);
      }
    },
    onError: (errorResponse) => console.log("Google Login Error:", errorResponse),
  });

  /* ---------------- GITHUB LOGIN ---------------- */
  const handleGithubLogin = () => {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user%20user:email`;
    window.location.href = url;
  };

  return (
    <Dialog open={openDialog} onOpenChange={closeDialog}>
      <DialogContent className="bg-[#0b0b0b] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white"></DialogTitle>
          <DialogDescription>
            <div className="flex flex-col justify-center items-center gap-3">
              <h2 className="font-bold text-2xl text-center text-white">
                {Lookup.SIGNIN_HEADING}
              </h2>

              <p className="mt-2 text-center text-gray-400">
                {Lookup.SIGNIN_SUBHEADING}
              </p>

              {/* Google login */}
              <Button
                className="bg-blue-500 text-white hover:bg-blue-400 w-full"
                onClick={() => googleLogin()}
              >
                Sign in with Google
              </Button>

              {/* GitHub login */}
              <Button
                className="bg-gray-800 text-white hover:bg-gray-700 w-full"
                onClick={handleGithubLogin}
              >
                Sign in with GitHub
              </Button>

              <p className="text-gray-500 text-center text-sm mt-3">
                {Lookup.SIGNIn_AGREEMENT_TEXT}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default SignInDialog;
