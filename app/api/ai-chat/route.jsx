import { NextResponse } from "next/server";
import { chatSession } from "@/configs/AiModel";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    console.log("[/api/...route] Received prompt:", prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing 'prompt' in request body" },
        { status: 400 }
      );
    }

    const result = await chatSession.sendMessage(prompt);
    console.log("Raw chatSession result:", JSON.stringify(result, null, 2));

    const response = result?.response;
    let text;

    // Handle both SDK styles: response.text() or response.text
    if (response) {
      if (typeof response.text === "function") {
        text = await response.text();
      } else {
        text = response.text;
      }
    }

    if (!text) {
      throw new Error("AI returned empty or invalid response.text");
    }

    // If your frontend expects plain text:
    return NextResponse.json({ result: text });

    // If your frontend expects JSON, you’d do:
    // const parsed = JSON.parse(text);
    // return NextResponse.json(parsed);

  } catch (error) {
    console.error("AI Chat API error:", error?.response?.data || error);

    return NextResponse.json(
      {
        error: error?.message || "Internal Server Error",
        details: error?.response?.data ?? null,
      },
      { status: 500 }
    );
  }
}
