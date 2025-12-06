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
  const router = useRouter();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // 1) Get Google user profile
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse?.access_token}`,
            },
          }
        );

        const user = userInfo.data;

        // 2) Create / upsert user in Convex
        const created = await CreateUser({
          name: user?.name,
          email: user?.email,
          picture: user?.picture,
          uid: uuid4(), // your own UID
        });

        console.log("Convex CreateUser result:", created);

        // 3) Store in localStorage + context
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
        }
        setUserDetail(user);

        // 4) Close dialog
        closeDialog(false);

        // 5) Build dynamic dashboard route
        const createdId =
          created?.id || created?._id || created || user?.sub || user?.email;

        
        router.push(`/InhubDashboard/${createdId}`);
      } catch (err) {
        console.error("Login error:", err);
      }
    },

    onError: (errorResponse) => console.log("Google Login Error:", errorResponse),
  });

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

              <Button
                className="bg-blue-500 text-white hover:bg-blue-400 mt-3"
                onClick={() => googleLogin()}
              >
                Sign In With Google
              </Button>

              <p className="text-gray-500 text-center text-sm">
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