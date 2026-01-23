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
    
    // Create object URL - this will stay valid until explicitly revoked
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create audio element with source directly
    const audio = new Audio(audioUrl);
    
    // Return a promise that resolves when audio finishes playing
    return new Promise<void>((resolve, reject) => {
      let isFinished = false;
      
      const cleanup = () => {
        if (!isFinished) {
          isFinished = true;
          // Delay URL revocation to ensure audio has fully completed
          setTimeout(() => {
            URL.revokeObjectURL(audioUrl);
          }, 100);
        }
      };
      
      audio.addEventListener("ended", () => {
        cleanup();
        resolve();
      });
      
      audio.addEventListener("error", () => {
        cleanup();
        const errorMsg = audio.error 
          ? `${audio.error.message} (code: ${audio.error.code})`
          : "Audio playback failed";
        reject(new Error(errorMsg));
      });
      
      // Start playback
      audio.play().catch((playError) => {
        cleanup();
        if (playError instanceof DOMException && playError.name === "NotAllowedError") {
          reject(new Error("Audio playback blocked by browser. Please interact with the page first."));
        } else {
          reject(playError);
        }
      });
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Speech request timed out.");
    }
    throw error;
  }
}
