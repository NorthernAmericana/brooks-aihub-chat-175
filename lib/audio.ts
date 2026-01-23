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
    const audio = new Audio();

    // Critical: Set the source AFTER setting up event listeners
    // This ensures we don't miss any events
    
    // Handle audio cleanup
    const cleanupAudio = () => {
      URL.revokeObjectURL(audioUrl);
    };

    // Wait for audio to be fully loaded and ready to play
    // Using loadeddata instead of canplaythrough for more reliability
    await new Promise<void>((resolve, reject) => {
      const onLoadedData = () => {
        // Audio data is loaded, check if we can play through
        if (audio.readyState >= 3) { // HAVE_FUTURE_DATA or better
          resolve();
        } else {
          // Wait for more data
          audio.addEventListener("canplay", () => resolve(), { once: true });
        }
      };
      
      const onError = (e: Event) => {
        cleanupAudio();
        const errorMsg = e instanceof ErrorEvent ? e.message : "Audio failed to load.";
        reject(new Error(errorMsg));
      };

      audio.addEventListener("loadeddata", onLoadedData, { once: true });
      audio.addEventListener("error", onError, { once: true });
      
      // Now set the source to start loading
      audio.src = audioUrl;
      audio.preload = "auto";
      audio.load();
    });

    // Set up cleanup handlers for playback phase
    let hasCleanedUp = false;
    const safeCleanup = () => {
      if (!hasCleanedUp) {
        hasCleanedUp = true;
        cleanupAudio();
      }
    };

    audio.addEventListener("ended", safeCleanup);
    audio.addEventListener("error", safeCleanup);
    
    // Ensure we keep a reference to prevent garbage collection during playback
    let keepAliveTimer: NodeJS.Timeout | null = null;
    const clearKeepAlive = () => {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
    };

    keepAliveTimer = setInterval(() => {
      // Clear if audio has ended or errored
      if (audio.ended || audio.error) {
        clearKeepAlive();
      }
    }, 100);

    try {
      await audio.play();
      
      // Wait for playback to complete or error
      await new Promise<void>((resolve, reject) => {
        const onEnded = () => {
          audio.removeEventListener("error", onPlaybackError);
          clearKeepAlive();
          resolve();
        };
        
        const onPlaybackError = () => {
          audio.removeEventListener("ended", onEnded);
          clearKeepAlive();
          reject(new Error("Audio playback error during play."));
        };

        audio.addEventListener("ended", onEnded, { once: true });
        audio.addEventListener("error", onPlaybackError, { once: true });
      });
    } catch (playError) {
      clearKeepAlive();
      safeCleanup();
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
