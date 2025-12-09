import { NextResponse } from "next/server";
import { GenAiCode } from "@/configs/AiModel";

/**
 * Robust JSON extraction + repair attempts for AI outputs.
 * Returns NextResponse.json({ files }) on success or a fallback files object on failure.
 */

function snippetAround(text, pos, len = 140) {
  const start = Math.max(0, (pos || 0) - Math.floor(len / 2));
  return text.slice(start, Math.min(text.length, start + len));
}

/**
 * Attempt to extract a JSON substring from the AI text.
 * Prefer ```json``` fenced content, then the first {...} block.
 */
function extractJsonLike(text) {
  if (!text) return null;

  // 1) Try to extract explicit ```json``` fenced block(s)
  const fenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }

  // 2) Try to extract first {...} block (greedy last brace)
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

/**
 * Heuristic repair #1:
 * - Remove common markdown/code fences and stray leading/trailing text
 * - Remove stray backticks/backtick blocks left over
 */
function repairStripMarkdown(text) {
  return text
    .replace(/<\?xml[\s\S]*?\?>/gi, "") // strip xml prolog if any
    .replace(/```[\s\S]*?```/g, "") // remove any fenced blocks
    .replace(/```/g, "") // leftover
    .replace(/<script[\s\S]*?<\/script>/gi, (m) => {
      // keep script content but escape closing tags so it won't break JSON parsing in some cases
      return m.replace(/<\/script>/gi, "<\\/script>");
    })
    .trim();
}

/**
 * Heuristic repair #2:
 * Try to escape raw newlines inside double-quoted strings and escape unescaped double quotes inside them.
 *
 * This is imperfect (regex-based), but helps in the common cases where AI inserts multi-line HTML
 * or unescaped quotes inside file content strings.
 */
function escapeStringsAndNewlines(jsonLike) {
  // Find quoted strings (handles escaped quotes inside already-escaped strings)
  // This pattern matches " ... " including escaped \" inside.
  return jsonLike.replace(/"((?:\\.|[^"\\])*)"/gs, (fullMatch, inner) => {
    // inner contains string content with escapes preserved. We will:
    // 1) Replace literal newlines with \n
    const withEscapedNewlines = inner.replace(/\r\n|\r|\n/g, "\\n");
    // 2) Escape any unescaped double quotes (a " inside inner that isn't already \")
    //    We can safely replace " with \" because the regex matched content that doesn't include unescaped " (otherwise regex would have ended),
    //    but some LLM outputs may include stray unescaped quotes that broke parsing previously — for safety we escape remaining quotes.
    const escapedQuotes = withEscapedNewlines.replace(/(?<!\\)"/g, '\\"');
    // 3) Also escape stray backslashes (but avoid double-escaping already escaped sequences)
    const escapedBackslashes = escapedQuotes.replace(/\\(?!["\\nrtbfu/])/g, "\\\\");
    return `"${escapedBackslashes}"`;
  });
}

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const result = await GenAiCode.sendMessage(prompt);
    const response = result?.response;

    let text = "";
    if (response?.text) text = await response.text();
    else if (typeof response === "string") text = response;

    if (!text) throw new Error("Empty AI response");

    // === ATTEMPT 0: quick extract and parse ===
    let cleaned = text;
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();

    // Try extraction
    let jsonLike = extractJsonLike(cleaned);

    // If nothing extracted, try performing light cleanup and try again
    if (!jsonLike) {
      const stripped = repairStripMarkdown(cleaned);
      jsonLike = extractJsonLike(stripped);
    }

    // If still nothing, fallback to whole text (last resort)
    if (!jsonLike) jsonLike = cleaned;

    // Try parsing directly
    try {
      const parsed = JSON.parse(jsonLike);
      if (!parsed || typeof parsed !== "object") throw new Error("Parsed not an object");
      if (!parsed.files || typeof parsed.files !== "object") throw new Error("AI JSON missing files");
      return NextResponse.json({ files: parsed.files }, { status: 200 });
    } catch (firstErr) {
      console.warn("GEN AI: direct parse failed:", firstErr.message);
      // continue to repairs
    }

    // === ATTEMPT 1: strip markdown and re-extract & parse ===
    try {
      const stripped = repairStripMarkdown(cleaned);
      const extracted = extractJsonLike(stripped) || stripped;
      try {
        const parsed = JSON.parse(extracted);
        if (parsed && parsed.files && typeof parsed.files === "object") {
          return NextResponse.json({ files: parsed.files }, { status: 200 });
        }
      } catch (err) {
        // fallthrough to next attempt
        console.warn("GEN AI: parse after strip failed:", err.message);
      }
    } catch (err) {
      console.warn("GEN AI: strip stage failed:", err.message);
    }

    // === ATTEMPT 2: escape strings & newlines inside the json-like block, then parse ===
    try {
      const extracted = extractJsonLike(cleaned) || cleaned;
      const escaped = escapeStringsAndNewlines(extracted);

      try {
        const parsed = JSON.parse(escaped);
        if (parsed && parsed.files && typeof parsed.files === "object") {
          console.info("GEN AI: repaired JSON with escapeStringsAndNewlines");
          return NextResponse.json({ files: parsed.files }, { status: 200 });
        }
      } catch (err) {
        console.warn("GEN AI: parse after escaping strings failed:", err.message);
        // log helpful snippet for debugging
        console.error("GEN AI DEBUG SNIPPET:", snippetAround(extracted, err?.position || 0));
      }
    } catch (err) {
      console.warn("GEN AI: escape stage failed:", err.message);
    }

    // === ATTEMPT 3: fallback attempt - try to heuristically pick out "files" value by regex ===
    try {
      // Look for "files": { ... } block specifically
      const filesMatch = cleaned.match(/"files"\s*:\s*(\{[\s\S]*\})/i) || cleaned.match(/files\s*:\s*(\{[\s\S]*\})/i);
      if (filesMatch && filesMatch[1]) {
        const candidate = filesMatch[1];
        // try parse candidate (with escape attempt)
        try {
          const parsedFiles = JSON.parse(candidate);
          if (parsedFiles && typeof parsedFiles === "object") {
            return NextResponse.json({ files: parsedFiles }, { status: 200 });
          }
        } catch (err) {
          const escaped = escapeStringsAndNewlines(candidate);
          try {
            const parsedFiles = JSON.parse(escaped);
            if (parsedFiles && typeof parsedFiles === "object") {
              return NextResponse.json({ files: parsedFiles }, { status: 200 });
            }
          } catch (err2) {
            console.warn("GEN AI: files block parse failed:", err2.message);
          }
        }
      }
    } catch (err) {
      console.warn("GEN AI: files-regex stage failed:", err.message);
    }

    // If we reach here, all repair attempts failed. Log full raw response & snippet.
    console.error("GEN AI ERROR: All parse attempts failed. Raw response length:", text.length);
    console.error("GEN AI ERROR SNIPPET (near error):", snippetAround(text, 11117, 280));
    console.error("FULL RAW RESPONSE (first 3000 chars):", text.slice(0, 3000));

    // FALLBACK so frontend NEVER breaks
    const fallback = {
      "index.html": { content: `<h1>Project failed to generate 😢</h1>\n\n<pre style="white-space:pre-wrap; background:#111; color:#eee; padding:8px; border-radius:6px;">AI output could not be parsed. Check server logs for details.</pre>`, language: "html" },
      "styles.css": { content: `body { font-family: system-ui, sans-serif; padding:20px; }`, language: "css" },
      "script.js": { content: `// AI generation failed - see server logs\nconsole.log("AI generation failed");`, language: "javascript" },
      "README.md": { content: `# AI Generation Failed\nThe model returned an unparsable response. Check server logs for the raw response and snippet.`, language: "markdown" }
    };

    return NextResponse.json({ files: fallback }, { status: 200 });
  } catch (error) {
    console.error("GEN AI ERROR (critical):", error);
    const fallback = {
      "index.html": { content: `<h1>Project failed to generate 😢</h1>`, language: "html" },
      "styles.css": { content: `body { font-family: sans-serif; }`, language: "css" },
      "script.js": { content: `console.log("AI generation failed");`, language: "javascript" },
      "README.md": { content: `# AI Generation Failed\nThe model could not generate files.`, language: "markdown" }
    };
    return NextResponse.json({ files: fallback }, { status: 200 });
  }
}
