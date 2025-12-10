import { NextResponse } from "next/server";
import { GenAiCode } from "@/configs/AiModel";

export async function POST(req) {
  try {
    const { prompt, existingFiles } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing 'prompt' in request body" }, { status: 400 });
    }

    // call model
    const result = await GenAiCode.sendMessage(prompt);
    const response = result?.response;
    let text = undefined;

    if (response) {
      if (typeof response.text === "function") {
        text = await response.text();
      } else if (typeof response.text === "string") {
        text = response.text;
      } else if (typeof response.output_text === "string") {
        text = response.output_text;
      }
    }

    if (!text) {
      console.error("GenAi returned empty response object:", result);
      throw new Error("GenAi returned empty / no text content");
    }

    // basic rate-limit detection
    if (String(text).toLowerCase().includes("quota") || String(text).includes("429") || String(text).includes("Too Many Requests")) {
      return NextResponse.json({ error: "🚫 Gemini API quota reached — please wait or upgrade your plan." }, { status: 429 });
    }

    // sanitize: remove markdown fences, backticks, BOM, nulls
    let cleanText = String(text)
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/^\uFEFF/, "")
      .replace(/\0/g, "")
      .trim();

    // remove trailing commas like {...,}
    cleanText = cleanText.replace(/,\s*([}\]])/g, "$1");

    // Remove any leading "```json\n" or similar wrapper lines often returned by models
    cleanText = cleanText.replace(/^\s*json\s*/i, "");

    // If model wrapped JSON inside extraneous triple-backticks with language tags, we already removed them above.
    // Attempt parsing
    let parsed = null;
    try {
      parsed = JSON.parse(cleanText);
    } catch (err) {
      console.error("⚠ RAW MODEL RESPONSE (first 1000 chars):\n", text.slice(0, 1000));
      console.error("⚠ CLEANED TEXT (first 1000 chars):\n", cleanText.slice(0, 1000));
      // Return helpful diagnostic to client (but keep status 500)
      throw new Error("Model did not return valid JSON (after cleanup)");
    }

    // Normalize files structure:
    let files;
    if (parsed && parsed.files && typeof parsed.files === "object") {
      files = parsed.files;
    } else if (parsed && typeof parsed === "object" && !parsed.files) {
      // maybe model returned the files object directly
      files = parsed;
    }

    if (!files || typeof files !== "object") {
      console.error("Parsed JSON but no usable 'files' object:", parsed);
      throw new Error("Model returned JSON but no usable 'files' object");
    }

    // final sanitization: remove sourcemaps + fences inside file contents
    Object.keys(files).forEach((p) => {
      let v = files[p];
      let code = typeof v === "object" ? v.code : v;
      if (!code) code = "";

      code = code.replace(/\/\/# sourceMappingURL=.*$/gm, "");
      code = code.replace(/\/\/# sourceMapURL=.*$/gm, "");
      code = code.replace(/\/\*# sourceMappingURL=.*?\*\//gm, "");
      code = code.replace(/```+/g, "");
      code = code.replace(/^\uFEFF/, "").replace(/\0/g, "");

      files[p] = { code };
    });

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("🛑 Gen AI Code API error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
