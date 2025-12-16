"use client";

import React, { useEffect, useState } from "react";

import {

  SandpackProvider,

  SandpackLayout,

  SandpackPreview,

} from "@codesandbox/sandpack-react";

import Lookup from "@/data/Lookup";
 
export default function PreviewView({ files = {} }) {

  // 1. Process files: Ensure keys start with '/' and handle missing index.js

  const formattedFiles = React.useMemo(() => {

    const processed = {};

    // Keys ko normalize karein (add leading slash if missing)

    Object.keys(files).forEach((fileName) => {

      const key = fileName.startsWith("/") ? fileName : `/${fileName}`;

      processed[key] = files[fileName];

    });
 
   

     if (!processed["/src/index.js"] && !processed["/index.js"]) {

      processed["/src/index.js"] = `

import React, { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import "./styles.css";
 
import App from "./App";
 
const root = createRoot(document.getElementById("root"));

root.render(
<StrictMode>
<App />
</StrictMode>

);`;

    }
 
    return processed;

  }, [files]);
 
  // Validation logic ko thoda lenient banayein

  const hasEntry = formattedFiles["/src/App.jsx"] || formattedFiles["/src/App.js"] || formattedFiles["/App.js"];
 
  if (!hasEntry) {

    return (
<div className="flex items-center justify-center h-[80vh] text-gray-400">

        Waiting for app entry files...
</div>

    );

  }
 
  return (
<SandpackProvider

      files={formattedFiles} // Use the formatted files

      template="react"

      theme="dark"

      options={{

        // Ye important hai: Active file set karein taki user ko wahi dikhe

        activeFile: "/src/App.jsx", 

        externalResources: ["https://cdn.tailwindcss.com"], // Agar tailwind use ho raha hai

      }}

      customSetup={{

        dependencies: {

          react: "^18.2.0",

          "react-dom": "^18.2.0",

          "lucide-react": "^0.263.1", // Common icons dependency

          ...Lookup.DEPENDANCY,

        },

      }}
>
<SandpackLayout style={{ height: "80vh" }}>
<SandpackPreview

          style={{

            height: "100%",

            width: "100%",

            border: "1px solid rgba(255,255,255,0.1)",

            borderRadius: "8px",

          }}

          showOpenInCodeSandbox={false} // Clean look

        />
</SandpackLayout>
</SandpackProvider>

  );

}
 