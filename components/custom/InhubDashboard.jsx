// src/components/InhubDashboard.jsx
'use client';
import React, { useState, useEffect, useContext } from "react";
import CodeView from '@/components/custom/CodeView';
import ChatView from '@/components/custom/ChatView';
import WorkspaceHistory from './WorkspaceHistory';
import PreviewView from './Previewview';
import {
  FiGrid,
  FiFolder,
  FiCode,
  FiEye,
  FiMessageSquare,
  FiSettings,
  FiPlus,
  FiMoreHorizontal,
  FiTrash2,
  FiClock,
  FiExternalLink,
  FiRefreshCw,
  FiX
} from "react-icons/fi";
import { UserDetailContext } from '@/context/UserDetailContext';

/*
  This variant stores created projects in local state (projects[])
  and shows them in the Recent Projects list. Opening/deleting works.
  PreviewView is imported from ./Previewview (external file) so the
  dashboard file stays lean and doesn't interfere with the rest of the app.
*/

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <FiGrid /> },
  { id: "projects", label: "Projects", icon: <FiFolder /> },
  { id: "code", label: "Code", icon: <FiCode /> },
  { id: "preview", label: "Preview", icon: <FiEye /> },
  { id: "chat", label: "Chat", icon: <FiMessageSquare /> },
];

