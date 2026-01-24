import { NextResponse } from "next/server";
// Import the actual OpenAI SDK from node_modules, bypassing the tsconfig path alias
// eslint-disable-next-line @typescript-eslint/no-require-imports
const OpenAI = require("openai").default || require("openai");

export async function POST(request: Request) {
  try {
    // Validate API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Invalid audio format." },
        { status: 400 }
      );
    }

    // Convert Blob to File for OpenAI API
    const audioFile = new File([audio], "audio.webm", { type: audio.type });

    // Use OpenAI Whisper (gpt-4o-transcribe model) for transcription
    const transcription = await client.audio.transcriptions.create({
      model: "gpt-4o-transcribe",
      file: audioFile,
    });

    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error("STT error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Speech-to-text processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
