"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SignIn } from "@clerk/nextjs";

function SignInDialog({ openDialog, closeDialog }) {
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
          p-6
        "
      >
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#10D6C6",
              colorBackground: "#0a1520",
              colorText: "#ffffff",
              colorInputBackground: "#0a1520",
              colorInputText: "#ffffff",
            },
            elements: {
              card: "bg-transparent shadow-none",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-300",
              socialButtonsBlockButton:
                "bg-[#1a2838] border border-[#1e3a52] text-gray-300 hover:border-[#10D6C6]",
              formButtonPrimary:
                "bg-[#10D6C6] text-black font-semibold",
              footerActionText: "text-gray-400",
              footerActionLink: "text-[#10D6C6]",
            },
          }}
          redirectUrl="app/auth/callback/page.jsx"
        />
      </DialogContent>
    </Dialog>
  );
}

export default SignInDialog;
