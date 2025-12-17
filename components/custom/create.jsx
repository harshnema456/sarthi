


"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
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
   Quick Start Templates
========================= */
const QUICK_STARTS = [
  {
    title: "AI Chat Application",
    description:
      "Build a modern AI chat application using React, Tailwind, authentication, and persistent chat history.",
    projectName: "AI Chat Application",
    prompt:
      "Build a modern AI chat application using React, Tailwind CSS, authentication, and persistent chat history. Include chat UI, message storage, and API integration.",
  },
  {
    title: "SaaS Landing Page",
    description:
      "Create a responsive SaaS landing page with hero section, pricing cards, features, and call to action.",
    projectName: "SaaS Landing Page",
    prompt:
      "Create a responsive SaaS landing page with hero section, pricing, features, and CTA.",
  },
  {
    title: "Admin Dashboard",
    description:
      "Build an admin dashboard with charts, tables, user management, and role-based access.",
    projectName: "Admin Dashboard",
    prompt:
      "Build an admin dashboard with charts, tables, analytics, user management, and role-based access control.",
  },
  {
    title: "E-commerce Store",
    description:
      "Generate a full-stack e-commerce app with product listing, cart, checkout, and order history.",
    projectName: "E-commerce Store",
    prompt:
      "Generate a full-stack e-commerce application with product listings, shopping cart, checkout, and order history.",
  },
];

/* =========================
   Sidebar
========================= */
function Sidebar({ activeTab, onDashboard, onProjects, onSignOut }) {
  return (
    <aside className="w-64 bg-[#0d1b2e] border-r border-[#1e3149] p-5 flex flex-col">
      <div className="flex items-center gap-5 mb-6">
  {/* Logo crop wrapper */}
  <div className="h-16 overflow-hidden flex items-center">
    <img
      src="/logo.png"
      alt="INHUB Logo"
      className="h-36 w-auto bg-transparent mix-blend-lighten"
    />
  </div>
 
  {/* Text stays EXACTLY the same */}
  <h1 className="text-6xl font-semibold text-white">
 
  </h1>
</div>
 

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
 const { signOut } = useClerk(); 
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
  const setUserDetail = useContext(UserDetailContext).setUserDetail;
  const CreateProject = useMutation(api.projects.Create);

  /* State */
  const [projectName, setProjectName] = useState("");
  const [workspacePrompt, setWorkspacePrompt] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [historySearch, setHistorySearch] = useState("");

  
/* =========================
   Quick Start Handler
========================= */
const handleQuickStart = (item) => {
  setProjectName(item.projectName);
  setWorkspacePrompt(item.prompt);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

/* =========================
   REAL Sign Out Handler
========================= */

const handleSignOut = async () => {
  try {
    //  This actually ends the session
    await signOut();

    // Safety redirect (middleware will also enforce this)
    router.replace("/login");
  } catch (err) {
    console.error("Sign out failed:", err);
    router.replace("/login");
  }
};

/* =========================


     User Hydration Fix


  ========================= */


  useEffect(() => {


    const hydrateUser = async () => {
      // 1. Get from Local Storage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.email) return;
      // FIX: Pehle LocalStorage wala data set kardo taaki projects turant dikh jaye
      // (Assuming storedUser mein basic details like email/name hain)
      setUserDetail((prev) => ({ ...prev, ...storedUser }));
      try {
        const freshUser = await convex.query(api.users.GetUserByUid
, {
          email: storedUser.email,
        });
        if (freshUser) {
          setUserDetail(freshUser);
          localStorage.setItem("user", JSON.stringify(freshUser))
        }
      } catch (error) {
        console.error("Failed to fetch fresh user details", error);


      }


    };
 
    hydrateUser();


  }, [convex, setUserDetail]); 
 
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
      localStorage.setItem("projectId", projectId);

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
  onSignOut={handleSignOut}
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
              {/* =========================
   Quick Start Suggestions
========================= */}
<div className="mt-8">
  <h3 className="text-lg font-semibold mb-4">
    Quick Start Suggestions
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {QUICK_STARTS.map((item) => (
      <div
        key={item.title}
        className="bg-[#142840] border border-[#1e3a56] rounded-lg p-5 flex flex-col justify-between"
      >
        <div>
          <h4 className="text-white font-medium mb-1">
            {item.title}
          </h4>
          <p className="text-white/60 text-sm">
            {item.description}
          </p>
        </div>

        <button
          onClick={() => handleQuickStart(item)}
          className="mt-4 w-fit px-4 py-1.5 bg-cyan-500 text-sm rounded-lg hover:bg-cyan-400 transition"
        >
          Start Project
        </button>
      </div>
    ))}
  </div>
</div>

            </div>
          </>
        )}

        {activeTab === "projects" && renderProjectHistory()}
      </main>
    </div>
  );
}











