"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

const HERO_SRC = "/ato/brooksbears/benjamin-hero.png";
const SPEECH_EVENT = "brooksbears:tts-playback";
const VISEME_EVENT = "brooksbears:tts-viseme";

type MouthState = "rest" | "open" | "wide";

type SpeechPlaybackDetail = {
  state?: "start" | "end" | "pause";
};

type SpeechVisemeDetail = {
  viseme?: string;
};

const visemeToMouthState = (viseme?: string): MouthState => {
  if (!viseme) return "open";
  if (["A", "E", "I", "AA", "AE", "EH", "IH"].includes(viseme)) {
    return "wide";
  }
  if (["M", "B", "P", "FV"].includes(viseme)) {
    return "rest";
  }
  return "open";
};

export default function BenjaminHero() {
  const searchParams = useSearchParams();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthState, setMouthState] = useState<MouthState>("rest");
  const [imageError, setImageError] = useState(false);
  const [isPointerFine, setIsPointerFine] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(pointer:fine)");
    const updatePointer = () => setIsPointerFine(media.matches);
    updatePointer();
    media.addEventListener("change", updatePointer);
    return () => media.removeEventListener("change", updatePointer);
  }, []);

  useEffect(() => {
    setImageError(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onSpeechPlayback = (event: Event) => {
      const detail = (event as CustomEvent<SpeechPlaybackDetail>).detail;
      if (detail?.state === "start") {
        setIsSpeaking(true);
        return;
      }
      if (detail?.state === "pause" || detail?.state === "end") {
        setIsSpeaking(false);
        setMouthState("rest");
      }
    };

    const onSpeechViseme = (event: Event) => {
      const detail = (event as CustomEvent<SpeechVisemeDetail>).detail;
      setIsSpeaking(true);
      setMouthState(visemeToMouthState(detail?.viseme));
    };

    window.addEventListener(SPEECH_EVENT, onSpeechPlayback as EventListener);
    window.addEventListener(VISEME_EVENT, onSpeechViseme as EventListener);
    return () => {
      window.removeEventListener(
        SPEECH_EVENT,
        onSpeechPlayback as EventListener
      );
      window.removeEventListener(VISEME_EVENT, onSpeechViseme as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isSpeaking) return;
    const interval = window.setInterval(() => {
      setMouthState((previous) =>
        previous === "rest" ? "open" : previous === "open" ? "wide" : "open"
      );
    }, 140);
    return () => window.clearInterval(interval);
  }, []);

  const isDebug = useMemo(() => {
    return process.env.NODE_ENV === "development" && searchParams?.get("debug") === "1";
  }, [searchParams]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPointerFine) return;
    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 8;
    const rotateY = (x - 0.5) * 8;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="relative flex flex-col items-center gap-4">
      <div
        className={
          "relative flex w-full max-w-[420px] items-center justify-center rounded-[32px] bg-gradient-to-b from-amber-50 via-amber-100 to-emerald-100 p-6 shadow-[0_24px_60px_rgba(20,30,60,0.15)] transition-transform duration-300 " +
          (isSpeaking ? "animate-hero-float-talk" : "animate-hero-float")
        }
        onMouseMove={isPointerFine ? handleMouseMove : undefined}
        onMouseLeave={isPointerFine ? handleMouseLeave : undefined}
        style={{
          transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="relative w-full">
          <ImageWithFallback
            src={HERO_SRC}
            alt="Benjamin the bear hero"
            width={720}
            height={980}
            className="h-auto w-full select-none rounded-[24px] object-cover"
            containerClassName="w-full"
            priority
            onError={() => setImageError(true)}
          />
          {imageError && (
            <div className="absolute inset-0 flex min-h-[480px] w-full items-center justify-center rounded-[24px] text-sm font-semibold text-amber-900">
              Hero image coming soon
            </div>
          )}
          {!imageError && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[22%]">
              <div
                className={
                  "rounded-full bg-[#2f1506]/70 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-100 " +
                  (mouthState === "rest"
                    ? "h-1.5 w-8"
                    : mouthState === "open"
                      ? "h-3 w-8"
                      : "h-4 w-10")
                }
              />
            </div>
          )}
        </div>
      </div>

      {isDebug && (
        <button
          type="button"
          className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white shadow"
          onClick={() => setIsSpeaking((prev) => !prev)}
        >
          Toggle speaking
        </button>
      )}
    </div>
  );
}
