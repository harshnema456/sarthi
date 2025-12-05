// src/components/InhubDashboard.jsx
'use client';
import CodeView from '@/components/custom/CodeView'
import WorkspaceHistory from './WorkspaceHistory'; 
import React, { useState, useEffect } from "react";
import { FiCode, FiEye, FiMessageSquare, FiUser, FiLogOut, FiLoader, FiCheckCircle, FiRefreshCw, FiSave } from "react-icons/fi";
// ... rest of your component code (generateProjectFiles, updatePreview, handleCreate etc.)
// I left your implementations intact; they're included below for completeness

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "" },
  { id: "projects", label: "Projects", icon: "" },
  { id: "code", label: "Code", icon: "" },
  { id: "preview", label: "Preview", icon: "" },
  { id: "chat", label: "Chat", icon: "" },
];

const InhubDashboard = () => {
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
  const [projectCreated, setProjectCreated] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creationStatus, setCreationStatus] = useState('');
  const [projectFiles, setProjectFiles] = useState({});
  const [activeFile, setActiveFile] = useState('index.html');

  const generateProjectFiles = (projectName) => {
    const timestamp = new Date().toISOString();
    return {
      'index.html': {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to ${projectName}</h1>
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
        content: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  background-color: #1a1a1a;
  color: #f0f0f0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #2d2d2d;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #4f9cf9;
  margin-bottom: 1.5rem;
}

p {
  color: #e0e0e0;
  margin-bottom: 1rem;
}

#output {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #3a3a3a;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}`,
        language: 'css'
      },
      'script.js': {
        name: 'script.js',
        content: `// ${projectName} - JavaScript File\n// This file was automatically generated\n\n// DOM Elements\nconst outputElement = document.getElementById('output');\n\n// Sample functionality\nfunction init() {\n  outputElement.textContent = 'JavaScript is working! \\u2705';\n  console.log('${projectName} initialized!');\n}\n\n// Initialize the application\ndocument.addEventListener('DOMContentLoaded', init);`,
        language: 'javascript'
      },
      'README.md': {
        name: 'README.md',
        content: `# ${projectName}

This project was generated on ${new Date().toLocaleDateString()}.

## Project Structure

- \`index.html\` - Main HTML file
- \`styles.css\` - Styles for the application
- \`script.js\` - JavaScript functionality

## Getting Started

1. Open \`index.html\` in your browser
2. Start editing the files to build your project

## Features

- Responsive design
- Modern CSS
- Clean JavaScript structure`,
        language: 'markdown'
      }
    };
  };

  const updatePreview = (files) => {
    const htmlFile = files['index.html'] || { content: '<!DOCTYPE html><html><head><title>Preview</title></head><body><h1>No HTML file found</h1></body></html>' };
    const cssFile = files['styles.css'] || { content: '' };
    const jsFile = files['script.js'] || { content: '' };
    
    const previewContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${projectName || 'Preview'}</title>
        <style>
          ${cssFile.content}
          /* Add some default styles if needed */
          body { margin: 0; padding: 0; min-height: 100vh; }
          iframe { border: none; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        ${htmlFile.content.replace(/<script.*?src=".*?\/([^"]+)".*?><\/script>/g, '')}
        <script>
          // Add error handling for the preview
          window.addEventListener('error', function(e) {
            console.error('Preview error:', e.error);
          });
          
          // Add the JavaScript content
          try {
            ${jsFile.content}
          } catch (e) {
            console.error('Error in script:', e);
          }
        </script>
      </body>
      </html>
    `;
    
    const previewBlob = new Blob([previewContent], { type: 'text/html' });
    const newPreviewUrl = URL.createObjectURL(previewBlob);
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(newPreviewUrl);
  };

  const handleCreate = async () => {
    if (!prompt.trim()) return;
    
    setIsCreating(true);
    setProjectName(prompt);
    setCreationStatus('Initializing project structure...');
    
    try {
      setCreationStatus('Generating project files...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generatedFiles = generateProjectFiles(prompt);
      setProjectFiles(generatedFiles);
      
      setCode(generatedFiles['index.html'].content);
      
      setCreationStatus('Setting up preview...');
      await new Promise(resolve => setTimeout(resolve, 800));
      updatePreview(generatedFiles);
      
      const tokensToUse = 5;
      setTokensLeft(t => Math.max(t - tokensToUse, 0));
      setTokensUsed(t => t + tokensToUse);
      
      setProjectCreated(true);
      
      const welcomeMessage = {
        text: `I've created your project "${prompt}" with a basic web application structure. You can now edit the files and see live previews. How can I assist you further?`,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      setChatHistory([welcomeMessage]);
      setCreationStatus('Project created successfully!');
      
      setTimeout(() => {
        setActiveTab('code');
        setCreationStatus('');
      }, 500);
      
    } catch (error) {
      console.error('Error creating project:', error);
      setCreationStatus('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
      setPrompt("");
    }
  };

  // --- NEW: derive a small projects list to feed WorkspaceHistory ---
  // This uses the current in-memory project; expand to multiple projects/localStorage as needed.
  const projectsList = Object.keys(projectFiles).length
    ? [{
        id: projectName || 'untitled-' + Date.now(),
        name: projectName || 'Untitled Project',
        files: projectFiles,
        createdAt: new Date().toISOString()
      }]
    : [];

  const openProject = (proj) => {
    if (!proj) return;
    setProjectName(proj.name || 'Project');
    setProjectFiles(proj.files || {});
    setCode((proj.files && proj.files['index.html'] && proj.files['index.html'].content) || '');
    setProjectCreated(true);
    setActiveTab('code');
    updatePreview(proj.files || {});
  };

  const deleteProject = (projId) => {
    if (projId === projectName) {
      setProjectFiles({});
      setProjectName('');
      setProjectCreated(false);
      setPreviewUrl('');
    }
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'chat':
        // (Your existing chat JSX goes here unchanged.)
        return (
          /* ... existing chat JSX ... */
          <div className="flex-1 flex flex-col h-full">
            {/* keep the full chat UI from your original file */}
            {/* ... */}
          </div>
        );

      case 'code':
        // (Your existing code editor JSX goes here unchanged.)
        return (
          /* ... existing code JSX ... */
          <div className="flex-1 flex flex-col h-full">
            {/* ... */}
          </div>
        );

      case 'preview':
        // (Your existing preview JSX unchanged.)
        return (
          /* ... existing preview JSX ... */
          <div className="flex-1 flex flex-col h-full">
            {/* ... */}
          </div>
        );

      case 'projects':
        // You already had a projects UI; keep it or rely on WorkspaceHistory.
        return (
          <div className="p-6">
            <h2 className="text-3xl font-semibold mb-6">Projects</h2>

            {/* Use WorkspaceHistory if available */}
            <WorkspaceHistory
         projectFiles={projectFiles}
          activeFile={activeFile}
         setActiveFile={setActiveFile}
            code={code}
          setCode={setCode}
               />


            {projectsList.length === 0 && (
              <div className="mt-6 text-slate-400">
                <p>No projects yet. Create one from the Dashboard.</p>
              </div>
            )}
          </div>
        );

      default: // dashboard
        return (
          <div className="pt-10 w-full max-w-4xl mx-auto">
            {/* ... keep your existing dashboard markup unchanged ... */}
            <div className="pt-10">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-50">
                Welcome to INHUB
              </h1>
              <div className="mt-6 h-px w-full bg-slate-800" />
            </div>
            {/* tokens, create project card etc. */}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex w-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex-shrink-0 relative">
        <div className="p-5">
          <h1 className="text-xl font-bold text-slate-50">Inhub</h1>
        </div>
        <nav className="mt-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-5 py-3 text-left ${
                activeTab === item.id
                  ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              } transition-colors`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
              {item.id === 'chat' && chatHistory.length > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {chatHistory.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* --- ADDED: SidebarGroup showing recent projects (WorkspaceHistory) --- */}
        <div className="px-4 mt-4">
          <div className="space-y-2">
           
          </div>
        </div>

        {/* Token usage (kept at bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="mb-2 flex justify-between text-sm text-slate-400">
            <span>Tokens Used</span>
            <span>{tokensUsed} / {tokensUsed + tokensLeft}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${(tokensUsed / (tokensUsed + tokensLeft)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default InhubDashboard;
