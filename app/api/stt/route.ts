import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    // TODO: Implement actual speech-to-text using OpenAI Whisper or similar service
    // For now, return a placeholder message
    return NextResponse.json({
      text: "[Speech-to-text transcription will appear here]",
      message: "STT API needs to be configured with OpenAI Whisper or similar service",
    });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json(
      { error: "Speech-to-text processing failed." },
      { status: 500 }
    );
  }
}
