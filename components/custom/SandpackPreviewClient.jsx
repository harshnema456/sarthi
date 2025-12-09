// src/components/SandpackPreviewClient.jsx
"use client";

import React, { useContext, useEffect, useRef } from "react";
import { SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import { ActionContext } from "@/context/ActionContext";

function SandpackPreviewClient() {
  const previewRef = useRef(null);
  const { sandpack } = useSandpack();
  const { action } = useContext(ActionContext);

  useEffect(() => {
    if (!action || !action.actionType) return;
    if (!["deploy", "export"].includes(action.actionType)) return;

    let intervalId = null;
    let cancelled = false;

    const processClient = async (client) => {
      if (!client || cancelled) return;
      if (typeof client.getCodeSandboxURL !== "function") {
        console.warn("getCodeSandboxURL not available");
        return;
      }
      try {
        const result = await client.getCodeSandboxURL();
        if (!result) return;
        if (action.actionType === "deploy" && result.sandboxId) {
          const url = `https://${result.sandboxId}.csb.app/`;
          if (typeof window !== "undefined") window.open(url, "_blank");
        } else if (action.actionType === "export" && result.editorUrl) {
          if (typeof window !== "undefined") window.open(result.editorUrl, "_blank");
        }
      } catch (err) {
        console.error("Error obtaining Sandpack URLs:", err);
      }
    };

    const handle = async () => {
      const client = previewRef.current && typeof previewRef.current.getClient === "function" ? previewRef.current.getClient() : null;
      if (!client) {
        let attempts = 0;
        intervalId = setInterval(() => {
          if (cancelled) return;
          attempts += 1;
          const maybeClient = previewRef.current && typeof previewRef.current.getClient === "function" ? previewRef.current.getClient() : null;
          if (maybeClient) {
            clearInterval(intervalId);
            processClient(maybeClient);
          } else if (attempts > 20) {
            clearInterval(intervalId);
            console.warn("Sandpack client did not become ready");
          }
        }, 100);
        return;
      }
      await processClient(client);
    };

    handle();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [sandpack, action]);

  return <SandpackPreview ref={previewRef} showNavigator showOpenInCodeSandbox={false} showOpenNewtab={false} style={{ height: "80vh" }} />;
}

export default SandpackPreviewClient;
