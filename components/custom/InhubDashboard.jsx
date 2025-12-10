"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import CodeView from "@/components/custom/CodeView";
import ChatView from "@/components/custom/ChatView";
import PreviewView from "./Previewview";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FiGrid,
  FiFolder,
  FiCode,
  FiEye,
  FiMessageSquare,
  FiPlus,
  FiSave,
  FiTrash2,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";
import { UserDetailContext } from "@/context/UserDetailContext";

/* ========= DEDUPE HELPER (GLOBAL) ========= */
const uniqueProjects = (list = []) => {
  const map = new Map();
  for (const p of list) {
    if (p && p.id) {
      map.set(p.id, p);
    }
  }
  return Array.from(map.values());
};

/* keys/localStorage */
const STORAGE_KEY = "inhub_projects_v1";
const STORAGE_ACTIVE_KEY = "inhub_active_project_v1";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <FiGrid /> },
  { id: "projects", label: "Project History", icon: <FiFolder /> },
  { id: "chat", label: "Chat", icon: <FiMessageSquare /> },
  { id: "code", label: "Code", icon: <FiCode /> },
  { id: "preview", label: "Preview", icon: <FiEye /> },
];

export default function InhubDashboard({ initialProjectId = null }) {
  const { userDetail } = useContext(UserDetailContext) ?? {};
  const displayName =
    userDetail?.name ||
    userDetail?.displayName ||
    userDetail?.email?.split?.("@")?.[0] ||
    "Guest";

  // convex hooks
  const projectsQuery = useQuery(api.projects.list, { owner: displayName });
  const CreateProject = useMutation(api.projects.Create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);

  // state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectFiles, setProjectFiles] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const promptRef = useRef(null);

  // ========= UTILS =========
  const makeId = (prefix = "") =>
    `${prefix}${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  const upsertProject = (proj) => {
    if (!proj?.id) return;
    setProjects((prev) =>
      uniqueProjects([proj, ...(prev || []).filter((p) => p.id !== proj.id)])
    );
  };

  // ========= INITIAL LOAD =========
  useEffect(() => {
    const fetchAndOpenProject = async () => {
      if (!initialProjectId) return;

      try {
        const proj = await fetch(
          `/api/projects/get?id=${initialProjectId}`
        ).then((r) => r.json());
        if (proj) openProject(proj);
      } catch (e) {
        console.warn("fetch initial project failed", e);
      }
    };

    fetchAndOpenProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId]);

  // hydrate projects from convex or localStorage fallback
  useEffect(() => {
    if (projectsQuery && Array.isArray(projectsQuery)) {
      setProjects(uniqueProjects(projectsQuery));
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProjects(uniqueProjects(JSON.parse(raw)));
    } catch (e) {
      console.warn("local projects parse failed", e);
    }
  }, [projectsQuery]);

  // persist locally as well (semi-offline)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn("localStorage save failed", e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      if (activeProjectId) {
        localStorage.setItem(STORAGE_ACTIVE_KEY, activeProjectId);
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_KEY);
      }
    } catch (e) {
      console.warn("active project save failed", e);
    }
  }, [activeProjectId]);

  // ========= PREVIEW =========
  const clearPreview = () => {
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {
        console.warn("revoke preview url failed", e);
      }
    }
    setPreviewUrl("");
  };

  const updatePreview = (files) => {
    if (!files || typeof files !== "object") {
      clearPreview();
      return;
    }

    const htmlFile = files["index.html"] || { content: "<h1>No HTML</h1>" };
    const cssFile = files["styles.css"] || { content: "" };
    const jsFile = files["script.js"] || { content: "" };

    const sanitizedHtml = htmlFile.content.replace(
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      ""
    );

    const previewContent = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1" /><style>${cssFile.content}</style></head><body>${sanitizedHtml}<script>try{${jsFile.content}}catch(e){console.error(e)}</script></body></html>`;

    try {
      const blob = new Blob([previewContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (e) {}
      }
      setPreviewUrl(url);
    } catch (e) {
      console.error("Could not create preview blob", e);
      clearPreview();
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (e) {}
      }
    };
  }, [previewUrl]);

  // ========= CREATE PROJECT =========
  const handleCreate = async (_fromSuggestion = false, autoSend = true) => {
    if (!prompt.trim()) return;
    setIsCreating(true);

    try {
      let projId = activeProjectId;

      if (!projId) {
        projId = makeId("proj-");
        const newProj = {
          id: projId,
          name: prompt,
          owner: displayName,
          filesObj: {},
          filesCount: 0,
          CreatedAt: new Date().toISOString(),
        };

        upsertProject(newProj);
        setProjectFiles({});
        updatePreview({});

        (async () => {
          try {
            await CreateProject(newProj);
          } catch (err) {
            console.warn("CreateProject convex failed", err);
          }
        })();
      }

      setActiveProjectId(projId);

      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("DASHBOARD_PROMPT", {
              detail: { prompt, projectId: projId, autoSend: !!autoSend },
            })
          );
        }, 80);
      }

      setActiveTab("chat");
    } finally {
      setIsCreating(false);
      setPrompt("");
    }
  };

  // ========= OPEN PROJECT =========
  const openProject = async (proj) => {
    if (!proj) return;
    const projectObj =
      typeof proj === "string"
        ? projects.find((p) => p.id === proj)
        : proj;

    if (!projectObj) {
      try {
        const fetched = await fetch(`/api/projects/get?id=${proj}`)
          .then((r) => r.json())
          .catch(() => null);

        if (fetched) {
          upsertProject(fetched);
          return openProject(fetched);
        }
      } catch (e) {
        console.warn("openProject fetch failed", e);
      }
      return;
    }

    setActiveProjectId(projectObj.id);
    setProjectFiles(projectObj.filesObj || {});
    updatePreview(projectObj.filesObj || {});
    setActiveTab("code");
  };

  // ========= DELETE PROJECT =========
  const deleteProject = async (projId) => {
    if (!projId) return;
    if (!confirm("Delete project? This cannot be undone.")) return;

    setProjects((prev) => (prev || []).filter((p) => p.id !== projId));
    try {
      await removeProject({ id: projId, owner: displayName });
    } catch (e) {
      console.warn("convex remove failed", e);
    }

    if (activeProjectId === projId) {
      setActiveProjectId(null);
      setProjectFiles({});
      clearPreview();
    }
  };

  // ========= SAVE PROJECT =========
  const saveCurrentProject = async (opts = {}) => {
    const pid = activeProjectId || makeId("proj-");
    const title =
      opts.title || prompt || `Project ${new Date().toLocaleString()}`;

    const project = {
      id: pid,
      name: title,
      owner: displayName,
      filesObj: projectFiles || {},
      filesCount: Object.keys(projectFiles || {}).length,
      CreatedAt: new Date().toISOString(),
    };

    upsertProject(project);
    setActiveProjectId(pid);

    try {
      await CreateProject(project);
    } catch (err) {
      try {
        await updateProject({
          id: pid,
          filesObj: project.filesObj,
          filesCount: project.filesCount,
          owner: project.owner,
        });
      } catch (e) {
        console.warn("Could not persist project to server", e);
      }
    }
  };

  // ========= AI / FILE UPDATE EVENTS =========
  useEffect(() => {
    const onAIFiles = (e) => {
      const detail = e.detail || {};
      const files = detail.files || detail;
      if (!files || typeof files !== "object") return;

      const projId = detail.projectId || activeProjectId || makeId("proj-");
      const title = detail.title || prompt || "Chat generated project";

      const updatedProj = {
        id: projId,
        name: title,
        owner: displayName,
        filesObj: files,
        filesCount: Object.keys(files).length,
        CreatedAt: new Date().toISOString(),
      };

      setProjectFiles(files);
      updatePreview(files);
      upsertProject(updatedProj);
      setActiveProjectId(projId);

      (async () => {
        try {
          await CreateProject(updatedProj);
        } catch (err) {
          try {
            await updateProject({
              id: projId,
              filesObj: files,
              filesCount: Object.keys(files).length,
              owner: displayName,
            });
          } catch (e) {
            console.warn("persist AI files failed", e);
          }
        }
      })();

      setActiveTab("code");
      setTimeout(() => setActiveTab("preview"), 250);
    };

    const onFileUpdate = (e) => {
      const detail = e.detail || {};
      const files = detail.files || detail;
      if (!files || typeof files !== "object") return;

      const projId = detail.projectId || activeProjectId || makeId("proj-");

      const updatedProj = {
        id: projId,
        name: prompt || `Project ${new Date().toLocaleString()}`,
        owner: displayName,
        filesObj: files,
        filesCount: Object.keys(files).length,
        CreatedAt: new Date().toISOString(),
      };

      setProjectFiles(files);
      updatePreview(files);
      upsertProject(updatedProj);
      setActiveProjectId(projId);

      (async () => {
        try {
          await updateProject({
            id: projId,
            filesObj: files,
            filesCount: Object.keys(files).length,
            owner: displayName,
          });
        } catch (e) {
          console.warn("convex update failed", e);
        }
      })();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("AI_FILES_READY", onAIFiles);
      window.addEventListener("PROJECT_FILE_UPDATE", onFileUpdate);
      return () => {
        window.removeEventListener("AI_FILES_READY", onAIFiles);
        window.removeEventListener("PROJECT_FILE_UPDATE", onFileUpdate);
      };
    }
  }, [activeProjectId, displayName, prompt, CreateProject, updateProject]);

  // ========= HELPERS =========
  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch (e) {
      console.warn("copy failed", e);
    }
  };

  // render project card (used for history + sidebar recent list)
  const renderProjectCard = (p, options = {}) => {
    const { compact = false } = options;
    const active = activeProjectId === p.id;
const reactKey = `${p.id || p._id || "proj"}_${p.CreatedAt || "nodate"}_${Math.random()}`;

    if (compact) {
      return (
        <div
          key={reactKey}
          className={`project-card compact ${active ? "selected" : ""}`}
          onClick={() => openProject(p)}
        >
          <div className="project-compact-main">
            <div className="row-avatar">{(p.name || "").slice(0, 1)}</div>
            <div>
              <div className="project-name">{p.name || "Untitled project"}</div>
              <div className="muted small">
                {p.filesCount ?? 0} files • {formatDate(p.CreatedAt)}
              </div>
              <div className="muted very-small id-inline">
                id: <span className="text-neon">{p.id}</span>
              </div>
            </div>
          </div>

          <div className="project-compact-actions">
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                openProject(p);
              }}
            >
              Open
            </button>
            <button
              className="icon-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                deleteProject(p.id);
              }}
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={reactKey}
        className={`project-card full ${active ? "selected" : ""}`}
        onClick={() => openProject(p)}
        role="button"
        aria-label={`Open ${p.name}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") openProject(p);
        }}
      >
        <div className="project-card-top">
          <div className="project-title">{p.name || "Untitled project"}</div>
          <div className="project-actions">
            <button
              className="icon-small"
              onClick={(ev) => {
                ev.stopPropagation();
                copyId(p.id || p._id);
              }}
              title="Copy ID"
            >
              <FiCopy />
            </button>

            <button
              className="icon-small"
              onClick={(ev) => {
                ev.stopPropagation();
                openProject(p);
              }}
              title="Open"
            >
              <FiExternalLink />
            </button>

            <button
              className="icon-small"
              onClick={(ev) => {
                ev.stopPropagation();
                deleteProject(p.id);
              }}
              title="Delete"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>

        <div className="project-meta">
          <div className="meta-left">
            <div className="owner-badge">
              {(p.owner || displayName || "Y").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="meta-title">Files</div>
              <div className="meta-value">{p.filesCount ?? 0}</div>
            </div>
          </div>

          <div className="meta-right">
            <div className="meta-small">Created</div>
            <div className="meta-small">{formatDate(p.CreatedAt)}</div>
            <div className="meta-small id-cell">{p.id}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectHistorySection = () => {
    const filtered = (projects || []).filter((p) => {
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q)
      );
    });

    return (
      <div className="history-wrap">
        <div className="history-header">
          <h3 className="history-title">Project History</h3>
          <div className="history-actions">
            <input
              className="history-search"
              placeholder="Search by name or id..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
            <button
              className="icon-btn"
              onClick={() => {
                window.location.reload();
              }}
            >
              Refresh
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                alert("Export coming soon");
              }}
            >
              Export
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-history">
            No projects found. Create one from the dashboard prompt.
          </div>
        ) : (
          <div className="history-grid">
            {filtered.map((p) => renderProjectCard(p))}
          </div>
        )}
      </div>
    );
  };

  // ========= MAIN CONTENT =========
  const renderMainContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <div className="content-wrap">
            <div className="full-hero" style={{ marginBottom: 16 }}>
              <div>
                <h1 className="welcome">Chat</h1>
                <p className="muted">
                  Describe what you want to build for this project.
                </p>
                {activeProjectId && (
                  <div className="muted small">
                    Active: <span className="text-neon">{activeProjectId}</span>
                  </div>
                )}
              </div>
            </div>
            <ChatView
              openCode={() => setActiveTab("code")}
              activeProjectId={activeProjectId}
              initialPrompt={prompt}
            />
          </div>
        );

      case "code":
        return (
          <div className="content-wrap">
            <div className="full-hero" style={{ marginBottom: 12 }}>
              <div>
                <h1 className="welcome">Code</h1>
                <p className="muted">
                  Generated source files for your current project.
                </p>
                {activeProjectId && (
                  <div className="muted small">
                    Active: <span className="text-neon">{activeProjectId}</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => saveCurrentProject({ title: prompt })}
                  className="icon-btn"
                  title="Save project"
                >
                  <FiSave /> Save
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className="icon-btn"
                >
                  Open Preview
                </button>
              </div>
            </div>

            <CodeView
              projectFiles={projectFiles}
              activeProjectId={activeProjectId}
            />
          </div>
        );

      case "preview":
        return (
          <div className="content-wrap">
            <div className="full-hero" style={{ marginBottom: 12 }}>
              <div>
                <h1 className="welcome">Preview</h1>
                <p className="muted">
                  Live preview of your generated project.
                </p>
                {activeProjectId && (
                  <div className="muted small">
                    Active: <span className="text-neon">{activeProjectId}</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="icon-btn"
                  onClick={() => setActiveTab("code")}
                >
                  Edit Code
                </button>
                <button
                  className="icon-btn"
                  onClick={() => saveCurrentProject({ title: prompt })}
                >
                  <FiSave /> Save
                </button>
              </div>
            </div>

            <PreviewView
              files={projectFiles}
              previewUrl={previewUrl}
              clearPreview={clearPreview}
              activeProjectId={activeProjectId}
            />
          </div>
        );

      case "projects":
        return <div className="content-wrap">{renderProjectHistorySection()}</div>;

      default:
        return (
          <div className="content-wrap full-page">
            <div className="hero hero-centered-lower">
              <div className="hero-center-lower with-offset">
                <div style={{ width: "100%", maxWidth: 980 }}>
                  <div className="welcome-outside">
                    <div className="welcome-row">
                      <div className="welcome-texts">
                        <div className="welcome-gradient">
                          Welcome, {displayName}
                        </div>
                        <div className="welcome-sub">
                          Type a prompt below and hit Create to begin.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="prompt-card-centered lower interactive">
                    <div className="prompt-card-body">
                      <textarea
                        ref={promptRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                            handleCreate(false);
                          }
                        }}
                        placeholder="Type project prompt here — e.g. 'Marketing landing with hero, features and CTA'"
                        className="prompt-textarea"
                        rows={5}
                      />

                      <div className="under-prompt-row">
                        <div className="prompt-badge">
                          <span className="prompt-dot" />
                          <span className="prompt-label">Prompt:</span>
                        </div>

                        <div className="under-controls">
                          <div className="muted small">
                            {projects.length} saved •{" "}
                            {activeProjectId
                              ? `active: ${activeProjectId}`
                              : "no active project"}
                          </div>
                        </div>
                      </div>

                      <div className="prompt-actions" style={{ marginTop: 14 }}>
                        <button
                          onClick={() => handleCreate(false)}
                          className="btn-Create"
                          disabled={isCreating}
                        >
                          <FiPlus />{" "}
                          {isCreating ? "Creating..." : "Create"}
                        </button>

                        <button
                          onClick={() =>
                            saveCurrentProject({ title: prompt })
                          }
                          className="btn-Create"
                          disabled={isCreating}
                        >
                          <FiPlus />{" "}
                          {isCreating ? "Creating..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="hero-right-compact">
                <div className="suggestions-title">Recent Projects</div>
                <div style={{ marginTop: 8 }}>
                  {projects.length === 0 ? (
                    <div className="text-muted">No saved projects yet.</div>
                  ) : (
                    projects
                      .slice(0, 6)
                      .map((p) => renderProjectCard(p, { compact: true }))
                  )}
                </div>

                <div style={{ marginTop: 20 }}>
                  <button
                    className="icon-btn"
                    onClick={() => setActiveTab("projects")}
                  >
                    Open full History
                  </button>
                </div>
              </aside>
            </div>
          </div>
        );
    }
  };

  // ========= RENDER ROOT =========
  return (
    <div className="dashboard-root full-viewport">
      <aside className="leftbar leftbar-wide">
        <div className="brand-top">
          <div className="brand-mark">HJ</div>
          <div className="brand-name">Inhub</div>
        </div>

        <nav
          className="leftnav leftnav-full"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${
                activeTab === item.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(item.id)}
              aria-pressed={activeTab === item.id}
            >
              <div className="nav-icon">{item.icon}</div>
              <div className="nav-label">{item.label}</div>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="bottom-btn"
            onClick={() => alert("License — placeholder")}
          >
            License
          </button>
          <br />
          <br />
          <button
            className="bottom-btn"
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>
      </aside>

      <main className="main-area">{renderMainContent()}</main>

      {/* THEME + LAYOUT STYLES */}
      <style>{`
/* ==============================
   GLOBAL LAYOUT + THEME
   ==============================*/
.dashboard-root {
  display: flex;
  height: 100vh;
  background: linear-gradient(180deg, #0B1526 0%, #0A1624 100%);
  color: #e5e5e5;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

main.main-area {
  flex: 1;
  overflow-y: auto;
  padding: 32px 48px;
  background: transparent;
}

/* ==============================
   SIDEBAR
   ==============================*/
.leftbar-wide {
  width: 260px;
  background: #0E1A2B;
  border-right: 1px solid rgba(255,255,255,0.06);
  padding: 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #10a37f;
  font-size: 18px;
  font-weight: 800;
}

.brand-name {
  font-size: 18px;
  color: #ffffff;
  font-weight: 700;
}

.leftnav-full {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-btn {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  border-radius: 8px;
  font-size: 15px;
  color: #d1d1d1;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}

.nav-btn:hover {
  background: rgba(255,255,255,0.04);
}

.nav-btn.active {
  background: rgba(16,163,127,0.18);
  color: #ffffff;
}

.nav-icon {
  font-size: 18px;
}

.sidebar-bottom {
  margin-top: auto;
}

.bottom-btn {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  color: #d3d3d3;
  border: 1px solid rgba(255,255,255,0.06);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease;
}

.bottom-btn:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.12);
}

/* ==============================
   CONTENT WRAPS
   ==============================*/
.content-wrap {
  max-width: 1180px;
  margin: 0 auto;
}

.full-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.hero {
  display: flex;
  gap: 32px;
}

.hero-center-lower.with-offset {
  flex: 1;
}

.hero-right-compact {
  width: 320px;
}

/* ==============================
   HEADER / WELCOME
   ==============================*/
.welcome-gradient {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.welcome-sub {
  margin-top: 6px;
  font-size: 14px;
  color: #a1a1a1;
}

/* ==============================
   PROMPT CARD
   ==============================*/
.prompt-card-centered {
  max-width: 900px;
  margin: 0 auto;
  margin-top: 20px;
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  padding: 28px;
  border: 1px solid rgba(255,255,255,0.06);
}

textarea.prompt-textarea {
  width: 100%;
  min-height: 240px;
  background: #040916;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 18px;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
}

textarea.prompt-textarea:focus {
  border-color: #10a37f;
}

.btn-Create {
  padding: 12px 22px;
  border-radius: 8px;
  background: #10a37f;
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background .2s ease, transform .1s ease;
}

.btn-Create:hover {
  background: #0e8c6d;
}

.under-prompt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.prompt-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.prompt-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10a37f;
}

.prompt-label {
  font-size: 13px;
  color: #bfbfbf;
}

.prompt-actions {
  display: flex;
  gap: 10px;
}

/* ==============================
   PROJECT CARDS (sidebar + history)
   ==============================*/
.project-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease, background .15s ease;
}

.project-card.compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-card.full {
  padding: 18px 20px;
}

.project-card:hover {
  transform: translateY(-2px);
  border-color: #10a37f;
  box-shadow: 0px 8px 20px rgba(0,0,0,0.45);
}

.project-card.selected {
  border-color: #10a37f;
  background: rgba(16,163,127,0.14);
}

.project-name {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

.project-title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
}

.project-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-actions {
  display: flex;
  gap: 6px;
}

.icon-small {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #dcdcdc;
  transition: background .15s ease, border-color .15s ease;
}

.icon-small:hover {
  background: rgba(255,255,255,0.08);
  border-color: #10a37f;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.owner-badge {
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.06);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #dcdcdc;
  font-weight: 700;
}

.meta-title {
  font-size: 13px;
  color: #aaaaaa;
}

.meta-value {
  font-size: 14px;
  color: #ffffff;
}

.meta-right {
  text-align: right;
}

.meta-small {
  font-size: 12px;
  color: #a8a8a8;
}

.id-cell {
  margin-top: 4px;
  font-size: 11px;
  color: #10a37f;
}

.row-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #ffffff;
}

