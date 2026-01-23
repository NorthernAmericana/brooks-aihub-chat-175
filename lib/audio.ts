import { toast } from "sonner";

// Timeout should be less than the API timeout (30s) to ensure client detects timeouts first
const DEFAULT_TTS_TIMEOUT_MS = 25_000;

/**
 * Plays text-to-speech audio using the ElevenLabs API
 * @param text - The text to speak
 * @param voiceId - The ElevenLabs voice ID to use
 * @param timeoutMs - Timeout in milliseconds (default: 25000ms)
 * @returns Promise that resolves when audio playback completes or rejects on error
 */
export async function playTextToSpeech(
  text: string,
  voiceId: string,
  timeoutMs: number = DEFAULT_TTS_TIMEOUT_MS
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
    
    // Verify we have actual audio data
    if (audioBlob.size === 0) {
      throw new Error("Received empty audio data.");
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Ensure audio is preloaded to prevent glitching
    audio.preload = "auto";
    audio.autoplay = false;

    // Handle audio cleanup
    const cleanupAudio = () => {
      URL.revokeObjectURL(audioUrl);
    };

    // Wait for audio to be ready before playing to prevent glitches
    // Using a more robust approach with multiple event listeners
    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      
      const onCanPlayThrough = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve();
      };
      
      const onError = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        cleanupAudio();
        reject(new Error("Audio failed to load."));
      };

      const onLoadedMetadata = () => {
        // Metadata loaded - audio duration is now available
        // This ensures the audio file is valid
      };

      const cleanup = () => {
        audio.removeEventListener("canplaythrough", onCanPlayThrough);
        audio.removeEventListener("error", onError);
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      };

      audio.addEventListener("canplaythrough", onCanPlayThrough);
      audio.addEventListener("error", onError);
      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      
      // Start loading the audio
      audio.load();
    });

    audio.addEventListener("ended", cleanupAudio);
    audio.addEventListener("error", cleanupAudio);

    try {
      await audio.play();
    } catch (playError) {
      cleanupAudio();
      // Handle autoplay policy errors specifically
      if (playError instanceof DOMException && playError.name === "NotAllowedError") {
        throw new Error("Audio playback blocked by browser. Please interact with the page first.");
      }
      throw playError;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Speech request timed out.");
    }
    throw error;
  }
}
