"use client";

import React, { useContext, useEffect, useRef } from "react";
import {
  SandpackPreview,
  useSandpack,
  // if you use TS, you can also import:
  // SandpackPreviewRef,
} from "@codesandbox/sandpack-react";
import { ActionContext } from "@/context/ActionContext";

function SandpackPreviewClient() {
  // If you use TypeScript, do:
  // const previewRef = useRef<SandpackPreviewRef | null>(null);
  const previewRef = useRef(null);
  const { sandpack } = useSandpack();
  const { action } = useContext(ActionContext);

  useEffect(() => {
    // no preview DOM or no action → nothing to do
    if (!previewRef.current || !action) return;

    // only react to actions that need Sandpack URL
    if (!["deploy", "export"].includes(action.actionType)) return;

    try {
      /**
       * According to Sandpack docs, getClient() is synchronous but
       * may return undefined until the client is ready.
       */
      const client = previewRef.current.getClient
        ? previewRef.current.getClient()
        : null;

      if (!client) {
        console.log("Sandpack client not ready yet");
        return;
      }

      // 🔽 If your client exposes getCodeSandboxURL (custom helper)
      // keep this logic; otherwise replace with your own.
      if (typeof client.getCodeSandboxURL !== "function") {
        console.warn("getCodeSandboxURL is not available on client");
        return;
      }

      (async () => {
        const result = await client.getCodeSandboxURL();
        console.log("Sandpack URL result:", result);
        if (!result) return;

        if (action.actionType === "deploy" && result.sandboxId) {
          window.open(`https://${result.sandboxId}.csb.app/`, "_blank");
        } else if (action.actionType === "export" && result.editorUrl) {
          window.open(result.editorUrl, "_blank");
        }
      })();
    } catch (error) {
      console.error("Error in SandpackPreviewClient effect:", error);
    }
  }, [
    sandpack, // ✅ use full sandpack object per docs so client is ready
    action,
  ]);

  return (
    <SandpackPreview
      ref={previewRef}
      showNavigator
      showOpenInCodeSandbox={false} // optional, since you handle it yourself
      showOpenNewtab={false}        // optional
      style={{ height: "80vh" }}
    />
  );
}

export default SandpackPreviewClient;
