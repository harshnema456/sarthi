"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvex, useMutation, useQuery } from "convex/react";
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
   Helpers (SAME AS DASHBOARD)
========================= */
const uniqueProjects = (list = []) => {
  const map = new Map();
  for (const p of list) {
    if (p?.id) map.set(p.id, p);
  }
  return Array.from(map.values());
};

const makeId = (prefix = "proj-") =>
  `${prefix}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

/* =========================
   Sidebar
========================= */
function Sidebar({ activeTab, onDashboard, onProjects, onSignOut }) {
  return (
    <aside className="w-64 bg-[#0d1b2e] border-r border-[#1e3149] p-5 flex flex-col">
      <h1 className="text-2xl font-semibold text-white mb-6">INHUB</h1>

      <nav className="flex-1 space-y-1">
        <SidebarItem
          icon={Home}
          label="Dashboard"
          active={activeTab === "dashboard"}
          onClick={onDashboard}
        />
        <SidebarItem
          icon={Folder}
          label="Project History"
          active={activeTab === "projects"}
          onClick={onProjects}
        />
        <SidebarItem icon={HelpCircle} label="Help Center" />
      </nav>

      <SidebarItem icon={LucidePanelLeftInactive} label="Licence" />
      <SidebarItem icon={Settings} label="Settings" />
      <SidebarItem icon={SignOutIcon} label="Sign Out" onClick={onSignOut} />
    </aside>
  );
}

function SidebarItem({ icon: Icon, label, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
        ${
          active
            ? "bg-white/10 text-white"
            : "text-white/60 hover:bg-white/5 hover:text-white/90"
        }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}

/* =========================
   Stats Card
========================= */
function StatsCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-[#142840] border border-[#1e3a56] rounded-lg p-5 flex justify-between items-center">
      <div>
        <p className="text-white/60">{title}</p>
        <h2 className="text-2xl text-white">{value}</h2>
      </div>
      <Icon className="h-6 w-6 text-cyan-400" />
    </div>
  );
}

/* =========================
   MAIN PAGE
========================= */
export default function Create() {
  const router = useRouter();
  const convex = useConvex();

  const { userDetail } = useContext(UserDetailContext);
  const { setMessages } = useContext(MessagesContext);

  const displayName =
    userDetail?.name ||
    userDetail?.displayName ||
    userDetail?.email?.split?.("@")?.[0] ||
    "Guest";

  /* Convex (SAME AS DASHBOARD) */
  const projectsQuery = useQuery(api.projects.list, {
    owner: displayName,
  });
  const CreateProject = useMutation(api.projects.Create);

  /* State */
  const [projectName, setProjectName] = useState("");
  const [workspacePrompt, setWorkspacePrompt] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [historySearch, setHistorySearch] = useState("");

  

  /* =========================
     Sync projects (EXACT LOGIC)
  ========================= */
  useEffect(() => {
    if (Array.isArray(projectsQuery)) {
      setProjects(uniqueProjects(projectsQuery));
    }
  }, [projectsQuery]);

  /* =========================
     Create Project (NO WORKSPACE)
  ========================= */
  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    if (!workspacePrompt.trim()) {
      toast.error("Please describe what you want to build");
      return;
    }

    setLoading(true);

    try {
      const projectId = makeId();

      const newProject = {
        id: projectId,
        name: projectName,
        owner: displayName,
        filesObj: {},
        filesCount: 0,
        createdAt: new Date().toISOString(),
      };

      // Save to DB (same as dashboard)
      await CreateProject(newProject);

      // Local UI update
      setProjects((prev) => uniqueProjects([newProject, ...prev]));

      // Pass prompt to dashboard
      localStorage.setItem("pendingPrompt", workspacePrompt);

      setMessages([]);

      router.push(
        `/login/Create/InhubDashboard/${projectId}`
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Project History (CLONED)
  ========================= */
  const renderProjectHistory = () => {
    const filtered = projects.filter((p) => {
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q)
      );
    });

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Project History</h3>
          <input
            placeholder="Search by name or id..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="bg-[#0d1f35] border border-[#1e3a56] px-3 py-1 rounded"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-white/60">
            No projects found. Create one from the dashboard.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-[#0d1f35] border border-[#1e3a56] rounded-lg"
              >
                <p className="font-medium">{p.name}</p>
                <span className="text-sm text-cyan-400">{p.id}</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="flex h-screen bg-[#0a1628] text-white">
      <Sidebar
        activeTab={activeTab}
        onDashboard={() => setActiveTab("dashboard")}
        onProjects={() => setActiveTab("projects")}
        onSignOut={() => router.push("/login")}
      />

      <main className="flex-1 p-6 overflow-auto">
        {activeTab === "dashboard" && (
          <>
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
                title="License"
                value={userDetail?.license ?? "Free"}
                icon={Award}
              />
            </div>

            <div className="bg-[#142840] border border-[#1e3a56] rounded-lg p-6">
              <label className="block mb-2">Project Name</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My awesome project"
                className="w-full bg-[#0d1f35] border border-[#1e3a56] rounded-lg px-4 py-2 mb-4"
              />

              <label className="block mb-2">What do you want to build?</label>
              <textarea
                rows={3}
                value={workspacePrompt}
                onChange={(e) => setWorkspacePrompt(e.target.value)}
                className="w-full bg-[#0d1f35] border border-[#1e3a56] rounded-lg px-4 py-2"
              />

              <button
                onClick={handleCreate}
                disabled={loading}
                className="mt-4 px-6 py-2 bg-cyan-500 rounded-lg"
              >
                <Plus className="inline mr-2" />
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </>
        )}

        {activeTab === "projects" && renderProjectHistory()}
      </main>
    </div>
  );
}
