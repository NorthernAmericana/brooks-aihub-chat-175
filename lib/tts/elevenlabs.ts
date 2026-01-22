const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export type ElevenLabsAudioResponse = {
  stream: ReadableStream<Uint8Array>;
  mimeType: string;
};

export const getElevenLabsApiKey = () => {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  return apiKey;
};

export const fetchElevenLabsSpeech = async ({
  text,
  voiceId,
  signal,
}: {
  text: string;
  voiceId: string;
  signal?: AbortSignal;
}): Promise<ElevenLabsAudioResponse> => {
  const apiKey = getElevenLabsApiKey();
  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${encodeURIComponent(voiceId)}/stream`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${errorText}`
    );
  }

  if (!response.body) {
    throw new Error("ElevenLabs response did not include a stream.");
  }

  return {
    stream: response.body,
    mimeType: response.headers.get("content-type") ?? "audio/mpeg",
  };
};