.project-compact-main {
  display: flex;
  gap: 10px;
  align-items: center;
}

.project-compact-actions {
  display: flex;
  gap: 8px;
}

/* generic buttons */
.icon-btn {
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  color: #e1e1e1;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease;
}

.icon-btn:hover {
  background: rgba(255,255,255,0.07);
  border-color: #10a37f;
}

.icon-btn.danger {
  border-color: #803b3b;
}

.text-neon {
  color: #10a37f;
}

/* ==============================
   PROJECT HISTORY
   ==============================*/
.history-wrap {
  margin-top: 6px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.history-title {
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-search {
  min-width: 220px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  color: #f2f2f2;
  font-size: 13px;
  outline: none;
}

.history-search::placeholder {
  color: #7f8084;
}

.history-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-history {
  margin-top: 30px;
  padding: 24px;
  border-radius: 12px;
  border: 1px dashed rgba(255,255,255,0.1);
  background: rgba(4,9,22,0.9);
  color: #a3a3a3;
  text-align: center;
}

/* ==============================
   TEXT UTILITIES
   ==============================*/
.muted {
  color: #a0a0a0;
}

.muted.small {
  font-size: 12px;
}

.muted.very-small {
  font-size: 11px;
}

.text-muted {
  color: #a0a0a0;
}

/* ==============================
   RESPONSIVE
   ==============================*/
@media (max-width: 1000px) {
  .leftbar-wide {
    width: 80px;
  }
  .brand-name,
  .nav-label {
    display: none;
  }

  main.main-area {
    padding: 24px 16px;
  }

  .hero {
    flex-direction: column;
  }

  .hero-right-compact {
    width: 100%;
  }
}
      `}</style>
    </div>
  );
}
