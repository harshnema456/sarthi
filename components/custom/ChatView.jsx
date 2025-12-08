// src/components/custom/ChatView.jsx
"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessagesContext } from "@/context/MessagesContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import Prompt from "@/data/Prompt";
import Lookup from "@/data/Lookup";
import { ArrowRight, Loader2Icon, Copy, Trash2, Link, Code } from "lucide-react";

/* simple token counter used by your code */
export const countToken = (inputText) => {
  if (!inputText) return 0;
  return String(inputText).trim().split(/\s+/).filter(Boolean).length;
};

export default function ChatView(props) {
  const { openCode } = props || {};
  const { id } = useParams();
  const convex = useConvex();

  const { messages, setMessages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const UpdateMessages = useMutation(api.workspace.UpdateMessages);
  const UpdateToken = useMutation(api.users.UpdateToken);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // load workspace messages when id changes
  useEffect(() => {
    if (!id) return;
    fetchWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchWorkspace = async () => {
    try {
      const res = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: id,
      });
      const msgs = res && res.messages ? res.messages : [];
      setMessages(msgs);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 200);
    } catch (err) {
      console.error("fetchWorkspace error", err);
      toast.error("Failed to load workspace");
    }
  };

  // auto-scroll when messages or loading changes
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // when the last message is from 'user', call AI
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === "user") {
      callAi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const callAi = async () => {
    if (!messages || messages.length === 0) return;
    setLoading(true);

    const PROMPT = JSON.stringify(messages) + " " + Prompt.CHAT_PROMPT;
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: PROMPT }),
      });

      if (!response.ok) {
        const t = await response.text().catch(() => "");
        console.error("ai-chat failed", response.status, t);
        toast.error("AI response failed. Try again.");
        return;
      }

      const data = await response.json().catch((e) => {
        console.error("Invalid AI JSON", e);
        throw new Error("AI JSON parse failed");
      });

      if (!data || !data.result) {
        console.error("AI returned no result", data);
        toast.error("AI returned empty response");
        return;
      }

      const aiMsg = {
        role: "ai",
        content: data.result,
        timestamp: new Date().toISOString(),
      };

      const safeMessages = Array.isArray(messages) ? messages : [];
      const newMessages = [...safeMessages, aiMsg];

      // update local
      setMessages(newMessages);

      // persist
      await UpdateMessages({
        messages: newMessages,
        workspaceId: id,
      });

      // token accounting
      const currentToken = Number(
        userDetail && typeof userDetail.token === "number"
          ? userDetail.token
          : 0
      );
      const usedTokens = Number(countToken(JSON.stringify(aiMsg)));
      const newToken = currentToken - usedTokens;

      setUserDetail((prev) => ({
        ...(prev || {}),
        token: newToken,
      }));

      if (userDetail && userDetail._id) {
        await UpdateToken({ token: newToken, userId: userDetail._id });
      }

      // ---- trigger CODE GENERATION from CHAT ----
      try {
        const codeRes = await fetch("/api/gen-ai-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: JSON.stringify(newMessages) }),
        });

        if (codeRes.ok) {
          const codeData = await codeRes.json().catch(() => null);
          if (codeData && codeData.files) {
            // Broadcast to Dashboard so it updates Code + Preview
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("AI_FILES_READY", {
                  detail: {
                    files: codeData.files,
                    source: "chat",
                    title: "Chat generated project",
                  },
                })
              );
            }
          }
        }
      } catch (err) {
        console.error("Code generation from chat failed", err);
      }
      // -----------------------------------------------
    } catch (err) {
      console.error("callAi error", err);
      toast.error("Error generating AI response");
    } finally {
      setLoading(false);
    }
  };

  // persist & queue user message
  const onGenerate = (text) => {
    const t = String(text || "").trim();
    if (!t) return;

    const tokenLeft =
      userDetail && typeof userDetail.token === "number"
        ? userDetail.token
        : 0;

    if (tokenLeft < 10) {
      toast.error("You don't have enough token to generate content");
      return;
    }

    const userMsg = {
      role: "user",
      content: t,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [...safePrev, userMsg];
    });

    const safeMessages = Array.isArray(messages) ? messages : [];
    UpdateMessages({
      messages: [...safeMessages, userMsg],
      workspaceId: id,
    }).catch((e) => {
      console.error("persist user msg failed", e);
    });

    setUserInput("");
    setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
  };

  // UI actions
  const clearConversation = async () => {
    setMessages([]);
    try {
      await UpdateMessages({ messages: [], workspaceId: id });
      toast.success("Conversation cleared");
    } catch (e) {
      console.error("clearConversation", e);
      toast.error("Failed to clear conversation");
    }
  };

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!loading) onGenerate(userInput);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // message renderer (left AI / right User)
  const renderMessage = (m, i) => {
    const isUser = m.role === "user";
    const isAi =
      m.role === "ai" || m.role === "assistant" || m.role === "system";

    const avatarSrc =
      userDetail && userDetail.picture
        ? userDetail.picture
        : "/avatar-placeholder.png";

    return (
      <div
        key={i}
        className={`w-full flex mb-5 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {/* left avatar for AI */}
        {!isUser && (
          <div className="mr-4 shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-800">
              <Image
                src={avatarSrc}
                width={40}
                height={40}
                alt="ai-avatar"
              />
            </div>
          </div>
        )}

        <div className="max-w-[72%]">
          <div
            className={`rounded-xl p-4 relative ${
              isUser
                ? "bg-[#0f1318] text-slate-100 border border-slate-800"
                : "bg-[#3c6a8b] text-white"
            }`}
            style={
              isUser
                ? {}
                : { boxShadow: "0 6px 18px rgba(34,67,95,0.45)" }
            }
          >
            <div className="flex items-start justify-between">
              <div className="text-xs text-slate-200">
                <span className="font-medium">{isUser ? "You" : "AI"}</span>
                <span className="ml-3 text-[11px] text-slate-200/70">
                  {formatTime(m.timestamp)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copy(m.content)}
                  title="Copy"
                  className="p-1 rounded hover:bg-white/5"
                >
                  <Copy size={14} />
                </button>
                {openCode && isAi && (
                  <button
                    onClick={() => openCode()}
                    title="Open Code"
                    className="p-1 rounded hover:bg-white/5"
                  >
                    <Code size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 prose prose-invert max-w-none">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* right avatar for user */}
        {isUser && (
          <div className="ml-4 shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-800">
              <Image
                src={avatarSrc}
                width={40}
                height={40}
                alt="you"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const messagesCount =
    messages && Array.isArray(messages) ? messages.length : 0;
  const tokensLeft =
    userDetail && typeof userDetail.token === "number"
      ? userDetail.token
      : 0;

  return (
    <div className="h-[83vh] flex flex-col">
      {/* header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#071127]">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Chat</h3>

          <div className="inline-flex items-center gap-2 bg-[#0b1624] px-3 py-1 rounded border border-slate-800 text-sm text-slate-300">
            <span className="text-xs">🕘</span>
            <span>{messagesCount} msgs</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#0b1624] px-3 py-1 rounded border border-slate-800 text-sm text-slate-300">
            <span className="text-xs">💎</span>
            <span>
              Tokens:{" "}
              <span className="font-medium ml-1">
                {tokensLeft}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearConversation}
            className="p-2 rounded bg-[#0f1724] border border-slate-800 hover:bg-[#111827]"
            title="Clear"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.document) {
                const el = window.document.getElementById("sidebar-toggle");
                if (el) el.click();
              }
            }}
            className="p-2 rounded bg-[#0f1724] border border-slate-800 hover:bg-[#111827]"
            title="Toggle sidebar"
          >
            <Link size={16} />
          </button>
        </div>
      </div>

      {/* messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6"
        style={{
          background: "#0b0b0c",
          borderTop: "8px solid rgba(30,40,60,0.6)",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="rounded-xl bg-[#070707] p-6"
            style={{
              minHeight: "48vh",
              border: "1px solid rgba(255,255,255,0.02)",
            }}
          >
            {(!messages || messages.length === 0) ? (
              <div className="text-slate-400 italic">
                No messages yet — start the conversation
              </div>
            ) : (
              messages.map((m, i) => renderMessage(m, i))
            )}

            {loading && (
              <div className="flex items-center gap-3 p-3 rounded-lg mt-3 bg-[#081420]">
                <Loader2Icon className="animate-spin" />
                <div className="text-slate-200">Generating response…</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* composer */}
      <div className="px-6 pb-6 pt-2">
        <div className="mx-auto max-w-6xl">
          <div
            className="rounded-xl bg-[#0f1318] p-5 flex items-start gap-4"
            style={{ border: "1px solid rgba(255,255,255,0.02)" }}
          >
            <div>
              {userDetail ? (
                <button
                  className="w-12 h-12 rounded-full overflow-hidden border border-slate-800"
                  onClick={() => {
                    /* could toggle sidebar/profile */
                  }}
                >
                  <Image
                    src={
                      userDetail && userDetail.picture
                        ? userDetail.picture
                        : "/avatar-placeholder.png"
                    }
                    width={48}
                    height={48}
                    alt="profile"
                  />
                </button>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800" />
              )}
            </div>

            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  Lookup.INPUT_PLACEHOLDER || "What do you want to build?"
                }
                className="w-full bg-transparent resize-none outline-none text-slate-100 min-h-[84px] max-h-[180px] p-2"
                disabled={loading}
              />

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span>{countToken(userInput)} words</span>
                  <span className="mx-3">•</span>
                  <span>{tokensLeft} tokens left</span>
                </div>

                <div className="flex items-center gap-3">
                  {openCode && (
                    <button
                      onClick={() => openCode()}
                      className="px-3 py-2 rounded bg-[#0d1a24] border border-slate-800 hover:bg-[#0f2633]"
                      title="Open Code"
                    >
                      <Code size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => onGenerate(userInput)}
                    disabled={loading || !userInput.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#2b66d6] hover:bg-[#2a5fcc] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Tip: press <span className="font-medium">Ctrl/Cmd + Enter</span>{" "}
                to send. Press Enter for newline.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
