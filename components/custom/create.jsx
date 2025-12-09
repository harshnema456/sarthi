"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessagesContext } from "@/context/MessagesContext";
import { ArrowRight, Plus } from "lucide-react";

export default function Create() {
  const router = useRouter();
  const { setMessages } = useContext(MessagesContext);

  const [projectName, setProjectName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Please describe your project");

    setLoading(true);

    // get workspace Created during Google login
    const workspaceId = localStorage.getItem("workspaceId");
    if (!workspaceId) {
      toast.error("Workspace not found — please login again");
      setLoading(false);
      return;
    }

    // send first message so Dashboard autogenerates
    setMessages([
      { role: "user", content: prompt, timestamp: new Date().toISOString() },
    ]);

    // redirect to your real dashboard route

    router.push(/login/Create/InhubDashboard/${workspaceId});

  };

  return (
    <div className="min-h-screen bg-[#050c16] text-white px-16 py-14">
      {/* Greeting */}
      <h1 className="text-3xl font-semibold mb-1">Welcome, guest</h1>
      <p className="text-white/60 mb-10">What will you build today?</p>

      {/* Project Name + Create */}
      <div className="flex items-center gap-3 mb-12">
        <input
          placeholder="New project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="px-4 py-3 w-72 rounded-lg bg-[#0c1824] border border-white/10 outline-none"
        />
        <button
          onClick={handleGenerate}
          className="px-5 py-3 flex items-center gap-2 bg-[#14b8a6] hover:bg-[#109c8c] text-black rounded-lg font-medium"
        >
          <Plus size={18} /> Create
        </button>
      </div>

      {/* Prompt Box */}
      <div className="bg-[#08121e] border border-white/10 rounded-xl p-10 max-w-4xl">
        <h2 className="text-4xl font-semibold mb-3">What will you build today?</h2>
        <p className="text-white/50 mb-6">
          Create stunning apps & websites by chatting with AI.
        </p>

        <textarea
          placeholder="Describe your idea… (e.g., A crypto dashboard built with React + Tailwind)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-40 p-5 rounded-xl bg-[#0e1b2b] border border-white/10 outline-none text-white text-[15px]"
        />

        <div className="flex justify-end mt-6">
          <button
            disabled={loading}
            onClick={handleGenerate}
            className="px-7 py-3 bg-[#1db4ff] hover:bg-[#159fe4] rounded-xl font-semibold flex items-center gap-2 text-black disabled:opacity-40"
          >
            {loading ? "Thinking..." : "Build now"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}