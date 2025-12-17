// src/components/LoginPage.jsx
"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a1520] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#0d1b2a] border-b border-[#1e3a52] px-8 py-5 shadow-lg z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto flex items-center gap-5">
          <div className="h-16 overflow-hidden flex items-center">
            <img
              src="/logo.png"
              alt="INHUB Logo"
              className="h-36 w-auto bg-transparent mix-blend-lighten"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-28">
        <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-2xl p-6 shadow-2xl">
             <SignIn redirectUrl="/auth/callback" />

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 bg-[#0d1b2a] border-t border-[#1e3a52]">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2025 INHUB. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
