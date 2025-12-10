// configs/AiModel.jsx
"use client";

import { GoogleGenerativeAI } from "@google/generative-ai";

/* ============================================================
   1. MODEL INITIALIZATION
   ============================================================ */

export const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY
);

// Which model to use
export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

/* ============================================================
   2. CODE GENERATION CONFIG
   ============================================================ */

export const CodeGenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 8000,
};

/* ============================================================
   3. MAIN SYSTEM PROMPT (MODEL START MESSAGE)
   ============================================================ */

const SYSTEM_PROMPT = `
Generate a programming code structure for a React project using Vite.  
Create multiple components, organized in folders, using the .js extension.

Use Tailwind CSS for styling with no third-party libraries *except*:
- lucide-react icons (when needed)
- date-fns
- react-chartjs-2
- firebase
- @google/generative-ai

When using lucide-react:
Example:
import { Heart } from "lucide-react";
<Heart className="" />.

Output MUST be in JSON format:

{
  "projectTitle": "",
  "explanation": "",
  "files": {
    "/App.js": { "code": "" },
    ...
  },
  "generatedFiles": []
}

Ensure:
- "files" contains all created files.
- "generatedFiles" lists all file paths.
- Each file has a "code" string.
- Explanation is one paragraph.

Use placeholder images from:
https://archive.org/download/placeholder-image/placeholder-image.jpg

Use emojis where suitable.

Make UI designs beautiful, production-ready, not basic.

Use valid Unsplash URLs for image links.

DO NOT import any packages besides the ones explicitly allowed above.
`;

/* ============================================================
   4. CHAT SESSION INITIALIZATION
   ============================================================ */

export const GenAiCode = model.startChat({
  generationConfig: CodeGenerationConfig,

  // system + first user instruction
  history: [
    {
      role: "user",
      parts: [
        { text: SYSTEM_PROMPT }
      ],
    },
  ],
});

/* ============================================================
   5. USAGE EXAMPLE (for your route API)
   ============================================================ */
// In /app/api/ai-chat/route.jsx:
//
// const response = await GenAiCode.sendMessage([{ text: userPrompt }]);
// const result = await response.response.text();
// return NextResponse.json(JSON.parse(result));