export default function InhubDashboard() {
  const { userDetail } = useContext(UserDetailContext) ?? {};
  const displayName = userDetail?.name || userDetail?.displayName || userDetail?.email?.split?.('@')?.[0] || 'Guest';

  const [activeTab, setActiveTab] = useState("dashboard");
  const [prompt, setPrompt] = useState("");
  const [tokensLeft, setTokensLeft] = useState(75);
  const [tokensUsed, setTokensUsed] = useState(25);
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [code, setCode] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState('');
  const [projectFiles, setProjectFiles] = useState({});
  const [activeFile, setActiveFile] = useState('index.html');
  const [projects, setProjects] = useState([]);
  const [projectCreated, setProjectCreated] = useState(false);

  const stats = {
    workspaces: projects.length,
    collaborators: 2,
    totalFiles: Object.keys(projectFiles).length,
  };

  const makeId = (prefix = '') => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;

  const generateProjectFiles = (projName) => {
    return {
      'index.html': {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projName}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to ${projName}</h1>
    <p>Your project has been successfully created!</p>
    <div id="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        language: 'html'
      },
      'styles.css': {
        name: 'styles.css',
        content: `body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto; margin:0; padding:20px; background:#07101a; color:#dbeafe }
.container { max-width:1200px; margin:0 auto; padding:2rem; background:#041021; border-radius:8px }
h1 { color:#00d4b4 }`,
        language: 'css'
      },
      'script.js': {
        name: 'script.js',
        content: `const outputElement = document.getElementById('output'); function init(){ if(outputElement) outputElement.textContent = 'JavaScript is working! ✅'; } document.addEventListener('DOMContentLoaded', init);`,
        language: 'javascript'
      },
      'README.md': {
        name: 'README.md',
        content: `# ${projName}\n\nGenerated project.`,
        language: 'markdown'
      }
    };
  };

  const updatePreview = (files) => {
    const htmlFile = files['index.html'] || { content: '<h1>No HTML</h1>' };
    const cssFile = files['styles.css'] || { content: '' };
    const jsFile = files['script.js'] || { content: '' };

    const previewContent = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>${cssFile.content}</style>
      </head>
      <body>
        ${htmlFile.content.replace(/<script.*?>.*?<\/script>/gs, '')}
        <script>
          try {
            ${jsFile.content}
          } catch(e) { console.error('Preview error', e); }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([previewContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
  };

  const handleCreate = async () => {
    if (!prompt.trim()) return;
    setIsCreating(true);
    setCreationStatus('Generating files...');
    try {
      const files = generateProjectFiles(prompt);
      setProjectFiles(files);
      setCode(files['index.html'].content);
      updatePreview(files);

      const newProj = {
        id: makeId('proj-'),
        name: prompt,
        owner: displayName,
        filesObj: files,
        filesCount: Object.keys(files).length,
        createdAt: new Date().toISOString(),
      };

      setProjects((prev) => [newProj, ...prev]);

      setCreationStatus('Created');
      setChatHistory((prev) => [
        ...prev,
        {
          text: `Project "${prompt}" created by ${displayName}.`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        },
      ]);

      setTimeout(() => {
        setActiveTab('code');
        setProjectFiles(files);
      }, 300);
    } catch (e) {
      console.error(e);
      setCreationStatus('Failed to create project');
    } finally {
      setIsCreating(false);
      setPrompt('');
    }
  };

  const openProject = (proj) => {
    if (!proj) return;
    const projectObj = typeof proj === 'string' ? projects.find(p => p.id === proj) : proj;
    if (!projectObj) return;
    setProjectFiles(projectObj.filesObj || {});
    setCode((projectObj.filesObj && projectObj.filesObj['index.html'] && projectObj.filesObj['index.html'].content) || '');
    setActiveFile('index.html');
    setProjectCreated(true);
    setActiveTab('code');
    updatePreview(projectObj.filesObj || {});
  };

  const deleteProject = (projId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projId));
    const currentlyOpenIsDeleted = projectFiles && Object.keys(projectFiles).length && projects.some(p => p.id === projId && p.filesObj === projectFiles);
    if (currentlyOpenIsDeleted) {
      setProjectFiles({});
      setProjectCreated(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
    }
  };

  const clearPreview = () => {
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch (e) { /* ignore */ }
    }
    setPreviewUrl('');
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const renderMainContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="content-wrap">
            <ChatView
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              tokensLeft={tokensLeft}
              tokensUsed={tokensUsed}
              projectName={projects[0]?.name || ''}
            />
          </div>
        );

      case 'code':
        return (
          <div className="content-wrap">
            <CodeView
              projectFiles={projectFiles}
              activeFile={activeFile}
              setActiveFile={setActiveFile}
              code={code}
              setCode={setCode}
              previewUrl={previewUrl}
              updatePreview={() => updatePreview(projectFiles)}
              projectName={projects[0]?.name || ''}
            />
          </div>
        );

      case 'preview':
        return (
          <div className="content-wrap">
            <PreviewView
              previewUrl={previewUrl}
              refreshPreview={() => updatePreview(projectFiles)}
              clearPreview={clearPreview}
              projectName={projects[0]?.name || ''}
            />
          </div>
        );

      case 'projects':
        return (
          <div className="content-wrap">
            <h2 className="section-title">Projects</h2>
            <WorkspaceHistory
              projectFiles={projectFiles}
              activeFile={activeFile}
              setActiveFile={setActiveFile}
              code={code}
              setCode={setCode}
              openProject={openProject}
              deleteProject={deleteProject}
            />
          </div>
        );

      default:
        return (
          <div className="content-wrap full-page">
            <div className="hero full-hero">
              <div>
                <h1 className="welcome">Welcome, {displayName}!</h1>
                <p className="muted">Overview of your workspace and recent projects</p>
              </div>

              <div className="create-area">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="New project name"
                  className="input-project"
                  aria-label="New project name"
                />
                <button onClick={handleCreate} className="btn-create" disabled={isCreating}>
                  <FiPlus /> {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-title">Workspaces</div>
                <div className="stat-value">{stats.workspaces}</div>
                <div className="stat-sub">active</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Collaborators</div>
                <div className="stat-value">{stats.collaborators}</div>
                <div className="stat-sub">invited</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Files</div>
                <div className="stat-value">{stats.totalFiles}</div>
                <div className="stat-sub">total</div>
              </div>
            </div>

            <div className="recent-card">
              <div className="recent-header">
                <div>
                  <h3>Recent Projects</h3>
                  <div className="muted small">Quick access to your latest work</div>
                </div>
                <div className="recent-actions">
                  <button className="ghost">Sort</button>
                  <button className="ghost">Filter</button>
                </div>
              </div>

              <div className="recent-list">
                {projects.length === 0 ? (
                  <div className="text-muted">No projects yet — create one above.</div>
                ) : (
                  projects.map((p) => (
                    <div key={p.id} className="recent-row">
                      <div className="row-left">
                        <div className="row-avatar">{(p.name || '').slice(0,1)}</div>
                        <div className="row-meta">
                          <div className="row-title">{p.name}</div>
                          <div className="row-sub muted">{p.owner ?? displayName} • {p.filesCount} files</div>
                        </div>
                      </div>

                      <div className="row-right">
                        <div className="row-time muted"><FiClock /> {new Date(p.createdAt || Date.now()).toLocaleDateString()}</div>
                        <div className="row-actions">
                          <button title="Open" onClick={() => openProject(p)} className="icon-btn">Open</button>
                          <button title="Delete" onClick={() => deleteProject(p.id)} className="icon-btn danger"><FiTrash2 /></button>
                          <button className="icon-more" title="More"><FiMoreHorizontal /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        );
    }
  };

  return (
    <div className="dashboard-root full-viewport">
      <aside className="leftbar">
        <div className="brand-wrap">
          <div className="brand-mark">HJ</div>
        </div>

        <nav className="leftnav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              aria-pressed={activeTab === item.id}
            >
              <div className="nav-icon">{item.icon}</div>
              <div className="nav-label">{item.label}</div>
            </button>
          ))}
        </nav>

        <div className="left-bottom">
          <button className="round-ghost" title="Settings"><FiSettings /></button>
        </div>
      </aside>

      <main className="main-area">
        <div className="grid-overlay" />
        {renderMainContent()}
      </main>

      {/* Inline styling (same as previous theme, preview styles moved to Previewview file) */}
      <style>{`
        :root{
          --bg:#030617;
          --panel:#07101a;
          --neon:#00d4b4;
        }

        .full-viewport { min-height: 100vh; height: 100vh; display:flex; }

        .dashboard-root {
          width: 100%;
          display: flex;
          background: linear-gradient(180deg, #02040a, #02060c);
          color: #dbeafe;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto;
        }

        .leftbar {
          width: 84px;
          background: linear-gradient(180deg, #041022, #061723);
          border-right: 1px solid rgba(255,255,255,0.03);
          display:flex;
          flex-direction:column;
          align-items:center;
          padding: 18px 8px;
          gap: 8px;
          position: relative;
        }
        .brand-wrap { display:flex; flex-direction:column; align-items:center; gap:6px; margin-bottom: 6px; }
        .brand-mark { width:44px;height:44px;border-radius:10px; background: linear-gradient(180deg,#02111a,#001419); display:flex;align-items:center;justify-content:center; color:var(--neon);font-weight:700; }
        .leftnav { display:flex;flex-direction:column; gap:6px; margin-top: 8px; width:100%; align-items:center;}
        .nav-btn { width:100%; padding:12px 6px; border-radius:10px; display:flex; flex-direction:column; align-items:center; gap:6px; background:transparent; border:none; color:rgba(255,255,255,0.6); cursor:pointer; transition: all .12s; }
        .nav-btn .nav-icon { font-size:18px; }
        .nav-btn:hover { background: rgba(0,0,0,0.14); color: #fff; transform: translateX(2px); }
        .nav-btn.active { background: rgba(0,212,180,0.07); color: var(--neon); box-shadow: 0 6px 20px rgba(0,212,180,0.04) inset; transform: translateX(2px); border-left: 3px solid rgba(0,212,180,0.18); }
        .left-bottom { margin-top:auto;padding-bottom:8px; }
        .round-ghost { background:transparent;border:1px solid rgba(255,255,255,0.02); padding:8px;border-radius:10px; color:rgba(255,255,255,0.6); }

        .main-area {
          flex:1;
          position:relative;
          overflow:auto;
          padding: 24px;
          min-height:100vh;
        }

        .grid-overlay {
          position:absolute;
          inset:0;
          background-image:
            linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 140px 140px;
          pointer-events:none;
          opacity:0.06;
        }

        .content-wrap {
          position:relative;
          z-index:2;
          width: 100%;
          max-width: none;
        }

        .full-hero {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:20px;
          margin-bottom: 22px;
          width: 100%;
        }
        .welcome { margin:0; font-size:36px; font-weight:700; color:#e6f0ff; }
        .muted{ color: rgba(255,255,255,0.55); }
        .create-area { display:flex; gap:10px; align-items:center; }

        .input-project {
          min-width:280px;
          padding:10px 12px;
          border-radius:8px;
          background: linear-gradient(180deg,#061423,#04121a);
          border: 1px solid rgba(255,255,255,0.02);
          color:#dbeafe;
          outline:none;
        }
        .input-project::placeholder { color: rgba(219,234,254,0.35); }

        .btn-create {
          display:inline-flex; align-items:center; gap:8px;
          padding:10px 14px; border-radius:9px;
          background: linear-gradient(180deg, #00e6c7, #00c1a1);
          color: #00201b; font-weight:700; border:none; cursor:pointer;
          box-shadow: 0 8px 30px rgba(0,212,180,0.12);
        }

        .stats-row {
          display:flex;
          gap:16px;
          margin-bottom:20px;
        }
        .stat-card {
          flex:1;
          background: linear-gradient(180deg, rgba(255,255,255,0.012), rgba(255,255,255,0.01));
          border-radius:12px;
          padding:16px;
          border:1px solid rgba(255,255,255,0.02);
          box-shadow: 0 6px 20px rgba(0,0,0,0.6);
        }
        .stat-title { color: rgba(255,255,255,0.7); font-size:13px; margin-bottom:6px;}
        .stat-value { font-size:28px; font-weight:700; color: #e6f0ff; margin-bottom:4px;}
        .stat-sub { color: rgba(255,255,255,0.45); font-size:12px; }

        .recent-card { margin-top:14px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.008)); border-radius:12px; padding:14px; border:1px solid rgba(255,255,255,0.02); }
        .recent-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
        .recent-header h3{ margin:0; color:#e6f0ff; }
        .recent-header .small{ color: rgba(255,255,255,0.5); font-size:13px; }

        .recent-list { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .recent-row{
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:12px;
          border-radius:10px;
          background: linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.12));
          border:1px solid rgba(255,255,255,0.015);
          transition: transform .12s, box-shadow .12s, background .12s;
        }
        .recent-row:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(2,10,18,0.6); }
        .row-left { display:flex; align-items:center; gap:12px; }
        .row-avatar { width:44px;height:44px;border-radius:8px; background: linear-gradient(180deg,#02111a,#001419); color:var(--neon);display:flex;align-items:center;justify-content:center;font-weight:700; }
        .row-title { font-weight:700; color:#eaf6f3; }
        .row-sub { color: rgba(255,255,255,0.45); font-size:13px; margin-top:2px; }
        .row-right { display:flex; align-items:center; gap:12px; }
        .row-time { color: rgba(255,255,255,0.45); font-size:13px; display:flex; gap:6px; align-items:center; }
        .row-actions { display:flex; gap:8px; align-items:center; }
        .icon-btn { background:transparent;border:1px solid rgba(255,255,255,0.03);color:rgba(255,255,255,0.8); padding:6px 8px;border-radius:8px; cursor:pointer; }
        .icon-btn.danger { border-color: rgba(255,50,50,0.15); color: rgba(255,120,120,0.95); }
        .icon-more { background:transparent;border:none;color:rgba(255,255,255,0.6);padding:6px;border-radius:6px; cursor:pointer; }

        .section-title { font-size:20px; color:#e6f0ff; margin-bottom:12px; }
        .text-muted { color: rgba(255,255,255,0.45); }
        .small { font-size:13px; color: rgba(255,255,255,0.6); }

        @media (max-width: 1100px) {
          .stats-row { flex-direction:column; }
          .create-area { flex-wrap:wrap; }
          .input-project { min-width:200px; }
          .main-area { padding:16px; }
        }
      `}</style>
    </div>
  );
}
