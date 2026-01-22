import { NextResponse } from "next/server";
import { fetchElevenLabsSpeech } from "@/lib/tts/elevenlabs";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 20000;

export async function POST(request: Request) {
  let payload: { text?: string; voiceId?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const text = payload.text?.trim();
  const voiceId = payload.voiceId?.trim();

  if (!text || !voiceId) {
    return NextResponse.json(
      { error: "Both text and voiceId are required." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { stream, mimeType } = await fetchElevenLabsSpeech({
      text,
      voiceId,
      signal: controller.signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate speech.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
