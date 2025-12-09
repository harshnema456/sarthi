// src/app/api/gen-ai-code/route.js  (or replace your existing file)
import { NextResponse } from "next/server";
import { GenAiCode } from "@/configs/AiModel";

/* ---------- helpers ---------- */

function snippetAround(text, pos, len = 140) {
  const start = Math.max(0, (pos || 0) - Math.floor(len / 2));
  return text.slice(start, Math.min(text.length, start + len));
}

/**
 * Find a balanced {...} JSON-like block starting at first '{'.
 * This avoids greedy lastIndexOf issues when nested braces exist.
 */
function extractJsonLike(text) {
  if (!text) return null;

  // 1) explicit fenced ```json``` block (preferred)
  const fenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();

  // 2) find balanced top-level { ... }
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  // fallback: naive first..last if above fails
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace > start) return text.slice(start, lastBrace + 1);
  return null;
}

/**
 * Remove common markdown/code fences and stray leading/trailing text
 * and escape closing script tags.
 */
function repairStripMarkdown(text) {
  return text
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, (m) => m.replace(/<\/script>/gi, "<\\/script>"))
    .trim();
}

/**
 * Detect likely invalid backslash escapes (e.g. \p, \(, etc.)
 * Returns array of { index, sequence, snippet } to help debugging.
 */
function findBadBackslashEscape(text) {
  const results = [];
  const re = /\\(?!["\\/bfnrtu])/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const idx = m.index;
    results.push({ index: idx, sequence: text.slice(idx, idx + 6), snippet: snippetAround(text, idx, 160) });
  }
  return results;
}

/**
 * Repair quoted string contents safely: escape raw newlines, unescaped quotes,
 * and stray backslashes while preserving valid escape sequences.
 */
function repairQuotedStrings(jsonLike) {
  if (!jsonLike || typeof jsonLike !== "string") return jsonLike;

  function escapeStringContent(inner) {
    let out = "";
    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];

      // normalize newline sequences
      if (ch === "\r") {
        if (inner[i + 1] === "\n") {
          out += "\\n";
          i++;
        } else {
          out += "\\r";
        }
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\u2028") { out += "\\u2028"; continue; }
      if (ch === "\u2029") { out += "\\u2029"; continue; }

      if (ch === '"') {
        out += '\\"';
        continue;
      }

      if (ch === "\\") {
        const next = inner[i + 1];
        // preserve valid JSON escapes
        if (next && (next === '"' || next === "\\" || next === "/" || next === "b" || next === "f" || next === "n" || next === "r" || next === "t" || next === "u")) {
          out += "\\" + next;
          i++;
          continue;
        } else {
          // stray backslash -> escape it
          out += "\\\\";
          continue;
        }
      }

      out += ch;
    }
    return out;
  }

  // Replace double-quoted strings (handles across lines)
  const dqPattern = /"((?:[^"\\]|\\.)*)"/gs;
  let replaced = jsonLike.replace(dqPattern, (fullMatch, inner) => {
    const escapedInner = escapeStringContent(inner);
    return `"${escapedInner}"`;
  });

  // Convert single-quoted strings into JSON-safe double-quoted strings
  const sqPattern = /'((?:[^'\\]|\\.)*)'/gs;
  replaced = replaced.replace(sqPattern, (fullMatch, inner) => {
    const escapedInner = escapeStringContent(inner);
    return `"${escapedInner}"`;
  });

  return replaced;
}

