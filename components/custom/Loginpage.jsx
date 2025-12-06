// src/App.jsx
import React, { useState } from "react";
import SignInDialog from "@/components/custom/SignInDialog"; 
export default function App() {
  const [openDialog, setOpenDialog] = useState(false);
  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#020617",
      color: "#f1f5f9",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "0 1rem",
      fontFamily: "sans-serif",
    },
    container: {
      width: "100%",
      maxWidth: "410px",
    },
    logoWrapper: {
      display: "flex",
      alignItems: "center",
      marginBottom: "3rem",
    },
    logoBox: {
      width: "40px",
      height: "40px",
      borderRadius: "16px",
      backgroundColor: "#7C3AED",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "600",
      color: "#fff",
    },
    logoText: {
      marginLeft: "12px",
      fontSize: "18px",
      fontWeight: "600",
      letterSpacing: "-0.5px",
    },
    heading: {
      fontSize: "34px",
      fontWeight: "600",
      marginBottom: "2rem",
      lineHeight: "1.1",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "6px",
      display: "block",
      color: "#e2e8f0",
    },
    input: {
      width: "100%",
      backgroundColor: "#020617",
      border: "1px solid #334155",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "14px",
      color: "#f1f5f9",
      outline: "none",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    forgot: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#38bdf8",
      cursor: "pointer",
      textDecoration: "none",
    },
    between: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "8px",
    },
    button: {
      width: "100%",
      marginTop: "1rem",
      backgroundColor: "#7C3AED",
      padding: "12px 0",
      color: "white",
      fontSize: "14px",
      fontWeight: "600",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
    },
    signupText: {
      marginTop: "1.5rem",
      textAlign: "center",
      fontSize: "14px",
      color: "#94a3b8",
    },
    signupBtn: {
      color: "#38bdf8",
      fontWeight: "500",
      cursor: "pointer",
      background: "none",
      border: "none",
      fontSize: "14px",
      marginLeft: "4px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoWrapper}>
          <div style={styles.logoBox}>HJ</div>
          <span style={styles.logoText}>INHUB</span>
        </div>

        {/* Heading */}
        <h1 style={styles.heading}>
          Log in to your
          <br /> account
        </h1>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {/* Email */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="user@example.com"
              style={styles.input}
            />
          </div>

          {/* Password */}
          <div style={styles.formGroup}>
            <div style={styles.between}>
              <label style={styles.label} htmlFor="password">
                Password
              </label>

              <a style={styles.forgot}>Forgot password?</a>
            </div>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            Log in
          </button>
        </form>

        {/* Sign up link */}
        <p style={styles.signupText}>
          Don’t have an account?
          <button style={styles.signupBtn} onClick={()=>setOpenDialog(true)}>
            Sign up
          </button>
        </p>
      </div>
       <SignInDialog openDialog={openDialog} closeDialog={()=>setOpenDialog(false)} />
    </div>
  );
}