import { toast } from "sonner";

/**
 * Plays text-to-speech audio using the ElevenLabs API
 * @param text - The text to speak
 * @param voiceId - The ElevenLabs voice ID to use
 * @returns Promise that resolves when audio playback completes or rejects on error
 */
export async function playTextToSpeech(
  text: string,
  voiceId: string
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch("/api/tts/elevenlabs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const message =
        errorPayload?.error ?? "Unable to generate speech right now.";
      throw new Error(message);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Ensure audio is preloaded to prevent glitching
    audio.preload = "auto";
    audio.autoplay = false;

    // Handle audio cleanup
    const cleanupAudio = () => {
      URL.revokeObjectURL(audioUrl);
    };

    audio.addEventListener("ended", cleanupAudio);
    audio.addEventListener("error", () => {
      cleanupAudio();
      throw new Error("Audio playback failed.");
    });

    // Wait for audio to be ready before playing to prevent glitches
    await new Promise<void>((resolve, reject) => {
      audio.addEventListener("canplaythrough", () => resolve(), {
        once: true,
      });
      audio.addEventListener("error", reject, { once: true });
      audio.load();
    });

    await audio.play();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Speech request timed out.");
    }
    throw error;
  }
}
