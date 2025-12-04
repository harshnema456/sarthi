// src/components/InhubDashboard.jsx
'use client';

import React, { useState, useEffect } from "react";
import { FiCode, FiEye, FiMessageSquare, FiUser, FiLogOut, FiLoader, FiCheckCircle, FiRefreshCw, FiSave } from "react-icons/fi";
// ... rest of your component code

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
        content: `// ${projectName} - JavaScript File\n// This file was automatically generated\n\n// DOM Elements\nconst outputElement = document.getElementById('output');\n\n// Sample functionality\nfunction init() {\n  outputElement.textContent = 'JavaScript is working! \u2705';\n  console.log('${projectName} initialized!');\n}\n\n// Initialize the application\ndocument.addEventListener('DOMContentLoaded', init);`,
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
    
    // Create a complete HTML document with all resources
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
    
    // Create a blob URL for the preview
    const previewBlob = new Blob([previewContent], { type: 'text/html' });
    const newPreviewUrl = URL.createObjectURL(previewBlob);
    
    // Revoke the old URL to prevent memory leaks
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
      // Simulate project generation steps
      setCreationStatus('Generating project files...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate project files
      const generatedFiles = generateProjectFiles(prompt);
      setProjectFiles(generatedFiles);
      
      // Set initial code to the main HTML file
      setCode(generatedFiles['index.html'].content);
      
      // Update preview
      setCreationStatus('Setting up preview...');
      await new Promise(resolve => setTimeout(resolve, 800));
      updatePreview(generatedFiles);
      
      // Update tokens
      const tokensToUse = 5;
      setTokensLeft(t => Math.max(t - tokensToUse, 0));
      setTokensUsed(t => t + tokensToUse);
      
      // Set project as created
      setProjectCreated(true);
      
      // Add welcome message to chat
      const welcomeMessage = {
        text: `I've created your project "${prompt}" with a basic web application structure. You can now edit the files and see live previews. How can I assist you further?`,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      setChatHistory([welcomeMessage]);
      setCreationStatus('Project created successfully!');
      
      // Navigate to the code view after a short delay
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

  const renderMainContent = () => {
    switch (activeTab) {
      case 'chat':
        const handleSendMessage = async () => {
          if (!messageInput.trim() || isTyping) return;
          
          // Create user message
          const userMessage = {
            text: messageInput.trim(),
            sender: 'user',
            timestamp: new Date().toISOString()
          };
          
          // Add user message to chat
          const updatedChat = [...chatHistory, userMessage];
          setChatHistory(updatedChat);
          setMessageInput('');
          setIsTyping(true);
          
          try {
            // Call the Gemini API
            const response = await fetch('/api/gemini', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                message: messageInput.trim() 
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to get response from AI');
            }

            const data = await response.json();
            
            // Add AI response to chat
            setChatHistory(prev => [
              ...prev,
              {
                text: data.response,
                sender: 'assistant',
                timestamp: new Date().toISOString()
              }
            ]);
            
          } catch (error) {
            console.error('Error:', error);
            // Fallback response if API fails
            setChatHistory(prev => [
              ...prev,
              {
                text: "I'm sorry, I'm having trouble connecting to the AI service. Please try again later.",
                sender: 'assistant',
                timestamp: new Date().toISOString()
              }
            ]);
          } finally {
            setIsTyping(false);
          }
        };
        
        return (
          <div className="flex-1 flex flex-col h-full">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-2xl font-semibold">
                Chat Assistant <span className="text-sm font-normal text-slate-400">- Ask me anything</span>
              </h2>
            </div>
            
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.length > 0 ? (
                chatHistory.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-3/4 rounded-2xl px-4 py-2 ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-slate-800/50 rounded-full p-4 mb-4">
                    <FiMessageSquare className="text-4xl text-blue-400" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-200 mb-2">How can I help you today?</h3>
                  <p className="text-slate-400 max-w-md">
                    Ask me about your project, code, or anything else. I'm here to help you build amazing things!
                  </p>
                </div>
              )}
              
              {isTyping && (
                <div className="flex items-center space-x-2 p-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your message..."
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isTyping}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                      !messageInput.trim() || isTyping
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-blue-400 hover:bg-slate-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Ask about coding, project setup, or anything else
              </p>
            </div>
          </div>
        );
      
      case 'code':
        if (!projectCreated) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FiCode className="text-5xl mb-4 opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">No Active Project</h2>
              <p className="mb-6">Create a new project or select an existing one to start coding.</p>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition"
              >
                Create New Project
              </button>
            </div>
          );
        }
        
        return (
          <div className="flex-1 flex flex-col h-full">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-2xl font-semibold">
                {projectName} <span className="text-sm font-normal text-slate-400">- Code Editor</span>
              </h2>
            </div>
            <div className="flex flex-col h-full">
              {/* File Tabs */}
              <div className="flex bg-slate-800 px-2 pt-2 overflow-x-auto">
                {Object.entries(projectFiles).map(([filename, file]) => (
                  <button
                    key={filename}
                    onClick={() => {
                      setActiveFile(filename);
                      setCode(file.content);
                    }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeFile === filename
                        ? 'border-blue-500 text-blue-400 bg-slate-900/50'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                    } transition-colors`}
                  >
                    {filename}
                  </button>
                ))}
              </div>
              
              {/* Code Editor */}
              <div className="flex-1 flex flex-col bg-slate-900 rounded-b-lg overflow-hidden">
                <div className="flex justify-between items-center bg-slate-800 px-4 py-2">
                  <div className="text-sm text-slate-300">
                    {activeFile}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        // Update the file content in projectFiles
                        const updatedFiles = {
                          ...projectFiles,
                          [activeFile]: {
                            ...projectFiles[activeFile],
                            content: code
                          }
                        };
                        setProjectFiles(updatedFiles);
                        updatePreview(updatedFiles);
                      }}
                      className="flex items-center px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition"
                    >
                      <FiSave className="mr-1.5 h-3.5 w-3.5" />
                      Save
                    </button>
                    <button 
                      onClick={() => updatePreview(projectFiles)}
                      className="flex items-center px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                    >
                      <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Run
                    </button>
                  </div>
                </div>
                <textarea
                  className="w-full flex-1 bg-slate-900 text-slate-100 p-4 font-mono text-sm focus:outline-none resize-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  style={{ tabSize: 2 }}
                />
              </div>
              
              {/* Console Output */}
              <div className="mt-2 bg-slate-900 rounded-lg overflow-hidden">
                <div className="bg-slate-800 px-4 py-2 text-sm text-slate-300">
                  Console
                </div>
                <div className="p-3 font-mono text-xs text-slate-300 bg-slate-950 h-24 overflow-y-auto">
                  {projectCreated && (
                    <div className="text-green-400">
                      $ Project "{projectName}" is running on preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'preview':
        if (!projectCreated) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FiEye className="text-5xl mb-4 opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">No Project Available</h2>
              <p className="mb-6">Create a new project to see the preview.</p>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition"
              >
                Create New Project
              </button>
            </div>
          );
        }
        
        return (
          <div className="flex-1 flex flex-col h-full">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                {projectName} <span className="text-sm font-normal text-slate-400">- Preview</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => updatePreview(projectFiles)}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                >
                  <FiRefreshCw className="mr-1.5 h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg m-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 relative">
                {previewUrl ? (
                  <iframe 
                    key={previewUrl} // Force re-render when URL changes
                    src={previewUrl} 
                    className="w-full h-full border-0"
                    title="Project Preview"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                    onLoad={(e) => {
                      // Add any post-load logic here
                      console.log('Preview loaded');
                    }}
                    onError={(e) => {
                      console.error('Error loading preview:', e);
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6">
                    <FiLoader className="animate-spin text-4xl mb-4" />
                    <p>Loading preview...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'projects':
        return (
          <div className="p-6">
            <h2 className="text-3xl font-semibold mb-6">Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Project cards would go here */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">Project 1</h3>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Active</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">Last updated 2 days ago</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">HTML, CSS, JS</span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Open</button>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">Project 2</h3>
                  <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-1 rounded">Inactive</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">Last updated 1 week ago</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">React, Next.js</span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Open</button>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">Project 3</h3>
                  <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-1 rounded">Inactive</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">Last updated 2 weeks ago</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Node.js, Express</span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Open</button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default: // dashboard
        return (
          <div className="pt-10 w-full max-w-4xl mx-auto">
            {/* Heading + line */}
            <div className="pt-10">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-50">
                Welcome to INHUB
              </h1>
              <div className="mt-6 h-px w-full bg-slate-800" />
            </div>

            {/* Token cards */}
            <div className="mt-10 grid gap-6 sm:grid-cols-2 max-w-2xl">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 shadow-md">
                <p className="text-sm text-slate-400 mb-2">Tokens Left</p>
                <p className="text-4xl font-semibold text-slate-50">{tokensLeft}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 shadow-md">
                <p className="text-sm text-slate-400 mb-2">Tokens Used</p>
                <p className="text-4xl font-semibold text-slate-50">{tokensUsed}</p>
              </div>
            </div>

            {/* Create new project card (slightly lower) */}
            <div className="mt-14 max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/60 px-7 py-7 shadow-lg">
              <h2 className="text-2xl font-semibold text-slate-50 mb-5">
                Create new project
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="projectPrompt" className="block text-sm font-medium text-slate-300">
                    Project Description
                  </label>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    <input
                      id="projectPrompt"
                      className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      placeholder="Describe your project..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isCreating}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {isCreating ? 'Creating your project...' : 'What would you like to build?'}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreate}
                    disabled={isCreating || !prompt.trim()}
                    className={`rounded-2xl px-8 py-2.5 text-base font-medium text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 transition ${
                      isCreating
                        ? 'bg-indigo-700 cursor-not-allowed'
                        : !prompt.trim()
                        ? 'bg-indigo-700/50 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-400'
                    }`}
                  >
                    {isCreating ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : 'Create Project'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex w-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex-shrink-0">
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
        
        {/* Token usage */}
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