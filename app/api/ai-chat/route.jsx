import { NextResponse } from "next/server";
import { GenAiCode } from "@/configs/AiModel";

// helper: wait
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// helper: call Gemini with retry on 503
async function sendChatWithRetry(prompt, retries = 3) {
  let attempt = 0;

  while (attempt < retries) {
    try {
const result = await GenAiCode.sendMessage([{ text: prompt }]);
      return result;
    } catch (err) {
      const status =
        err?.status ||
        err?.response?.status ||
        err?.cause?.response?.status;

      // Only retry on 503
      if (status === 503 && attempt < retries - 1) {
        attempt++;
        // exponential backoff: 1s, 2s, 3s ...
        await sleep(1000 * attempt);
        continue;
      }

      // not 503 or out of retries → rethrow
      throw err;
    }
  }
}

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    console.log("[/api/ai-chat] Received prompt:", prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing 'prompt' in request body" },
        { status: 400 }
      );
    }

    // 🔁 call with retry
    const result = await sendChatWithRetry(prompt);

    const response = result?.response;
    let text;

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

    return NextResponse.json({ result: text }, { status: 200 });
  } catch (error) {
    console.error("AI Chat API error:", error);

    const status =
      error?.status ||
      error?.response?.status ||
      error?.cause?.response?.status ||
      500;

    // If Gemini says 503, pass that to the frontend
    const safeStatus = status === 503 ? 503 : 500;

    return NextResponse.json(
      {
        error:
          safeStatus === 503
            ? "AI model is overloaded. Please try again."
            : error?.message || "Internal Server Error",
      },
      { status: safeStatus }
    );
  }
}