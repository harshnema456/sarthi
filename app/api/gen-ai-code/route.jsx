import { NextResponse } from "next/server";
import { GenAiCode } from "@/configs/AiModel";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    console.log("Received prompt:", prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing 'prompt' in request body" },
        { status: 400 }
      );
    }

    const result = await GenAiCode.sendMessage(prompt);
    console.log("Raw GenAiCode result:", JSON.stringify(result, null, 2));

    // Safely extract text
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
      throw new Error("GenAi returned empty or invalid response.text");
    }

    // Parse text into JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error(
        "Model returned NON-JSON text. First 500 chars:",
        text.slice(0, 500)
      );
      throw new Error("Model did not return valid JSON");
    }

    if (!parsed.files || typeof parsed.files !== "object") {
      console.error("Parsed JSON:", parsed);
      throw new Error(`JSON has no "files" object`);
    }

    return NextResponse.json(
      { files: parsed.files },
      { status: 200 }
    );

  } catch (error) {
    console.error("Gen AI Code API error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
