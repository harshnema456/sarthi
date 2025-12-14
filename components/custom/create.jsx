"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import {
  FolderOpen,
  Coins,
  Award,
  Home,
  Folder,
  Settings,
  Plus,
  HelpCircle,
  LucidePanelLeftInactive,
} from "lucide-react";
import { SignOutIcon } from "@codesandbox/sandpack-react";

import { UserDetailContext } from "@/context/UserDetailContext";
import { MessagesContext } from "@/context/MessagesContext";

/* =========================
   Sidebar Component (UNCHANGED UI)
========================= */
function Sidebar({ onDashboard, onProjects, onSignOut }) {
  return (
    <aside className="w-64 bg-[#0d1b2e] border-r border-[#1e3149] p-5 flex flex-col">
      <h1 className="text-2xl font-semibold text-white mb-6">INHUB</h1>

      <nav className="flex-1 space-y-1">
        <SidebarItem icon={Home} label="Dashboard" onClick={onDashboard} />
        <SidebarItem icon={Folder} label="Projects" onClick={onProjects} />
        <SidebarItem icon={HelpCircle} label="Help Center" />
      </nav>

      <SidebarItem icon={LucidePanelLeftInactive} label="Licence" />
      <SidebarItem icon={Settings} label="Settings" />
      <SidebarItem icon={SignOutIcon} label="Sign Out" onClick={onSignOut} />
    </aside>
  );
}

function SidebarItem({ icon: Icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all
        text-white/60 hover:bg-white/5 hover:text-white/90"
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}

/* =========================
   Stats Card (UNCHANGED UI)
========================= */
function StatsCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-[#142840] border border-[#1e3a56] rounded-lg p-5 flex items-center justify-between">
      <div>
        <p className="text-white/60 mb-1">{title}</p>
        <h2 className="text-2xl text-white">{value}</h2>
      </div>
      <div className="p-3 bg-cyan-500/10 rounded-lg">
        <Icon className="h-6 w-6 text-cyan-400" />
      </div>
    </div>
  );
}

/* =========================
   Recent Project Card (UNCHANGED UI)
========================= */
function RecentProjectCard({ name, id, onOpen }) {
  return (
    <div
      onClick={onOpen}
      className="flex items-center justify-between p-4 bg-[#0d1f35] border border-[#1e3a56] rounded-lg hover:border-[#2a4a6a] transition-all cursor-pointer"
    >
      <div>
        <p className="text-white">{name}</p>
        <span className="text-sm text-white/50">{id}</span>
      </div>
      <FolderOpen className="h-5 w-5 text-white/50" />
    </div>
  );
}

// 🔹 Helper to generate random Project ID
const generateProjectId = () => {
  return (
    "PRJ-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Date.now().toString().slice(-4)
  );
};


