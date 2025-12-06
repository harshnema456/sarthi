"use client";
import React, { useState } from "react";
import SignInDialog from "@/components/custom/SignInDialog";

export default function LoginPage() {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <div className="login-page">
      <div className="login-box">
        {/* Logo */}
        <div className="logo-wrap">
          <div className="logo-box">HJ</div>
          <span className="logo-text">INHUB</span>
        </div>

        {/* Title */}
        <h1 className="login-title">
          Log in to your
          <br /> account
        </h1>

        {/* Social Login */}
        <button className="social-btn">Sign in with Google</button>
        <button className="social-btn">Sign in with Apple</button>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()}>
          <input className="input" type="email" placeholder="user@example.com" />
          <div className="password-line">
            <input
              className="input"
              type="password"
              placeholder="••••••••"
            />
            <a className="forgot">Forgot password?</a>
          </div>
          <button className="login-btn" type="submit">
            Log in
          </button>
        </form>

        <p className="signup">
          Don’t have an account?{" "}
          <button className="signup-btn" onClick={() => setOpenDialog(true)}>
            Sign up
          </button>
        </p>
      </div>

      <SignInDialog openDialog={openDialog} closeDialog={() => setOpenDialog(false)} />

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #020617;
          color: #f8fafc;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: Inter, sans-serif;
          padding: 1rem;
        }
        .login-box {
          width: 100%;
          max-width: 410px;
          text-align: center;
        }
        .logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2.5rem;
        }
        .logo-box {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: #7c3aed;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 12px;
        }
        .logo-text {
          font-size: 18px;
          font-weight: 600;
        }
        .login-title {
          font-size: 34px;
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 2.2rem;
        }
        .social-btn {
          background: white;
          color: black;
          font-size: 15px;
          font-weight: 500;
          width: 100%;
          border-radius: 28px;
          padding: 12px 0;
          border: none;
          cursor: pointer;
          margin-bottom: 0.8rem;
        }
        .divider {
          width: 100%;
          text-align: center;
          margin: 1.2rem 0;
          color: #64748b;
          font-size: 14px;
          position: relative;
        }
        .divider span {
          background: #020617;
          padding: 0 10px;
        }
        .divider:before,
        .divider:after {
          content: "";
          height: 1px;
          background: #334155;
          position: absolute;
          top: 50%;
          width: 42%;
        }
        .divider:before {
          left: 0;
        }
        .divider:after {
          right: 0;
        }
        .input {
          width: 100%;
          background: #020617;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 14px;
          font-size: 15px;
          color: white;
          margin-bottom: 1rem;
        }
        .password-line {
          position: relative;
        }
        .forgot {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          color: #38bdf8;
          cursor: pointer;
        }
        .login-btn {
          width: 100%;
          background: #7c3aed;
          border: none;
          border-radius: 12px;
          padding: 14px 0;
          font-size: 16px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        .signup {
          margin-top: 1.6rem;
          color: #9ca3af;
          font-size: 14px;
        }
        .signup-btn {
          background: none;
          border: none;
          color: #38bdf8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-left: 4px;
        }
      `}</style>
    </div>
  );
}
