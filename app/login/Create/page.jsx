"use client";

import { useRouter } from "next/navigation";
import { useState, useContext } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessagesContext } from "@/context/MessagesContext";
import { UserDetailContext } from "@/context/UserDetailContext";  
import { toast } from "sonner";
import Image from "next/image"; 

import {
  Grid,
  Folder,
  Settings,
  LogOut,
  BadgeCheck,
  Plus,
  Save,
  GrabIcon,
} from "lucide-react";

export default function Create() {
  const router = useRouter();
  const CreateWorkspace = useMutation(api.workspace.Create);
  const { setMessages } = useContext(MessagesContext);

  const { userDetail } = useContext(UserDetailContext);  // ⭐ added

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "Create a modern portfolio website using React + Tailwind",
    "Build a SaaS dashboard with authentication and charts",
    "Create a fully responsive e-commerce store UI",
    "Build a landing page for a fitness startup",
  ];

  const handleSelectSuggestion = (example) => setPrompt(example);

  const handleCreate = async () => {
  if (!prompt.trim()) return toast.error("Please enter project prompt");

  setLoading(true);

  // Use workspaceId Created during Google login
  const id = localStorage.getItem("workspaceId");
  if (!id) {
    toast.error("Workspace not found");
    setLoading(false);
    return;
  }

  // Send the prompt to Dashboard chat
  setMessages([
    { role: "user", content: prompt, timestamp: new Date().toISOString() },
  ]);

  // Move to Dashboard
  router.push(`/login/Create/InhubDashboard/${id}`);
};


  return (
    <div className="h-screen w-screen flex bg-[#050c16] text-white">
      {/* SIDEBAR */}
      <aside className="w-[240px] bg-[#040a13] border-r border-white/10 flex flex-col px-9 py-9">
       <div className="flex items-center justify-center mb-10">
  <Image
    src="/logo.png"
    alt="Logo"
    width={80}
    height={80}
    className="rounded-xl shadow-[0_0_8px_rgba(0,255,219,0.35)] object-contain"
    priority
  />
</div>


        <nav className="flex flex-col gap-6 text-[15px]">
          <button className="flex items-center gap-3 text-white/70 hover:text-white">
            <Grid size={18} /> Dashboard
          </button>
          <button className="flex items-center gap-3 text-white/70 hover:text-white">
            <Folder size={18} /> Projects
          </button>
          <button className="flex items-center gap-3 text-white/70 hover:text-white">
            < GrabIcon size={18} /> Help Center
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4 text-[14px] text-white/70">
          <button className="flex items-center gap-3 hover:text-white">
            <BadgeCheck size={16} /> License
          </button>
          <button className="flex items-center gap-3 hover:text-white">
            <Settings size={16} /> Settings
          </button>
          <button className="flex items-center gap-3 hover:text-red-400">
            <LogOut size={16} /> Signout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-14">
        {/* ⭐ Welcome text using userDetail */}
        <h1 className="text-3xl font-semibold mb-12">
          Welcome, {userDetail?.name || "guest"}
        </h1>

        {/* Expanded Dashboard-style prompt card */}
        <div className="mx-auto w-[1050px] bg-[#07121f] border border-[#14304a] shadow-xl rounded-2xl p-10">
          <p className="text-white/60 mb-7">Type a prompt below and hit Create to begin.</p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type project prompt here — e.g. ‘Marketing landing with hero, features and CTA’"
            className="w-full h-[220px] p-6 bg-[#0c1c2c] rounded-xl border border-[#132c43] outline-none resize-none text-[16px]
            focus:border-[#12d7be] focus:shadow-[0_0_18px_#12d7be50] transition"
          />

          {/* Suggestions */}
          <div className="flex flex-wrap gap-3 mt-6">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(s)}
                className="px-5 py-2 rounded-full text-sm bg-[#0c1b2d] border border-[#173a56] text-white/80
                hover:border-[#12d7be] hover:text-[#12d7be] transition"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#12d7be] hover:bg-[#0fbda6] text-black font-semibold rounded-lg disabled:opacity-40"
            >
              <Plus size={18} /> Create
            </button>

            <button className="flex items-center gap-2 px-6 py-2 bg-[#0d2134] border border-[#173a56] hover:bg-[#0f2a45] rounded-lg text-white/80">
              <Save size={18} /> Save
            </button>

            <span className="text-sm text-white/40 ml-auto">
              Prompt length: {prompt.length} chars
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}