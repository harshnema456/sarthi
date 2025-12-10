// src/components/LoginPage.jsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import SignInDialog from "@/components/custom/SignInDialog";

export default function LoginPage() {
  const [openDialog, setOpenDialog] = useState(false);

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UX state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const router = useRouter();

  // convex mutation: file should be convex/logins.js
  const createLogin = useMutation(api.logins.createLogin);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || loading) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      // 1️⃣ Ask Convex to validate & (optionally) save this login
      //    Your convex/logins.js should either:
      //    - return { ok: true, ... } on success, OR
      //    - throw an Error("Invalid email or password") on failure
      const result = await createLogin({ email, password });

      // If your mutation returns a flag, respect it:
      if (result && result.ok === false) {
        setErrorMsg("Invalid email or password");
        return; // ⛔ don't go to dashboard
      }

      // 2️⃣ Only if Convex succeeded → go to dashboard route
      router.push("/InhubDashboard/default");
    } catch (err) {
      console.error(err);
      // Convex throws for invalid login: show a friendly message
      setErrorMsg(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !email || !password;

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-box">
          {/* Logo - HJ icon removed, keep INHUB text */}
          <div className="logo-wrap">
            <span className="logo-text">INHUB</span>
          </div>

          {/* Title */}
          <h1 className="login-title">
            Log in to your
            <br /> account
          </h1>

          <div className="divider">
            <span></span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <input
              className="input"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="password-group">
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="forgot-wrap">
                <a className="forgot">Forgot password?</a>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={isDisabled}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          {errorMsg && (
            <p
              style={{
                marginTop: "0.75rem",
                color: "#f97373",
                fontSize: 13,
              }}
            >
              {errorMsg}
            </p>
          )}

          <p className="signup">
            Don’t have an account?{" "}
            <button
              className="signup-btn"
              onClick={() => setOpenDialog(true)}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      <SignInDialog
        openDialog={openDialog}
        closeDialog={() => setOpenDialog(false)}
      />

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: radial-gradient(
            circle at top left,
            #0f172a 0,
            #020617 50%,
            #020617 100%
          );
          color: #f8fafc;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          padding: 1.5rem;
        }

        .login-shell {
          width: 100%;
          max-width: 460px;
          padding: 2px;
          border-radius: 28px;
          background: linear-gradient(
            135deg,
            rgba(129, 140, 248, 0.8),
            rgba(236, 72, 153, 0.7),
            rgba(56, 189, 248, 0.7)
          );
          box-shadow: 0 28px 60px rgba(15, 23, 42, 0.9);
        }

        .login-box {
          border-radius: 26px;
          background: radial-gradient(
            circle at top,
            #020617,
            #020617 40%,
            #020617 100%
          );
          backdrop-filter: blur(18px);
          padding: 2.6rem 2.4rem 2.3rem;
          text-align: center;
          box-shadow:
            0 18px 40px rgba(15, 23, 42, 0.95),
            0 0 0 1px rgba(148, 163, 184, 0.1);
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.2rem; /* tightened spacing after removing icon */
        }

        .logo-text {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.09em;
          color: #e6eef8;
        }

        .login-title {
          font-size: 32px;
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 2rem;
        }

        .divider {
          width: 100%;
          text-align: center;
          margin: 1.4rem 0 1.8rem;
          color: #64748b;
          font-size: 13px;
          position: relative;
        }
        .divider span {
          background: #020617;
          padding: 0 10px;
          position: relative;
          z-index: 1;
        }
        .divider:before,
        .divider:after {
          content: "";
          height: 1px;
          background: linear-gradient(
            to right,
            rgba(148, 163, 184, 0),
            rgba(148, 163, 184, 0.6),
            rgba(148, 163, 184, 0)
          );
          position: absolute;
          top: 50%;
          width: 40%;
        }
        .divider:before {
          left: 0;
        }
        .divider:after {
          right: 0;
        }

        .input {
          width: 100%;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(51, 65, 85, 0.9);
          border-radius: 14px;
          padding: 13px 14px;
          font-size: 14px;
          color: #e5e7eb;
          margin-bottom: 1rem;
          outline: none;
          transition: border-color 0.16s ease, box-shadow 0.16s ease,
            background 0.16s ease, transform 0.08s ease;
        }
        .input::placeholder {
          color: #6b7280;
        }
        .input:focus {
          border-color: #7c3aed;
          box-shadow:
            0 0 0 1px rgba(124, 58, 237, 0.7),
            0 18px 40px rgba(15, 23, 42, 0.9);
          background: rgba(15, 23, 42, 0.98);
          transform: translateY(-1px);
        }

        .password-group {
          margin-bottom: 1.2rem;
        }

        .forgot-wrap {
          text-align: right;
          margin-top: 0.25rem;
        }

        .forgot {
          font-size: 13px;
          color: #38bdf8;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .forgot:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          border-radius: 14px;
          padding: 14px 0;
          font-size: 15px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          margin-top: 0.3rem;
          box-shadow: 0 14px 30px rgba(124, 58, 237, 0.7);
          transition: transform 0.12s ease, box-shadow 0.12s ease,
            filter 0.12s ease;
        }
        .login-btn:hover:enabled {
          transform: translateY(-1px);
          box-shadow: 0 18px 38px rgba(124, 58, 237, 0.9);
          filter: brightness(1.03);
        }
        .login-btn:active:enabled {
          transform: translateY(1px);
          box-shadow: 0 10px 22px rgba(124, 58, 237, 0.7);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signup {
          margin-top: 1.6rem;
          color: #9ca3af;
          font-size: 13px;
        }
        .signup-btn {
          background: none;
          border: none;
          color: #38bdf8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          margin-left: 4px;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .signup-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        @media (max-width: 480px) {
          .login-shell {
            max-width: 100%;
          }
          .login-box {
            padding: 2.1rem 1.6rem 2rem;
          }
          .login-title {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}