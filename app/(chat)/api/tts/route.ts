import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { getVoiceById } from "@/lib/voice";

const ttsRequestSchema = z.object({
  text: z.string().min(1).max(4000),
  voiceId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return new ChatSDKError(
      "bad_request:api",
      "Missing ElevenLabs API key."
    ).toResponse();
  }

  let payload: z.infer<typeof ttsRequestSchema>;

  try {
    payload = ttsRequestSchema.parse(await request.json());
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const voice = getVoiceById(payload.voiceId);

  if (!voice) {
    return new ChatSDKError(
      "bad_request:api",
      "Unsupported ElevenLabs voice."
    ).toResponse();
  }

  const elevenLabsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: payload.text,
        model_id: "eleven_multilingual_v2",
      }),
    }
  );

  if (!elevenLabsResponse.ok) {
    return new ChatSDKError(
      "bad_request:api",
      "ElevenLabs request failed."
    ).toResponse();
  }

  const audioBuffer = await elevenLabsResponse.arrayBuffer();

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}
