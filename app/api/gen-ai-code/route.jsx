import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * HARD SYSTEM PROMPT
 * Forces the model to return stable JSON.
 */
const SYSTEM_PROMPT = `
You are a codebase generator for Next.js 14+ (App Router).

You MUST return ONLY valid JSON in this EXACT structure:

{
  "files": {
    "/path/to/file1.jsx": { "code": "..." },
    "/path/to/file2.js": { "code": "..." },
    "/components/XYZ.jsx": { "code": "..." }
  }
}

RULES:
- Output JSON ONLY. No markdown, no backticks, no comments.
- All keys must be strings.
- All code must be valid JavaScript, TypeScript, or JSX.
- Escape all quotes properly.
- Never include \`\`\`, markdown, or explanatory text.
- Ensure final output is valid JSON that can be parsed without errors.
`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    // ----------- CALL OPENAI -----------
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    let raw = completion.choices?.[0]?.message?.content || "";

    // ---------- CLEANUP: REMOVE ANY BAD FORMATTING ----------
    raw = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/[\u0000-\u001F]+/g, "") // remove control chars
      .trim();

    // ---------- ATTEMPT TO PARSE JSON ----------
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("JSON parse failed. Attempting repair…");
      // Attempt rescue via JSON5-like cleanup
      raw = raw
        // remove trailing commas
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]");

      parsed = JSON.parse(raw);
    }

    // Validate structure
    if (!parsed || typeof parsed !== "object" || !parsed.files) {
      throw new Error("AI output missing 'files' object");
    }

    return NextResponse.json({ files: parsed.files });
  } catch (err) {
    console.error("gen-ai-code error:", err);

    // ----------- SAFE FALLBACK -----------
    return NextResponse.json({
      files: {
        "/ERROR.md": {
          code:
            `# Code Generation Failed\n\n` +
            `Error: ${err?.message}\n\n` +
            `Please adjust your prompt and try again.`,
        },
      },
    });
  }
}
