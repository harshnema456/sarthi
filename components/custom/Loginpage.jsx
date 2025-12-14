// src/components/LoginPage.jsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import SignInDialog from "@/components/custom/SignInDialog";

/*
  Single-file React login page (JSX).
  - Uses the same Tailwind classes / theme as your uploaded project.
  - Preserves theme, layout, text and background styling.
  - Minimal client-side validation, Convex mutation, and SignInDialog wiring.
*/

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const router = useRouter();
  const createLogin = useMutation(api.logins.createLogin);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      // Call Convex mutation (expect { ok: true } or throw)
      const result = await createLogin({ email, password });

      // If mutation returns ok:false, show message
      if (result && result.ok === false) {
        setError(result.message || "Invalid email or password");
        return;
      }

      // on success, route to dashboard (keeps your original route)
      router.push("/InhubDashboard/default");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1520] text-white">
      {/* Top header - same visual style as your project */}
      <header className="fixed top-0 left-0 right-0 bg-[#0d1b2a] border-b border-[#1e3a52] px-8 py-5 shadow-lg z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00d9c5] to-[#00b8a9] rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-[#0a1520] font-bold text-lg">IH</span>
            </div>
            <span className="text-2xl font-bold">INHUB</span>
          </div>

           </div>
      </header>
      {/* Page content */}
      <main className="pt-24">
        <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            {/* Card */}
            <div className="bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-2xl p-8 shadow-2xl">
              {/* Title */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold mb-2">Log in to your account</h1>
                <p className="text-sm text-gray-300">Welcome back — please enter your details below.</p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#0a1520] border border-[#1e3a52] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9c5] transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-xs text-gray-400 hover:text-[#00d9c5] transition-colors"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#0a1520] border border-[#1e3a52] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9c5] transition-all"
                  />
                </div>

                {error && <p className="text-sm text-[#ff7b7b]">{error}</p>}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" className="accent-[#00d9c5]" />
                    Remember me
                  </label>
                  <a href="#" className="text-sm text-[#00d9c5] hover:text-[#00fff2]">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#00d9c5] to-[#00b8a9] text-[#0a1520] rounded-lg font-bold hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              {/* Or divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[#1e3a52]" />
                <div className="text-xs text-gray-400">Or continue with</div>
                <div className="flex-1 h-px bg-[#1e3a52]" />
              </div>

              {/* Social / alternate sign-in buttons (visual only) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1a2838] border border-[#1e3a52] rounded-lg text-gray-300 hover:border-[#00d9c5] transition-all"
                  onClick={() => {
                    // Keep GitHub visual-only for now
                    console.log("GitHub sign-in clicked");
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline-block" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.41 2.86 8.14 6.84 9.5.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.61-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.9 1.54 2.36 1.1 2.94.84.09-.65.35-1.1.64-1.35-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 7.8c.85.004 1.71.115 2.51.337 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.6 1.03 2.68 0 3.85-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85 0 1.33-.01 2.41-.01 2.74 0 .27.18.59.69.49A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" fill="currentColor"/>
                  </svg>
                  GitHub
                </button>

                <button
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1a2838] border border-[#1e3a52] rounded-lg text-gray-300 hover:border-[#00d9c5] transition-all"
                  onClick={() => {
                    // Map Google button to open the SignInDialog (same routing as old Sign up)
                    setOpenDialog(true);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline-block" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.35 11.1h-9.17v2.92h5.26c-.23 1.36-1.07 2.52-2.27 3.3v2.73h3.68c2.16-1.99 3.41-4.9 3.41-8.95 0-.61-.05-1.2-.16-1.78zM12.18 3.5c1.74 0 3.31.6 4.54 1.8l2.7-2.7C17.34.97 14.86 0 12.18 0 7.85 0 4.07 2.79 2.26 6.82l3.78 2.95C6.57 6.02 9.16 3.5 12.18 3.5z" fill="currentColor"/>
                  </svg>
                  Google
                </button>
              </div>

              {/* Small footer text */}
              <p className="mt-6 text-center text-xs text-gray-400">
                By continuing, you agree to our <a className="text-[#00d9c5]">Terms</a> and <a className="text-[#00d9c5]">Privacy Policy</a>.
              </p>
            </div>

            {/* Bottom small help text */}
            <div className="text-center mt-4 text-sm text-gray-400">
              Don't have an account? <span href="#" className="text-[#00d9c5] cursor-not-allowed opacity-50" >Sign up</span>
            </div>
          </div>
        </section>

        {/* Optional: rest of page sections from your original app can remain below. Kept out to keep file focused on login */}
      </main>

      {/* Footer (kept visually consistent with your design) */}
      <footer className="px-8 py-6 bg-[#0d1b2a] border-t border-[#1e3a52] mt-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2024 INHUB. All rights reserved. Built with innovation and passion.</p>
        </div>
      </footer>

      {/* SignInDialog (same dialog component as you already have) */}
      <SignInDialog openDialog={openDialog} closeDialog={() => setOpenDialog(false)} />
    </div>
  );
}