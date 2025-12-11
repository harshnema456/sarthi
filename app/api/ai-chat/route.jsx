import { NextResponse } from "next/server";
import { chatSession } from "@/configs/AiModel";

/** ---------------------------------------------------------
 *  Utility: Small wait function
 * -------------------------------------------------------- */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/** ---------------------------------------------------------
 *  Gemini API wrapper with retry logic (handles 503 overload)
 * -------------------------------------------------------- */
async function sendChatWithRetry(prompt, retries = 3) {
  let attempt = 0;

  while (attempt < retries) {
    try {
      // Send message normally
      const result = await chatSession.sendMessage(prompt);
      return result;
    } catch (err) {
      const status =
        err?.status ||
        err?.response?.status ||
        err?.cause?.response?.status;

      // Retry ONLY on 503
      if (status === 503 && attempt < retries - 1) {
        attempt++;
        await sleep(1000 * attempt); // exponential backoff (1s, 2s, 3s)
        continue;
      }

      throw err; // Out of retries or not 503 → fail
    }
  }
}

/** ---------------------------------------------------------
 *  POST Handler (Main AI Chat Route)
 * -------------------------------------------------------- */
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

    // 🔁 Send with retry wrapper
    const result = await sendChatWithRetry(prompt);

    console.log("Raw chatSession result:", JSON.stringify(result, null, 2));

    const response = result?.response;
    let text;

    // Handle both Gemini SDK styles: response.text() vs response.text
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

    // Return plain text JSON output to the frontend
    return NextResponse.json({ result: text }, { status: 200 });

  } catch (error) {
    console.error("AI Chat API error:", error);

    const status =
      error?.status ||
      error?.response?.status ||
      error?.cause?.response?.status ||
      500;

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
