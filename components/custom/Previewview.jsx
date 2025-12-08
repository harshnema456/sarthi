"use client";
import React from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview
} from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";

export default function PreviewView({ files }) {
  return (
    <SandpackProvider
      files={files}
      template="react"
      theme="dark"
      customSetup={{
        dependencies: {
          ...Lookup.DEPENDANCY,
        },
      }}
      options={{
        externalResources: ["https://cdn.tailwindcss.com"],
      }}
    >
      <SandpackLayout style={{ height: "80vh" }}>
        <SandpackPreview
          style={{
            height: "80vh",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        />
      </SandpackLayout>
    </SandpackProvider>
  );
}
