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
      <DialogContent className="bg-[#0b0b0b] border-gray-800">
        <DialogHeader>
          <DialogTitle />
          <DialogDescription className="text-gray-400 text-center">
            {Lookup.SIGNIN_SUBHEADING}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col justify-center items-center gap-4 mt-3">
          <h2 className="font-bold text-2xl text-center text-white">
            {Lookup.SIGNIN_HEADING}
          </h2>

          {/* Google login */}
          <Button
            className="bg-blue-500 text-white hover:bg-blue-400 w-full"
            onClick={() => googleLogin()}
          >
            Sign in with Google
          </Button>

          <p className="text-gray-500 text-center text-sm mt-3">
            {Lookup.SIGNIn_AGREEMENT_TEXT}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SignInDialog;