const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export type ElevenLabsAudioResponse = {
  audio: ArrayBuffer;
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
    `${ELEVENLABS_BASE_URL}/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const audio = await response.arrayBuffer();

  const mimeType = response.headers.get("Content-Type") ?? "audio/mpeg";

  return { audio, mimeType };
};