/* =========================
   Main Create Page
========================= */
export default function Create() {
  const router = useRouter();
  const convex = useConvex();
  const CreateWorkspace = useMutation(api.workspace.CreateWorkspace);

  const { userDetail } = useContext(UserDetailContext);
  const { setMessages } = useContext(MessagesContext);

  //REQUIRED STATE
  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     Fetch projects & stats
  ========================= */
  useEffect(() => {
    if (!userDetail?._id) return;

    const loadData = async () => {
      try {
        const res = await convex.query(
          api.workspace.GetAllWorkspace,
          { userId: userDetail._id }
        );
        setProjects(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load projects");
      }
    };

    loadData();
  }, [userDetail, convex]);

  useEffect(() => {
  const handler = (e) => {
    const { prompt, autoSend } = e.detail || {};
    if (!prompt) return;

    setInput(prompt); 

    if (autoSend) {
      sendMessage(prompt); 
    }
  };

  window.addEventListener("DASHBOARD_PROMPT", handler);
  return () =>
    window.removeEventListener("DASHBOARD_PROMPT", handler);
}, []);


  /* =========================
     Navigation handlers
  ========================= */
  const goToDashboard = () => {
    const wid = localStorage.getItem("workspaceId");
    if (!wid) return toast.error("Workspace not found");
    router.push(`/login/Create/InhubDashboard/${wid}?view=dashboard`);
  };

  const goToProjects = () => {
    const wid = localStorage.getItem("workspaceId");
    if (!wid) return toast.error("Workspace not found");
    router.push(`/login/Create/InhubDashboard/${wid}?view=projects`);
  };

  const handleSignOut = () => {
    localStorage.clear();
    router.push("/login");
    toast.success("Signed out");
  };

  /* =========================
     Create Project (FULLY FUNCTIONAL)
  ========================= */
 const handleCreate = async () => {
  if (!projectName.trim()) {
    toast.error("Project name is required");
    return;
  }
  if (!projectId.trim()) {
    setProjectId(generateProjectId());
  }

  if (!description.trim()) {
    toast.error("Project description is required");
    return;
  }

  if (!userDetail?._id) {
    toast.error("User not authenticated");
    return;
  }

  try {
    setLoading(true);

    //AUTO-GENERATE PROJECT ID IF EMPTY
    const finalProjectId = projectId.trim()
      ? projectId.trim()
      : generateProjectId();

    const { workspaceId } = await CreateWorkspace({
      user: userDetail._id,
      name: projectName.trim(),     // ✅ saved properly
      projectId: finalProjectId,    // ✅ generated or user-entered
      messages: [],
    });

    localStorage.setItem("workspaceId", workspaceId);
    localStorage.setItem("pendingPrompt", description);

    setMessages([]);
    router.push(
       `/login/Create/InhubDashboard/${res.projectId}?view=dashboard`
    );
  } catch (err) {
    console.error(err);
    toast.error("Failed to create project");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex h-screen bg-[#0a1628] text-white overflow-hidden">
      <Sidebar
        onDashboard={goToDashboard}
        onProjects={goToProjects}
        onSignOut={handleSignOut}
      />
      

      <main className="flex-1 flex flex-col p-6 overflow-hidden">

        {/* Stats (REAL DATA) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total Projects"
            value={projects.length}
            icon={FolderOpen}
          />
          <StatsCard
            title="Tokens Left"
            value={userDetail?.token ?? 0}
            icon={Coins}
          />
          <StatsCard
            title="License Type"
            value={userDetail?.license ?? "Free"}
            icon={Award}
          />
          {/* Project Name & Project ID */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  <div>
    <label className="block text-white/80 mb-2">
      Project Name
    </label>
    <input
      type="text"
      placeholder="Enter project name"
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
      className="w-full bg-[#0d1f35] border border-[#1e3a56] rounded-lg px-4 py-2.5
        placeholder:text-white/30 focus:outline-none focus:ring-2
        focus:ring-cyan-500/50 transition-all"
    />
  </div>

  <div>
    <label className="block text-white/80 mb-2">
      Project ID
    </label>
    <input
      type="text"
      placeholder="Enter project ID"
      value={projectId}
      onChange={(e) => setProjectId(e.target.value)}
      className="w-full bg-[#0d1f35] border border-[#1e3a56] rounded-lg px-4 py-2.5
        placeholder:text-white/30 focus:outline-none focus:ring-2
        focus:ring-cyan-500/50 transition-all"
    />
  </div>
</div>

        </div>

        {/* Create Project (UNCHANGED UI) */}
        <div className="bg-[#142840] border border-[#1e3a56] rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-white/80 mb-2">
              Description
            </label>
          <textarea
  rows={3}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Describe your project..."
  className="w-full resize-none bg-[#0d1f35] border border-[#1e3a56] rounded-lg px-4 py-2.5 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
/>

          </div>
          

          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors disabled:opacity-40"
          >
            <Plus className="inline mr-2" />
            {loading ? "Creating..." : "Create"}
          </button>
        </div>

        {/* Recent Projects (REAL DATA) */}
        <div className="flex-1 min-h-0">
          <h2 className="text-white/90 mb-4">Recent Projects</h2>
          <div className="space-y-3 overflow-auto">
            {projects.map((p) => (
              <RecentProjectCard
                key={p._id}
                id={p.workspaceUid || p._id}
                name={p.name || "Untitled Project"}
                onOpen={() => {
                  localStorage.setItem("workspaceId", p._id);
                  router.push(`/login/Create/InhubDashboard/${p._id}?view=dashboard`);
                }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
