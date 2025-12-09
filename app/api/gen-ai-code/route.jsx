import { NextResponse } from "next/server";
import { GenAiCode } from "@/configs/AiModel";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { error: "Missing 'prompt' in request body" },
        { status: 400 }
      );
    }

    // --- Call Gemini ---
    const result = await GenAiCode.sendMessage(prompt);
    const response = result?.response;
    let text = undefined;

    if (response) {
      if (typeof response.text === "function") {
        text = await response.text();
      } else if (typeof response.text === "string") {
        text = response.text;
      }
    }

    if (!text) {
      throw new Error("GenAi returned empty / no text content");
    }

    // If Gemini returned a rate limit error (429)
    if (text.includes("429") || text.includes("quota") || text.includes("Too Many Requests")) {
      return NextResponse.json(
        {
          error:
            "🚫 Gemini API quota reached — please wait or upgrade your plan to continue generating code.",
        },
        { status: 429 }
      );
    }

    // Try to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("⚠ RAW MODEL RESPONSE (first 400 chars):\n", text.slice(0, 400));
      throw new Error("Model did not return valid JSON");
    }

    // Extract files
    let files;
    if (parsed.files && typeof parsed.files === "object") {
      files = parsed.files; // Format A
    } else {
      files = parsed; // Format B
    }

    if (!files || typeof files !== "object") {
      throw new Error(`Model returned JSON but no usable 'files' object`);
    }

    return NextResponse.json(
      { files },
      { status: 200 }
    );

  } catch (error) {
    console.error("🛑 Gen AI Code API error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
