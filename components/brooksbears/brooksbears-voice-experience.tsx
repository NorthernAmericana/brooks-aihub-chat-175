"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { getOfficialVoiceId } from "@/lib/voice";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

type RecordingState = "idle" | "recording" | "transcribing";

export function BrooksBearsVoiceExperience({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const canRecord = useMemo(() => state === "idle", [state]);
  const isRecording = useMemo(() => state === "recording", [state]);

  const cleanupStream = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      return;
    }
    for (const track of stream.getTracks()) {
      track.stop();
    }
    streamRef.current = null;
  }, []);

  const playBenjamin = useCallback(async (text: string) => {
    const voiceId = getOfficialVoiceId("brooks-bears");
    try {
      const response = await fetch("/api/tts/elevenlabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });
      if (!response.ok) {
        return;
      }

      const audioBuffer = await response.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      await audioRef.current.play();
    } catch {
      // Ignore: autoplay / network errors shouldn't block UX
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (!canRecord) {
      return;
    }

    try {
      void playBenjamin("Hey. I’m listening. Talk to me.");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      const supportedMimeType = preferredMimeTypes.find((type) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported
          ? MediaRecorder.isTypeSupported(type)
          : false
      );

      const mediaRecorder = new MediaRecorder(
        stream,
        supportedMimeType ? { mimeType: supportedMimeType } : undefined
      );

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const rawType =
          supportedMimeType || audioChunksRef.current[0]?.type || "audio/webm";
        const normalizedType = rawType.split(";")[0] || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: normalizedType,
        });

        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const response = await fetch("/api/stt", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json().catch(() => null);
            const errorMessage =
              typeof data?.error === "string"
                ? data.error
                : "Speech-to-text failed.";
            toast({ type: "error", description: errorMessage });
            setState("idle");
            return;
          }

          const data = (await response.json()) as { text?: string };
          const transcript = data.text?.trim();
          if (!transcript) {
            toast({ type: "error", description: "I didn’t catch that—try again." });
            setState("idle");
            return;
          }

          const query = `/BrooksBears/BenjaminBear/ ${transcript}`;
          router.push(`/brooks-ai-hub/?query=${encodeURIComponent(query)}`);
        } catch {
          toast({ type: "error", description: "Speech-to-text failed." });
          setState("idle");
        } finally {
          cleanupStream();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setState("recording");
    } catch {
      toast({ type: "error", description: "Microphone access denied." });
      cleanupStream();
      setState("idle");
    }
  }, [canRecord, cleanupStream, playBenjamin, router]);

  const handleStopRecording = useCallback(() => {
    if (!isRecording) {
      return;
    }
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return;
    }

    setState("transcribing");
    recorder.stop();
    mediaRecorderRef.current = null;
  }, [isRecording]);

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <div className="mb-6 text-center">
        <div className="font-pixel text-2xl tracking-tight">/BrooksBears/</div>
        <div className="mt-1 text-xs uppercase tracking-[0.3em] text-white/70">
          Benjamin Bear
        </div>
      </div>

      <div className="relative w-full">
        <div className="mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-[40px] border border-white/15 bg-[#0f0c10]/60 shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="relative h-full w-full">
            <div className="absolute inset-x-0 top-0 flex items-center justify-center pt-6">
              <div className="h-6 w-28 rounded-full bg-black/70" />
            </div>

            <div className="absolute inset-x-0 top-16 flex items-center justify-center px-8">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <ImageWithFallback
                  alt="Benjamin Bear"
                  className="h-full w-full object-cover"
                  containerClassName="size-14 overflow-hidden rounded-2xl"
                  height={56}
                  src="/icons/brooksbears-appicon.png"
                  width={56}
                />
                <div>
                  <div className="text-sm font-semibold text-white">
                    BENJAMIN-BEAR
                  </div>
                  <div className="text-xs text-white/60">
                    Channel: Benjamin-Bear
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-3xl border border-white/10 bg-white/5 px-10 py-12 backdrop-blur-sm">
                <ImageWithFallback
                  alt="Benjamin Bear mascot"
                  className="h-full w-full object-contain"
                  containerClassName="size-40"
                  height={160}
                  priority={true}
                  src="/icons/brooksbears-appicon.png"
                  width={160}
                />
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-10 flex items-center justify-center px-6">
              <button
                className="w-full max-w-xs rounded-2xl border border-white/20 bg-black/40 px-6 py-5 text-center backdrop-blur-md transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={state === "transcribing"}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                type="button"
              >
                <div className="text-sm font-semibold tracking-wide text-white">
                  {state === "transcribing"
                    ? "TRANSCRIBING…"
                    : isRecording
                      ? "RELEASE TO SEND"
                      : "TAP TO SPEAK"}
                </div>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <span
                    className={[
                      "h-3 w-1 rounded-full bg-white/60",
                      isRecording ? "animate-pulse" : "",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "h-5 w-1 rounded-full bg-white/70",
                      isRecording ? "animate-pulse" : "",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "h-3 w-1 rounded-full bg-white/60",
                      isRecording ? "animate-pulse" : "",
                    ].join(" ")}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-white/60">
        Speak to start a new chat routed to{" "}
        <span className="font-mono text-white/80">
          /BrooksBears/BenjaminBear/
        </span>
      </p>
    </div>
  );
}
