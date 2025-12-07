import { NextResponse } from "next/server";
import { GenAiCode } from "@/configs/AiModel";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

    const result = await GenAiCode.sendMessage(prompt);
    const response = result?.response;

    let text = "";
    if (response?.text) text = await response.text();
    else if (typeof response === "string") text = response;

    if (!text) throw new Error("Empty AI response");

    // Remove markdown and extract JSON
    let cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in AI response");

    const parsed = JSON.parse(match[0]);

    // VALIDATION
    if (!parsed.files || typeof parsed.files !== "object") {
      throw new Error("AI JSON missing files");
    }

    return NextResponse.json({ files: parsed.files }, { status: 200 });

  } catch (error) {
    console.error("GEN AI ERROR:", error.message);

    // FALLBACK so frontend NEVER breaks
    const fallback = {
      "index.html": { content: `<h1>Project failed to generate 😢</h1>`, language: "html" },
      "styles.css": { content: `body { font-family: sans-serif; }`, language: "css" },
      "script.js": { content: `console.log("AI generation failed");`, language: "javascript" },
      "README.md": { content: `# AI Generation Failed\nThe model could not generate files.`, language: "markdown" }
    };

    return NextResponse.json({ files: fallback }, { status: 200 });
  }
}
