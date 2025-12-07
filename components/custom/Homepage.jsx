"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function App() {
  const router = useRouter();
  const [active, setActive] = useState("process");

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  const handleRoute = () =>
     router.push("/login");

  return (
    <div className="app-root">
      <header className="navbar" role="navigation" aria-label="Main nav">
        <div className="logo">INHUB</div>
        <nav className="nav" aria-label="Primary">
          <button
  className={`nav-link ${active === "process" ? "active" : ""}`}
  onClick={() => scrollTo("process")}
>
  Process flow
</button>

<button
  className={`nav-link ${active === "about" ? "active" : ""}`}
  onClick={() => scrollTo("about")}
>
  About us
</button>

<button
  className={`nav-link ${active === "contact" ? "active" : ""}`}
  onClick={() => scrollTo("contact")}
>
  Contact us
</button>

        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <svg
            className="bg-tech"
            viewBox="0 0 1200 600"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0" stopColor="#2ea1c9" stopOpacity="0.12" />
                <stop offset="1" stopColor="#6f2bdc" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <g fill="none" stroke="url(#g1)" strokeWidth="1.2" strokeLinecap="round">
              <path d="M80 120h360M480 160h560M80 200h240M420 240h720" />
              <circle cx="680" cy="100" r="6" />
              <circle cx="880" cy="220" r="5" />
              <path d="M680 100v120h120" />
            </g>
          </svg>

          <h1 id="hero-title" className="hero-title">
            Design Your Website
          </h1>

          <div className="create-box" onClick={handleRoute}>
            <span>Create new project</span>
            <span className="plus-icon" aria-hidden="true">
              +
            </span>
          </div>

          <article className="card" aria-labelledby="build-title">
            <svg
              className="tech-lines"
              viewBox="0 0 300 180"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <g stroke="#2ea1c9" strokeWidth="1.2" fill="none" strokeLinecap="round">
                <path d="M4 20h80" opacity="0.9" />
                <path d="M4 34h120" opacity="0.7" />
                <path d="M4 48h60" opacity="0.5" />
                <circle cx="200" cy="40" r="8" opacity="0.9" />
                <path d="M176 40h40" opacity="0.9" />
                <path d="M176 48h40" opacity="0.5" />
                <rect x="140" y="80" width="130" height="62" rx="8" opacity="0.06" fill="#2ea1c9" />
                <line x1="160" y1="100" x2="240" y2="100" opacity="0.12" />
                <line x1="160" y1="116" x2="220" y2="116" opacity="0.12" />
              </g>
            </svg>

            <h2 id="build-title" className="card-title">
              Build your project
            </h2>
            <div className="card-subtle">Home</div>

            <button className="btn-get" onClick={handleRoute}>
              Get Started
            </button>

            <div className="features" aria-hidden="true">
              <div className="feature">Feature 1</div>
              <div className="feature">Feature 2</div>
              <div className="feature">Feature 3</div>
            </div>
          </article>

          <div className="actions-row" role="toolbar" aria-label="primary actions">
            <div className="actions-left" role="group" aria-label="tools">
              <button className="action" onClick={handleRoute}>
                📋 Copy code
              </button>
              <button className="action github" onClick={handleRoute}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  style={{ display: "inline-block", marginRight: 6 }}
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.2c-3.2.7-3.8-1.4-3.8-1.4-.5-1.1-1.2-1.4-1.2-1.4-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.6.9 1.6.9.9 1.6 2.5 1.1 3.1.9.1-.7.4-1.1.7-1.3-2.6-.3-5.4-1.3-5.4-5.8 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.4 1.3 1-.3 2-.5 3-.5s2 .2 3 .5c2.4-1.6 3.4-1.3 3.4-1.3.6 1.6.2 2.9.1 3.2.7.9 1.2 2 1.2 3.2 0 4.5-2.9 5.5-5.4 5.8.4.3.8 1 .8 2v3c0 .3.2.7.8.6 4.6-1.5 7.8-5.8 7.8-10.9C23.5 5.6 18.35.5 12 .5z"
                  />
                </svg>
                Push GitHub
              </button>
              <button className="action" onClick={handleRoute}>
                ☁ Deploy to cloud
              </button>
            </div>

            <button className="generate" onClick={handleRoute}>
              Generate
            </button>
          </div>
        </section>


        <section id="about" className="section">
          <h2>About us</h2>
            <p>
            INHUB is a visual project builder that turns your ideas into
            production-ready web experiences. Design your pages, generate components,
            and connect to GitHub from one place.
          </p>
          <br></br>
          <br></br>

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px" }}>
    {/* Left Brand Area */}
    <div style={{ flex: "1 1 350px" }}>
      <h1 style={{ fontSize: "38px", fontWeight: "700", marginBottom: "8px", color: "#2ea1c9" }}>
        HJ<span style={{ color: "#fff" }}>Infotech</span>
      </h1>
      <p style={{ fontSize: "16px", lineHeight: "1.6", maxWidth: "420px", opacity: 0.85 }}>
        Where Innovation Meets Implementation, and Vision Transforms into Reality
      </p>
    </div>

    {/* Services */}
    <div style={{ flex: "1 1 220px" }}>
      <h3 style={{ fontSize: "22px", marginBottom: "16px", color: "#2ea1c9" }}>Services</h3>
      <ul style={{ listStyle: "none", padding: 0, lineHeight: "2" }}>
        <li>Cloud</li>
        <li>DevOps</li>
        <li>Security</li>
        <li>Development</li>
        <li>Digital Marketing</li>
      </ul>
    </div>

    {/* Quick Links */}
    <div style={{ flex: "1 1 220px" }}>
      <h3 style={{ fontSize: "22px", marginBottom: "16px", color: "#2ea1c9" }}>Quick Links</h3>
      <ul style={{ listStyle: "none", padding: 0, lineHeight: "2" }}>
        <li>Portfolio</li>
        <li>Blog</li>
        <li>Case Study</li>
        <li>About Us</li>
        <li>Contact</li>
      </ul>
    </div>
  </div>
        
          
        </section>

        <section id="contact" className="section">
          <h2>Contact us</h2>
          <p>📍 23, Ramnagar Extension, Sodala, Jaipur, Rajasthan 302019 <br />
            ✉ Info@hjinfotech.com <br />
          </p>
        </section>

        <footer className="footer">© {new Date().getFullYear()} INHUB</footer>
      </main>

      {/* Global styles */}
      <style jsx global>{`
        :root {
          --bg: #030512;
          --accent: #2ea1c9;
          --white: #f4f6f9;
          --purple: #6f2bdc;
          --cta-blue: #2b677a;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI",
            Roboto, Arial;
          -webkit-font-smoothing: antialiased;
          background: linear-gradient(180deg, #030512 0%, #040411 60%);
          color: var(--white);
        }
        .app-root {
          min-height: 100vh;
        }
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 36px;
          position: sticky;
          top: 0;
          z-index: 60;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), transparent);
          backdrop-filter: blur(6px);
        }
        .logo {
          font-weight: 800;
          font-size: 22px;
          letter-spacing: 2px;
        }
        .nav {
          display: flex;
          gap: 28px;
          align-items: center;
        }
        .nav-link {
          background: none;
          border: none;
          color: var(--white);
          font-size: 18px;
          cursor: pointer;
          opacity: 0.95;
        }
        .nav-link.active {
          color: var(--accent);
          text-decoration: underline 2px rgba(46, 161, 201, 0.12);
        }
        .hero {
          max-width: 980px;
          margin: 44px auto 20px;
          padding: 0 22px 40px;
          position: relative;
        }
        .hero .bg-tech {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.11;
          z-index: 0;
        }
        .hero-title {
          position: relative;
          z-index: 2;
          font-size: 64px;
          margin: 28px 0;
          font-weight: 700;
        }
        .create-box {
          max-width: 920px;
          border-radius: 18px;
          border: 2px solid rgba(46, 161, 201, 0.12);
          padding: 18px 22px;
          font-size: 22px;
          color: var(--white);
          margin-bottom: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.006), transparent);
        }
        .create-box:hover {
          border-color: var(--accent);
          box-shadow: 0 6px 20px rgba(46, 161, 201, 0.03);
        }
        .plus-icon {
          font-size: 28px;
          font-weight: 700;
          margin-left: 12px;
        }
        .card {
          max-width: 920px;
          border-radius: 14px;
          border: 1.6px solid rgba(46, 161, 201, 0.28);
          padding: 28px;
          margin-top: 18px;
          position: relative;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.01), transparent);
          z-index: 1;
        }
        .card .tech-lines {
          position: absolute;
          right: 12px;
          top: 12px;
          width: 240px;
          height: 160px;
          opacity: 0.12;
          pointer-events: none;
        }
        .card-title {
          font-size: 42px;
          margin: 0 0 12px;
        }
        .card-subtle {
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 10px;
          font-size: 14px;
        }
        .btn-get {
          background: var(--cta-blue);
          border: 0;
          padding: 10px 16px;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          margin-top: 6px;
          font-size: 15px;
        }
        .features {
          display: flex;
          gap: 14px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .feature {
          flex: 1;
          min-width: 150px;
          background: rgba(255, 255, 255, 0.02);
          padding: 16px;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.92);
        }
        .actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 24px;
          max-width: 920px;
        }
        .actions-left {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .action {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          padding: 14px 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.02);
          color: var(--white);
          cursor: pointer;
          transition: all 160ms ease;
          font-size: 14px;
        }
        .action:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          border-color: rgba(255, 255, 255, 0.22);
        }
        .action.github svg {
          fill: var(--accent);
        }
        .generate {
          background: var(--purple);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(111, 43, 220, 0.28);
          white-space: nowrap;
        }
        .section {
          max-width: 920px;
          margin: 64px auto;
          padding: 12px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.02);
        }
        .section h2 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .section p {
          color: rgba(255, 255, 255, 0.75);
          max-width: 640px;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          margin: 60px 0;
          color: rgba(255, 255, 255, 0.12);
          font-size: 13px;
        }
        @media (max-width: 900px) {
          .hero-title {
            font-size: 40px;
          }
          .actions-row {
            flex-direction: column;
            align-items: stretch;
          }
          .actions-left {
            justify-content: center;
          }
          .generate {
            width: 100%;
          }
        }
        @media (max-width: 480px) {
          .create-box {
            font-size: 16px;
            padding: 12px;
          }
          .card {
            padding: 18px;
          }
          .feature {
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
}