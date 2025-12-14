"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Plus,
  Github,
  Cloud,
  Copy,
  Code,
  Palette,
  Zap,
  Shield,
  Database,
  Layers,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

export default function App() {
  const router = useRouter();
  const [active, setActive] = useState("process");

  // action toggles from first file
  const [copyCode, setCopyCode] = useState(false);
  const [pushGitHub, setPushGitHub] = useState(false);
  const [deployCloud, setDeployCloud] = useState(false);

  const features = [
    {
      icon: Code,
      title: "AI-Powered Development",
      description:
        "Leverage advanced artificial intelligence to generate clean, production-ready code tailored to your specifications.",
    },
    {
      icon: Palette,
      title: "Design System Integration",
      description:
        "Seamlessly integrate with modern design systems and component libraries for consistent UI/UX across your application.",
    },
    {
      icon: Zap,
      title: "Instant Deployment",
      description:
        "Deploy your applications instantly to the cloud with automated CI/CD pipelines and scalable infrastructure.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Built with security-first architecture, ensuring your data and applications meet industry compliance standards.",
    },
    {
      icon: Database,
      title: "Database Management",
      description:
        "Integrated database solutions with automatic schema generation, migrations, and real-time synchronization.",
    },
    {
      icon: Layers,
      title: "Component Architecture",
      description:
        "Modular, reusable component structure following industry best practices for maintainability and scalability.",
    },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  const handleRoute = () => {
    // preserve routing/connectivity from code2: navigate to /login
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a1520] text-white">
      {/* Header (keeps first code's theme/layout) */}
      <header className="fixed top-0 left-0 right-0 bg-[#0d1b2a] border-b border-[#1e3a52] px-8 py-5 shadow-lg z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00d9c5] to-[#00b8a9] rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-[#0a1520] font-bold text-lg">IH</span>
            </div>
            <span className="text-2xl font-bold">INHUB</span>
          </div>
          <nav className="flex gap-8">
            <button
              onClick={() => scrollTo("process")}
              className={`text-sm font-semibold transition-colors ${
                active === "process" ? "text-[#00d9c5]" : "text-gray-300 hover:text-white"
              }`}
            >
              Process flow
            </button>
            <button
              onClick={() => scrollTo("about")}
              className={`text-sm transition-colors ${active === "about" ? "text-[#00d9c5]" : "text-gray-300 hover:text-white"}`}
            >
              About us
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className={`text-sm transition-colors ${active === "contact" ? "text-[#00d9c5]" : "text-gray-300 hover:text-white"}`}
            >
              Contact us
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section (keeps first code look) */}
        <section className="px-8 py-8 bg-gradient-to-b from-[#0d1b2a] to-[#0a1520]">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              Generate Your Website
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Transform your ideas into production-ready web experiences with our AI-powered visual builder
            </p>
          </div>
        </section>

        {/* Create New Project / Process Section (merged: visual from first, routing from second) */}
        <section className="px-8 py-6" id="process">
          <div className="max-w-7xl mx-auto">
            <div className="bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create new project</h2>
                <button
                  onClick={handleRoute}
                  aria-label="Create new project"
                  className="w-10 h-10 bg-[#1a2838] hover:bg-[#00d9c5] hover:text-[#0a1520] rounded-lg flex items-center justify-center transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Build your project card */}
              <div className="bg-[#0a1520] border-2 border-[#1e3a52] rounded-xl p-6 mb-6">
                {/* From code2: visual Create-box (keeps look) */}
                <div
                  onClick={handleRoute}
                  className="max-w-full border-2 border-[#1e3a52] rounded-xl p-5 cursor-pointer mb-6 flex items-center justify-between bg-gradient-to-b from-[#0d1b2a] to-transparent"
                >
                  <div>
                    <h3 className="text-xl font-semibold">Create new project</h3>
                    <p className="text-sm text-gray-400">Start from a prompt or a template</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#00d9c5] font-bold text-2xl">+</span>
                  </div>
                </div>

                {/* Enhanced Features Grid (from first file) */}
                <div className="mt-2 mb-4">
                  <h2 className="text-xl font-bold mb-6 text-[#00d9c5]">Platform Capabilities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((feature, index) => {
                      const IconComponent = feature.icon;
                      return (
                        <div
                          key={index}
                          className="bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-xl p-5 hover:border-[#00d9c5] hover:shadow-xl transition-all duration-300 group"
                        >
                          <div className="w-14 h-14 bg-gradient-to-br from-[#00d9c5] to-[#00b8a9] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <IconComponent className="text-[#0a1520]" size={28} strokeWidth={2.5} />
                          </div>
                          <h4 className="font-bold mb-2 text-base text-white">{feature.title}</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons (keeps interactive toggles + routing on Get Started) */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setCopyCode(!copyCode)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg border-2 transition-all font-medium ${
                      copyCode ? "bg-[#00d9c5] border-[#00d9c5] text-[#0a1520]" : "bg-[#1a2838] border-[#1e3a52] text-gray-300 hover:border-[#00d9c5]"
                    }`}
                  >
                    <Copy size={18} />
                    <span>Copy code</span>
                  </button>

                  <button
                    onClick={() => setPushGitHub(!pushGitHub)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg border-2 transition-all font-medium ${
                      pushGitHub ? "bg-[#00d9c5] border-[#00d9c5] text-[#0a1520]" : "bg-[#1a2838] border-[#1e3a52] text-gray-300 hover:border-[#00d9c5]"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Github size={18} />
                    <span>Push GitHub</span>
                  </button>

                  <button
                    onClick={() => setDeployCloud(!deployCloud)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg border-2 transition-all font-medium ${
                      deployCloud ? "bg-[#00d9c5] border-[#00d9c5] text-[#0a1520]" : "bg-[#1a2838] border-[#1e3a52] text-gray-300 hover:border-[#00d9c5]"
                    }`}
                  >
                    <Cloud size={18} />
                    <span>Deploy to cloud</span>
                  </button>
                </div>

                <button
                  onClick={handleRoute}
                  className="px-8 py-3 bg-gradient-to-r from-[#00d9c5] to-[#00b8a9] text-[#0a1520] rounded-lg font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section (keeps first code content & layout) */}
        <section className="px-8 py-12 bg-gradient-to-b from-[#0a1520] to-[#0d1b2a]" id="about">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-5">About us</h2>
              <p className="text-base text-gray-300 max-w-4xl leading-relaxed">
                INHUB is an enterprise-grade visual project builder that transforms conceptual ideas into production-ready web experiences.
                Our platform empowers development teams to design sophisticated pages, generate scalable components, and seamlessly integrate with
                version control systems—all from a unified development environment. We combine cutting-edge AI technology with industry best practices
                to accelerate your development lifecycle.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-2xl p-8 shadow-2xl">
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-4">
                    <span className="text-[#00d9c5]">HJ</span>Infotech
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Where Innovation Meets Implementation, and Vision Transforms into Reality.
                    We deliver comprehensive technology solutions that drive business growth and digital transformation.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-5 text-[#00d9c5] text-lg">Our Services</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      Cloud Infrastructure
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      DevOps Solutions
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      Cybersecurity Services
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      Custom Development
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      Digital Marketing
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-5 text-[#00d9c5] text-lg">Quick Links</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      Portfolio
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      Blog & Resources
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      Case Studies
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-[#00d9c5] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00d9c5] rounded-full"></span>
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section (keeps first code content & layout) */}
        <section className="px-8 py-12 bg-[#0a1520]" id="contact">
          <div className="max-w-7xl mx-auto">
            <div className="bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-8">Contact us</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00d9c5] to-[#00b8a9] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <MapPin className="text-[#0a1520]" size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-base">Corporate Address</h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        23, Ramnagar Extension, Sodala
                        <br />
                        Jaipur, Rajasthan 302019
                        <br />
                        India
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00d9c5] to-[#00b8a9] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Mail className="text-[#0a1520]" size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-base">Email Address</h4>
                      <p className="text-sm text-gray-300">info@hjinfotech.com</p>
                      <p className="text-sm text-gray-300">support@hjinfotech.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00d9c5] to-[#00b8a9] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Phone className="text-[#0a1520]" size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-base">Phone Number</h4>
                      <p className="text-sm text-gray-300">+91 (141) 234-5678</p>
                      <p className="text-sm text-gray-300">+91 (141) 234-5679</p>
                    </div>
                  </div>

                  <div className="bg-[#0a1520] border border-[#1e3a52] rounded-xl p-5 mt-6">
                    <h4 className="font-bold mb-2">Business Hours</h4>
                    <p className="text-sm text-gray-400">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                    <p className="text-sm text-gray-400">Saturday: 10:00 AM - 4:00 PM IST</p>
                    <p className="text-sm text-gray-400">Sunday: Closed</p>
                  </div>
                </div>

                <div className="bg-[#0a1520] border-2 border-[#1e3a52] rounded-xl p-6">
                  <h3 className="font-bold mb-5 text-lg">Send us a message</h3>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        className="w-full bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9c5] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Email Address</label>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        className="w-full bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9c5] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Subject</label>
                      <input
                        type="text"
                        placeholder="Enter message subject"
                        className="w-full bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9c5] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Message</label>
                      <textarea
                        placeholder="Enter your message here..."
                        rows="4"
                        className="w-full bg-[#0d1b2a] border-2 border-[#1e3a52] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#00d9c5] transition-all"
                      />
                    </div>
                    <button className="w-full px-6 py-3 bg-gradient-to-r from-[#00d9c5] to-[#00b8a9] text-[#0a1520] rounded-lg font-bold hover:shadow-xl transition-all">
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer (from first file) */}
        <footer className="px-8 py-8 bg-[#0d1b2a] border-t border-[#1e3a52]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#00d9c5] to-[#00b8a9] rounded-lg flex items-center justify-center">
                  <span className="text-[#0a1520] font-bold">IH</span>
                </div>
                <p className="text-sm text-gray-400">© {new Date().getFullYear()} INHUB. All rights reserved.</p>
              </div>
              <p className="text-sm text-gray-400">Built with innovation and passion by HJInfotech</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}