/* ---------- main handler ---------- */

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

    let cleaned = text.trim();

    // Balanced extraction first
    let jsonLike = extractJsonLike(cleaned);

    // If nothing extracted, try strip markdown then extract
    if (!jsonLike) {
      const stripped = repairStripMarkdown(cleaned);
      jsonLike = extractJsonLike(stripped);
    }

    // Last resort: entire text
    if (!jsonLike) jsonLike = cleaned;

    // Attempt 0: direct parse
    try {
      const parsed = JSON.parse(jsonLike);
      if (!parsed || typeof parsed !== "object") throw new Error("Parsed not an object");
      if (!parsed.files || typeof parsed.files !== "object") throw new Error("AI JSON missing files");
      return NextResponse.json({ files: parsed.files }, { status: 200 });
    } catch (firstErr) {
      console.warn("GEN AI: direct parse failed:", firstErr.message);
    }

    // Attempt 1: strip markdown and parse
    try {
      const stripped = repairStripMarkdown(cleaned);
      const extracted = extractJsonLike(stripped) || stripped;
      try {
        const parsed = JSON.parse(extracted);
        if (parsed && parsed.files && typeof parsed.files === "object") {
          return NextResponse.json({ files: parsed.files }, { status: 200 });
        }
      } catch (err) {
        console.warn("GEN AI: parse after strip failed:", err.message);
      }
    } catch (err) {
      console.warn("GEN AI: strip stage failed:", err.message);
    }

    // Diagnostic: find likely bad backslash escapes and log them
    try {
      const badEscapes = findBadBackslashEscape(jsonLike);
      if (badEscapes.length) {
        console.error("GEN AI: detected likely invalid backslash escapes (first few):", badEscapes.slice(0, 8));
      }
    } catch (err) {
      console.warn("GEN AI: bad-escape scan failed:", err.message);
    }

    // Attempt 2: repair quoted strings and parse
    try {
      const extracted = extractJsonLike(cleaned) || cleaned;
      const repaired = repairQuotedStrings(extracted);

      try {
        const parsed = JSON.parse(repaired);
        if (parsed && parsed.files && typeof parsed.files === "object") {
          console.info("GEN AI: repaired JSON by escaping quoted strings");
          return NextResponse.json({ files: parsed.files }, { status: 200 });
        }
      } catch (err) {
        console.warn("GEN AI: parse after repairing quoted strings failed:", err.message);
        console.error("GEN AI DEBUG SNIPPET:", snippetAround(extracted, typeof err?.position === "number" ? err.position : 0, 300));
      }
    } catch (err) {
      console.warn("GEN AI: repair-quoted-strings stage failed:", err.message);
    }

    // Attempt 3: specifically extract "files": { ... } block and repair it
    try {
      const filesMatch = cleaned.match(/"files"\s*:\s*(\{[\s\S]*\})/i) || cleaned.match(/files\s*:\s*(\{[\s\S]*\})/i);
      if (filesMatch && filesMatch[1]) {
        const candidate = filesMatch[1];
        try {
          const parsedFiles = JSON.parse(candidate);
          if (parsedFiles && typeof parsedFiles === "object") {
            return NextResponse.json({ files: parsedFiles }, { status: 200 });
          }
        } catch (err) {
          try {
            const repairedCandidate = repairQuotedStrings(candidate);
            const parsedFiles = JSON.parse(repairedCandidate);
            if (parsedFiles && typeof parsedFiles === "object") {
              return NextResponse.json({ files: parsedFiles }, { status: 200 });
            }
          } catch (err2) {
            console.warn("GEN AI: files block parse failed after repair:", err2.message);
            console.error("GEN AI DEBUG SNIPPET:", snippetAround(candidate, 0, 300));
          }
        }
      }
    } catch (err) {
      console.warn("GEN AI: files-regex stage failed:", err.message);
    }

    // All attempts failed: log context and return fallback (include raw output for debugging)
    console.error("GEN AI ERROR: All parse attempts failed. Raw response length:", text.length);
    try {
      const bad = findBadBackslashEscape(text);
      if (bad.length) console.error("GEN AI: bad backslash escape candidates near failure:", bad.slice(0, 12));
    } catch (_) {}

    // log snippet near a likely failure area (you can change the position if you have an error position)
    console.error("GEN AI ERROR SNIPPET (near error):", snippetAround(text, 21583, 420));
    console.error("FULL RAW RESPONSE (first 3000 chars):", text.slice(0, 3000));

    const fallback = {
      "index.html": {
        content: `<h1>Project failed to generate </h1>\n\n<pre style="white-space:pre-wrap; background:#111; color:#eee; padding:8px; border-radius:6px;">AI output could not be parsed. Check server logs for details.</pre>`,
        language: "html",
      },
      "styles.css": { content: `body { font-family: system-ui, sans-serif; padding:20px; }`, language: "css" },
      "script.js": { content: `// AI generation failed - see server logs\nconsole.log("AI generation failed");`, language: "javascript" },
      "README.md": { content: `# AI Generation Failed\nThe model returned an unparsable response. Check server logs for the raw response and snippet.`, language: "markdown" },
      "AI-raw-output.txt": { content: text.slice(0, 20000), language: "text" },
    };

    return NextResponse.json({ files: fallback }, { status: 200 });
  } catch (error) {
    console.error("GEN AI ERROR (critical):", error);
    const fallback = {
      "index.html": { content: `<h1>Project failed to generate </h1>`, language: "html" },
      "styles.css": { content: `body { font-family: sans-serif; }`, language: "css" },
      "script.js": { content: `console.log("AI generation failed");`, language: "javascript" },
      "README.md": { content: `# AI Generation Failed\nThe model could not generate files.`, language: "markdown" },
    };
    return NextResponse.json({ files: fallback }, { status: 200 });
  }
}
