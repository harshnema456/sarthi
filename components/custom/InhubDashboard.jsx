"use client";
// import InhubDashboard from "@/components/custom/InhubDashboard";
import React, { useState, useEffect, useContext, useRef } from "react";
import CodeView from "@/components/custom/CodeView";
import ChatView from "@/components/custom/ChatView";
import WorkspaceHistory from "./WorkspaceHistory";
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
  const [code, setCode] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const promptRef = useRef(null);

  // make id
  const makeId = (prefix = "") =>
    `${prefix}${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;

  useEffect(() => {
    const fetchAndOpenProject = async () => {
      if (initialProjectId) {
        try {
          const proj = await CreateProject ? await (async () => {
            // prefer convex query if available
            try {
              return await fetch(`/api/projects/get?id=${initialProjectId}`).then((r) => r.json());
            } catch (e) {
              return null;
            }
          })() : null;
          if (proj) openProject(proj);
        } catch (e) {
          // fallback attempt to use convex API directly if set up
          try {
            const proj = await (typeof window !== "undefined" && window.fetch ? fetch(`/api/projects/get?id=${initialProjectId}`).then((r) => r.json()) : null);
            if (proj) openProject(proj);
          } catch (err) {}
        }
      }
    };
    fetchAndOpenProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId]);

  // hydrate projects from convex or localStorage fallback
  useEffect(() => {
    if (projectsQuery && Array.isArray(projectsQuery)) {
      setProjects(projectsQuery);
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setProjects(JSON.parse(raw));
      } catch (e) {}
    }
  }, [projectsQuery]);

  // persist locally as well (semi-offline)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    try {
      if (activeProjectId) localStorage.setItem(STORAGE_ACTIVE_KEY, activeProjectId);
      else localStorage.removeItem(STORAGE_ACTIVE_KEY);
    } catch (e) {}
  }, [activeProjectId]);

  // update preview from files -> Create blob url
  const updatePreview = (files) => {
    if (!files || typeof files !== "object") {
      clearPreview();
      return;
    }

    const htmlFile = files["index.html"] || { content: "<h1>No HTML</h1>" };
    const cssFile = files["styles.css"] || { content: "" };
    const jsFile = files["script.js"] || { content: "" };
    const sanitizedHtml = htmlFile.content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

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
      console.error("Could not Create preview blob", e);
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

  const clearPreview = () => {
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {}
    }
    setPreviewUrl("");
  };

  // Create project (from dashboard prompt)
  const handleCreate = async (fromSuggestion = false, autoSend = true) => {
    if (!prompt.trim()) return;
    setIsCreating(true);

    try {
      // Reuse existing active project if present
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

        // optimistic local add but avoid duplicates if it somehow already exists
        setProjects((prev) => {
          if (!Array.isArray(prev)) return [newProj];
          if (prev.find((p) => p.id === projId)) return prev;
          return [newProj, ...prev];
        });

        setProjectFiles({});
        setCode("");

        // persist to Convex (fire-and-forget)
        (async () => {
          try {
            await CreateProject(newProj);
          } catch (err) {
            console.warn("CreateProject convex failed", err);
          }
        })();
      }

      // set active project so ChatView gets it in props
      setActiveProjectId(projId);

      // dispatch event for ChatView to pick up — small delay so prop flows
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("DASHBOARD_PROMPT", {
              detail: { prompt, projectId: projId, autoSend: !!autoSend },
            })
          );
        }, 80);
      }

      // switch to chat
      setActiveTab("chat");
    } finally {
      setIsCreating(false);
      setPrompt("");
    }
  };

  // open project
  const openProject = async (proj) => {
    if (!proj) return;
    const projectObj = typeof proj === "string" ? projects.find((p) => p.id === proj) : proj;
    if (!projectObj) {
      // try fetch from server
      try {
        const fetched = await fetch(`/api/projects/get?id=${proj}`).then((r) => r.json()).catch(() => null);
        if (fetched) {
          setProjects((prev) => {
            if (!Array.isArray(prev)) return [fetched];
            // avoid duplicates
            if (prev.find((p) => p.id === fetched.id)) return prev.map(p => p.id === fetched.id ? fetched : p);
            return [fetched, ...prev];
          });
          return openProject(fetched);
        }
      } catch (e) {}
      return;
    }

    setActiveProjectId(projectObj.id);
    setProjectFiles(projectObj.filesObj || {});
    setCode(projectObj.filesObj?.["index.html"]?.content || "");
    updatePreview(projectObj.filesObj || {});
    setActiveTab("code");
  };

  // delete project
  const deleteProject = async (projId) => {
    if (!projId) return;
    if (!confirm("Delete project? This cannot be undone.")) return;

    setProjects((prev) => prev.filter((p) => p.id !== projId));
    try {
      await removeProject({ id: projId, owner: displayName });
    } catch (e) {
      console.warn("convex remove failed", e);
    }

    if (activeProjectId === projId) {
      setActiveProjectId(null);
      setProjectFiles({});
      setCode("");
      clearPreview();
    }
  };

  // save current project (persist server-side)
  const saveCurrentProject = async (opts = {}) => {
    const pid = activeProjectId || makeId("proj-");
    const title = opts.title || prompt || `Project ${new Date().toLocaleString()}`;

    const project = {
      id: pid,
      name: title,
      owner: displayName,
      filesObj: projectFiles || {},
      filesCount: Object.keys(projectFiles || {}).length,
      CreatedAt: new Date().toISOString(),
    };

    // local optimistic update (replace if exists)
    setProjects((prev) => {
      const idx = Array.isArray(prev) ? prev.findIndex((p) => p.id === pid) : -1;
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], ...project };
        return clone;
      }
      return [project, ...(Array.isArray(prev) ? prev : [])];
    });

    setActiveProjectId(pid);

    // try Create then update if needed
    try {
      await CreateProject(project);
    } catch (err) {
      // if exists, update
      try {
        await updateProject({ id: pid, filesObj: project.filesObj, filesCount: project.filesCount, owner: project.owner });
      } catch (e) {
        console.warn("Could not persist project to server", e);
      }
    }
  };

  // listen for AI generated files & file updates
  useEffect(() => {
    const onAIFiles = (e) => {
      const detail = e.detail || {};
      const files = detail.files || detail;
      if (!files || typeof files !== "object") return;

      const projId = detail.projectId || activeProjectId || makeId("proj-");
      const title = detail.title || prompt || "Chat generated project";

      setProjectFiles(files);
      setCode(files["index.html"]?.content || "");
      updatePreview(files);

      setProjects((prev) => {
        const existingIndex = Array.isArray(prev) ? prev.findIndex((p) => p.id === projId) : -1;
        const base = existingIndex >= 0 ? prev[existingIndex] : { id: projId, owner: displayName };
        const updated = {
          ...base,
          id: projId,
          name: base.name || title,
          owner: base.owner || displayName,
          filesObj: files,
          filesCount: Object.keys(files).length,
          CreatedAt: base.CreatedAt || new Date().toISOString(),
        };
        if (existingIndex >= 0) {
          const clone = [...prev];
          clone[existingIndex] = updated;
          return clone;
        }
        return [updated, ...(Array.isArray(prev) ? prev : [])];
      });

      setActiveProjectId(projId);

      // persist to server asynchronously (Create then update if needed)
      (async () => {
        try {
          await CreateProject({
            id: projId,
            name: title,
            owner: displayName,
            filesObj: files,
            filesCount: Object.keys(files).length,
            CreatedAt: new Date().toISOString(),
          });
        } catch (err) {
          // if Create fails, try update
          try {
            await updateProject({ id: projId, filesObj: files, filesCount: Object.keys(files).length, owner: displayName });
          } catch (e) {
            console.warn("persist AI files failed", e);
          }
        }
      })();

      // navigate Code -> Preview for UX
      setActiveTab("code");
      setTimeout(() => setActiveTab("preview"), 250);
    };

    const onFileUpdate = (e) => {
      const detail = e.detail || {};
      const files = detail.files || detail;
      if (!files || typeof files !== "object") return;
      const projId = detail.projectId || activeProjectId || makeId("proj-");

      setProjectFiles(files);
      setCode(files["index.html"]?.content || "");
      updatePreview(files);

      setProjects((prev) => {
        const idx = Array.isArray(prev) ? prev.findIndex((p) => p.id === projId) : -1;
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = {
            ...clone[idx],
            filesObj: files,
            filesCount: Object.keys(files).length,
          };
          return clone;
        }
        // Create new
        const newProj = {
          id: projId,
          name: prompt || `Project ${new Date().toLocaleString()}`,
          owner: displayName,
          filesObj: files,
          filesCount: Object.keys(files).length,
          CreatedAt: new Date().toISOString(),
        };
        return [newProj, ...(Array.isArray(prev) ? prev : [])];
      });

      setActiveProjectId(projId);

      // persist update
      (async () => {
        try {
          await updateProject({ id: projId, filesObj: files, filesCount: Object.keys(files).length, owner: displayName });
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

  // UI helpers
  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch (e) {
      console.warn("copy failed", e);
    }
  };

  // render project card
  const renderProjectCard = (p) => {
    return (
      <div
        key={p._id}

        className={`project-card ${activeProjectId === p.id ? "selected" : ""}`}
        onClick={() => openProject(p)}
        role="button"
        aria-label={`Open ${p.name}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") openProject(p);
        }}
      >
        <div className="project-card-top">
          <div className="project-name">{p.name}</div>
          <div className="project-actions">
            <button
              className="icon-small"
              onClick={(ev) => {
                ev.stopPropagation();
                copyId(p._id);
              }}
              title="Copy ID"
              aria-label="Copy project id"
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
              aria-label="Open project"
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
              aria-label="Delete project"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>

        <div className="project-meta">
          <div className="meta-left">
            <div className="owner-badge">{(p.owner || "Y").slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="meta-title">Files</div>
              <div className="meta-value">{p.filesCount}</div>
            </div>
          </div>

          <div className="meta-right">
            <div className="meta-small">Created</div>
            <div className="meta-small">{new Date(p.CreatedAt).toLocaleDateString()}</div>
            <div className="meta-small id-cell">{p.id}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectHistorySection = () => {
    return (
      <div className="history-wrap">
        <div className="history-header">
          <h3>Project History</h3>
          <div className="history-actions">
            <button
              className="icon-btn"
              onClick={() => {
                // manual refresh
                window.location.reload();
              }}
            >
              Refresh
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                alert("Export placeholder");
              }}
            >
              Export
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="empty-history">No projects yet — Create one from the prompt.</div>
        ) : (
          <div className="history-grid">{projects.map((p) => renderProjectCard(p))}</div>
        )}
      </div>
    );
  };

  // main renderer
  const renderMainContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <div className="content-wrap">
            <div className="full-hero" style={{ marginBottom: 16 }}>
              <div>
                <h1 className="welcome">Chat</h1>
                <p className="muted">Describe what you want to build for this project.</p>
                {activeProjectId && <div className="muted small">Active: <span className="text-neon">{activeProjectId}</span></div>}
              </div>
            </div>
            <ChatView openCode={() => setActiveTab("code")} activeProjectId={activeProjectId} initialPrompt={prompt} />
          </div>
        );

      case "code":
        return (
          <div className="content-wrap">
            <div className="full-hero" style={{ marginBottom: 12 }}>
              <div>
                <h1 className="welcome">Code</h1>
                <p className="muted">Generated source files for your current project.</p>
                {activeProjectId && <div className="muted small">Active: <span className="text-neon">{activeProjectId}</span></div>}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => saveCurrentProject({ title: prompt })} className="icon-btn" title="Save project">
                  <FiSave /> Save
                </button>
                <button onClick={() => setActiveTab("preview")} className="icon-btn">
                  Open Preview
                </button>
              </div>
            </div>

            <CodeView projectFiles={projectFiles} activeProjectId={activeProjectId} />
          </div>
        );

      case "preview":
        return (
          <div className="content-wrap">
            <div className="full-hero" style={{ marginBottom: 12 }}>
              <div>
                <h1 className="welcome">Preview</h1>
                <p className="muted">Live preview of your generated project.</p>
                {activeProjectId && <div className="muted small">Active: <span className="text-neon">{activeProjectId}</span></div>}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="icon-btn" onClick={() => setActiveTab("code")}>
                  Edit Code
                </button>
                <button className="icon-btn" onClick={() => saveCurrentProject({ title: prompt })}>
                  <FiSave /> Save
                </button>
              </div>
            </div>

            <PreviewView files={projectFiles} previewUrl={previewUrl} clearPreview={clearPreview} activeProjectId={activeProjectId} />
          </div>
        );

      case "projects":
        return (
          <div className="content-wrap">
            {renderProjectHistorySection()}
          </div>
        );

      default:
        return (
          <div className="content-wrap full-page">
            <div className="hero hero-centered-lower">
              <div className="hero-center-lower with-offset">
                <div style={{ width: "100%", maxWidth: 980 }}>
                  <div className="welcome-outside">
                    <div className="welcome-row">
                      <div className="user-bubble">{(displayName || "G").slice(0, 1).toUpperCase()}</div>
                      <div className="welcome-texts">
                        <div className="welcome-gradient">Welcome back — {displayName}!</div>
                        <div className="welcome-sub">Type a prompt below and hit Create to begin.</div>
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
                          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleCreate(false);
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
                          <div className="muted small">{projects.length} saved • {activeProjectId ? `active: ${activeProjectId}` : "no active project"}</div>
                        </div>
                      </div>

                      <div className="prompt-actions" style={{ marginTop: 14 }}>
                        <button onClick={() => handleCreate(false)} className="btn-Create" disabled={isCreating}><FiPlus /> {isCreating ? "Creating..." : "Create"}</button>
                        <button className="icon-btn" onClick={() => saveCurrentProject({ title: prompt })}><FiSave /> Save</button>
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
                    projects.slice(0, 6).map((p) => (
                      <div
      key={p._id}   // ← fixed here
      className={`project-card ${activeProjectId === p.id ? "selected" : ""}`}
      onClick={() => openProject(p)}
    >
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div className="row-avatar">{(p.name || "").slice(0, 1)}</div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{p.name}</div>
                            <div className="muted small">{p.filesCount} files • {new Date(p.CreatedAt).toLocaleDateString()}</div>
                            <div className="muted very-small id-inline">id: <span className="text-neon">{p.id}</span></div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="icon-btn" onClick={() => openProject(p)}>Open</button>
                          <button className="icon-btn danger" onClick={() => deleteProject(p.id)}><FiTrash2 /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ marginTop: 20 }}>
                  <button className="icon-btn" onClick={() => setActiveTab("projects")}>Open full History</button>
                </div>
              </aside>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-root full-viewport">
      {/* Sidebar */}
      <aside className="leftbar leftbar-wide">
        <div className="brand-top">
          <div className="brand-mark">HJ</div>
          <div className="brand-name">Inhub</div>
        </div>

        <nav className="leftnav leftnav-full" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button key={item.id} className={`nav-btn ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)} aria-pressed={activeTab === item.id}>
              <div className="nav-icon">{item.icon}</div>
              <div className="nav-label">{item.label}</div>
            </button>
          ))}
        </nav>

        <div className="left-bottom">
          <button className="bottom-btn" onClick={() => alert("License — placeholder")}>License</button>
          <button className="bottom-btn" onClick={() => setActiveTab("settings")}>Settings</button>
        </div>
      </aside>

      <main className="main-area">{renderMainContent()}</main>

      {/* Styles (self-contained) */}
      <style>{`
        :root { --neon: #00d4b4; --panel: rgba(255,255,255,0.02); --muted: rgba(255,255,255,0.6); --card-from: #071821; --card-to: #04121a; }
        .full-viewport { min-height: 100vh; height: 100vh; display:flex; }
        .dashboard-root { width:100%; display:flex; background: linear-gradient(180deg,#06121a,#041016); color:#e6f6f5; font-family: Inter, system-ui, Roboto, "Segoe UI"; }

        /* LEFT BAR */
        .leftbar-wide { width:220px; padding:18px 12px; display:flex; flex-direction:column; gap:18px; background: linear-gradient(180deg,#04121a,#031219); border-right: 1px solid rgba(255,255,255,0.02); }
        .brand-top { display:flex; align-items:center; gap:10px; }
        .brand-mark { width:48px;height:48px;border-radius:10px; background: linear-gradient(180deg,#022a27,#003936); display:flex;align-items:center;justify-content:center;color:var(--neon);font-weight:800; font-size:16px; }
        .brand-name { font-weight:800; color:#eaf6f3; font-size:16px; }

        .leftnav-full { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .nav-btn { display:flex; align-items:center; gap:10px; background:transparent; border:none; text-align:left; padding:10px 12px; border-radius:10px; color: rgba(255,255,255,0.9); font-weight:700; cursor:pointer; transition: all .12s; }
        .nav-btn:hover { transform: translateX(6px); background: rgba(255,255,255,0.02); }
        .nav-btn.active { color: var(--neon); background: linear-gradient(90deg, rgba(0,212,180,0.06), rgba(0,212,180,0.02)); transform: translateX(6px); box-shadow: 0 8px 30px rgba(0,0,0,0.6) inset; }
        .nav-icon { font-size:18px; color: rgba(255,255,255,0.75); }
        .nav-label { font-size:14px; }

        .left-bottom { margin-top:auto; display:flex; flex-direction:column; gap:10px; }
        .bottom-btn { display:flex; gap:10px; align-items:center; padding:10px 12px; border-radius:8px; background: transparent; border:1px solid rgba(255,255,255,0.02); color: rgba(255,255,255,0.8); cursor:pointer; font-weight:700; }
        .bottom-btn:hover { transform: translateY(-3px); background: rgba(255,255,255,0.02); }

        /* MAIN */
        .main-area { flex:1; position:relative; overflow:auto; padding:36px; }
        .content-wrap { position:relative; z-index:2; }

        .hero { display:flex; gap:28px; align-items:flex-end; justify-content:center; }
        .hero-center-lower { flex:1; display:flex; justify-content:center; align-items:flex-end; min-height: calc(58vh + 38px); }
        .hero-right-compact { width:360px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); padding:18px; border-radius:12px; min-height:220px; }

        /* welcome outside */
        .welcome-outside { margin-bottom: 12px; color: #eaf6f3; }
        .welcome-row { display:flex; gap:14px; align-items:center; margin-bottom:8px; }
        .user-bubble { width:56px; height:56px; border-radius:12px; display:flex; align-items:center; justify-content:center; background: linear-gradient(180deg,#002b2a,#003936); color: #e8fff7; font-weight:900; font-size:18px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); border: 1px solid rgba(0,212,180,0.08); }
        .welcome-gradient { font-size:22px; font-weight:900; background: linear-gradient(90deg, #fff, #dff7f0, rgba(0,212,180,0.9)); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 3px 18px rgba(0,0,0,0.6); letter-spacing:-0.3px; }
        .welcome-sub { margin:6px 0 0 0; color: var(--muted); font-size:13px; }

        /* prompt card */
        .prompt-card-centered.lower { width:100%; max-width:980px; background: linear-gradient(180deg,var(--card-from),var(--card-to)); border: 1px solid var(--panel); border-radius:14px; padding:18px; box-shadow: 0 14px 40px rgba(3,9,14,0.6); transition: transform .18s; transform-origin: center bottom; }
        .prompt-textarea { width:100%; min-height:120px; resize:vertical; border-radius:10px; padding:12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); color: #eaf6f3; outline:none; font-size:15px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.35); }
        .prompt-actions { display:flex; gap:12px; margin-top:12px; align-items:center; }

        /* history / cards */
        .history-wrap { padding:8px 4px; }
        .history-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
        .history-header h3 { margin:0; font-size:20px; }
        .history-actions { display:flex; gap:8px; }
        .history-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }

        .project-card { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-radius:12px; padding:12px; cursor:pointer; transition: transform .12s, box-shadow .12s; border:1px solid rgba(255,255,255,0.02); }
        .project-card:hover { transform: translateY(-6px); box-shadow: 0 18px 50px rgba(0,0,0,0.6); }
        .project-card.selected { outline: 2px solid rgba(0,212,180,0.12); transform: translateY(-2px); }
        .project-card-top { display:flex; justify-content:space-between; align-items:center; gap:8px; }
        .project-name { font-weight:800; font-size:15px; }
        .project-actions { display:flex; gap:6px; opacity:0; transition: opacity .12s; }
        .project-card:hover .project-actions { opacity:1; }
        .icon-small { background: transparent; border: none; padding:6px; border-radius:8px; color: rgba(255,255,255,0.8); cursor:pointer; display:inline-flex; }
        .icon-small:hover { background: rgba(255,255,255,0.02); color: var(--neon); }

        .project-meta { display:flex; justify-content:space-between; align-items:center; margin-top:12px; gap:12px; }
        .owner-badge { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; background: linear-gradient(180deg,#02111a,#001419); color:var(--neon); font-weight:800; margin-right:8px; }
        .meta-left { display:flex; align-items:center; gap:8px; }
        .meta-right { text-align:right; font-size:12px; color:var(--muted); }
        .id-cell { margin-top:6px; font-family: monospace; color: rgba(255,255,255,0.7); }

        /* recent list */
        .recent-row { border-bottom: 1px solid rgba(255,255,255,0.02); padding:8px 0; }

        .text-neon { color: var(--neon); font-weight:700; }
        .muted { color: var(--muted); }
        .very-small { font-size:11px; color: var(--muted); }

        .icon-btn { background:transparent; border:1px solid rgba(255,255,255,0.04); padding:8px 10px; border-radius:8px; cursor:pointer; color:#eaf6f3; display:inline-flex; align-items:center; gap:8px; }
        .btn-Create { padding:10px 16px; border-radius:10px; background: linear-gradient(180deg,#00e6c7,#00c1a1); color:#00201b; font-weight:700; border:none; cursor:pointer; }

        @media (max-width: 1100px) {
          .leftbar-wide { width:72px; padding:14px 8px; }
          .brand-name { display:none; }
          .nav-label { display:none; }
          .history-grid { grid-template-columns: repeat(1, 1fr); }
        }
      `}</style>
    </div>
  );
}
