"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/toast";
import { LoaderIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { getOfficialVoiceId } from "@/lib/voice";

const BENJAMIN_VOICE_ID = getOfficialVoiceId("brooks-bears");

const FADE_DURATION_MS = 900;
const PAUSE_DURATION_MS = 900;
const ERROR_GRACE_MS = 2_000;

const tutorialScenes = [
  {
    id: "cutz-male",
    name: "Cutz, The Bounty Hunter (Male)",
    voiceId: "lMRe2sVuZ5U4wXWlJxNL",
    talkingSrc: "/characters/cutz-male-talking.png",
    idleSrc: "/characters/cutz-male-standingstill.png",
    alt: "Cutz bounty hunter, male",
    lines: [
      {
        text: "Hey, This is Cutz, the bounty hunter from Northern Americana Media Collection or, NAMC, and I wanna help you get through /Brooks AI HUB/ tutorial.",
        displayText: (
          <>
            Hey, This is Cutz, the bounty hunter from Northern Americana Media
            Collection or, NAMC, and I wanna help you get through{" "}
            <span className="font-semibold text-white">/Brooks AI HUB/</span>{" "}
            tutorial.
          </>
        ),
      },
    ],
  },
  {
    id: "cutz-female",
    name: "Cutz, The Bounty Hunter (Female)",
    voiceId: "nW76CsdciIvkEq4JjpjH",
    talkingSrc: "/characters/cutz-female-talking.png",
    idleSrc: "/characters/cutz-female-standingstill.png",
    alt: "Cutz bounty hunter, female",
    lines: [
      {
        text: "Type /.../ to route to different agentic AI for vast explorative questions.",
        displayText: (
          <>
            Type <span className="font-semibold text-white">/.../</span> to route
            to different agentic AI for vast explorative questions.
          </>
        ),
      },
    ],
  },
  {
    id: "benjamin-bear",
    name: "Benjamin Bear",
    voiceId: BENJAMIN_VOICE_ID,
    talkingSrc: "/characters/benjamin-bear-talking.png",
    idleSrc: "/characters/benjamin-bear-standingstill.png",
    alt: "Benjamin Bear guide",
    lines: [
      {
        text: "Hey, It's Benjamin Bear! Enjoy /Brooks AI HUB/ and have fun exploring the app!",
        displayText: (
          <>
            Hey, It's Benjamin Bear! Enjoy{" "}
            <span className="font-semibold text-white">/Brooks AI HUB/</span> and
            have fun exploring the app!
          </>
        ),
      },
    ],
  },
];

type TutorialPhase = "idle" | "speaking" | "pause" | "transition";
type TutorialScene = (typeof tutorialScenes)[number];
type TutorialLine = TutorialScene["lines"][number];

export default function BrooksAiHubTutorialPage() {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<TutorialPhase>("idle");
  const [isCharacterVisible, setIsCharacterVisible] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "loading" | "playing">(
    "idle"
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineTokenRef = useRef(0);
  const sceneIndexRef = useRef(sceneIndex);
  const lineIndexRef = useRef(lineIndex);
  const phaseRef = useRef(phase);

  useEffect(() => {
    sceneIndexRef.current = sceneIndex;
  }, [sceneIndex]);

  useEffect(() => {
    lineIndexRef.current = lineIndex;
  }, [lineIndex]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const activeScene = tutorialScenes[sceneIndex];
  const activeLine = activeScene.lines[lineIndex];

  const clearTimers = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    lineTokenRef.current += 1;

    if (requestRef.current) {
      requestRef.current.abort();
      requestRef.current = null;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    audioRef.current = null;
    setVoiceStatus("idle");
  }, []);

  const beginSceneTransition = useCallback(
    (nextSceneIndex: number) => {
      clearTimers();
      setPhase("transition");
      setIsCharacterVisible(false);

      transitionTimeoutRef.current = window.setTimeout(() => {
        if (nextSceneIndex >= tutorialScenes.length) {
          router.push("/brooks-ai-hub/");
          return;
        }

        setSceneIndex(nextSceneIndex);
        setLineIndex(0);
        setPhase("speaking");
        setIsCharacterVisible(true);
      }, FADE_DURATION_MS);
    },
    [clearTimers, router]
  );

  const beginPause = useCallback(() => {
    if (phaseRef.current !== "speaking") {
      return;
    }

    clearTimers();
    setPhase("pause");

    pauseTimeoutRef.current = window.setTimeout(() => {
      const currentSceneIndex = sceneIndexRef.current;
      const currentLineIndex = lineIndexRef.current;
      const currentScene = tutorialScenes[currentSceneIndex];
      const isLastLine = currentLineIndex >= currentScene.lines.length - 1;

      if (isLastLine) {
        beginSceneTransition(currentSceneIndex + 1);
        return;
      }

      setLineIndex((current) => current + 1);
      setPhase("speaking");
    }, PAUSE_DURATION_MS);
  }, [beginSceneTransition, clearTimers]);

  const handleLineComplete = useCallback(() => {
    if (phaseRef.current !== "speaking") {
      return;
    }

    stopAudio();
    beginPause();
  }, [beginPause, stopAudio]);

  const scheduleFallbackAdvance = useCallback(
    (token: number) => {
      fallbackTimeoutRef.current = window.setTimeout(() => {
        if (lineTokenRef.current !== token) {
          return;
        }
        handleLineComplete();
      }, ERROR_GRACE_MS);
    },
    [handleLineComplete]
  );

  const playLine = useCallback(
    async (scene: TutorialScene, line: TutorialLine) => {
      stopAudio();
      clearTimers();
      setVoiceStatus("loading");

      const controller = new AbortController();
      requestRef.current = controller;

      let didTimeout = false;
      const timeoutId = window.setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, 15_000);

      const token = lineTokenRef.current;

      try {
        const response = await fetch("/api/tts/elevenlabs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: line.text, voiceId: scene.voiceId }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const message =
            typeof errorPayload?.error === "string"
              ? errorPayload.error
              : "Unable to generate speech right now.";
          setVoiceStatus("idle");
          toast({ type: "error", description: message });
          scheduleFallbackAdvance(token);
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audio.preload = "auto";
        audioRef.current = audio;

        audio.addEventListener("ended", () => {
          if (lineTokenRef.current !== token) {
            return;
          }
          setVoiceStatus("idle");
          handleLineComplete();
        });

        audio.addEventListener("error", () => {
          if (lineTokenRef.current !== token) {
            return;
          }
          setVoiceStatus("idle");
          toast({ type: "error", description: "Audio playback failed." });
          scheduleFallbackAdvance(token);
        });

        setVoiceStatus("playing");
        await audio.play();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (didTimeout) {
            toast({ type: "error", description: "Speech request timed out." });
          }
          scheduleFallbackAdvance(token);
          return;
        }

        toast({ type: "error", description: "Unable to generate speech right now." });
        scheduleFallbackAdvance(token);
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
        }
        clearTimeout(timeoutId);
        setVoiceStatus((current) => (current === "loading" ? "idle" : current));
      }
    },
    [clearTimers, handleLineComplete, scheduleFallbackAdvance, stopAudio]
  );

  useEffect(() => {
    if (!isStarted || phase !== "speaking") {
      return;
    }
    void playLine(activeScene, activeLine);
  }, [activeLine, activeScene, isStarted, phase, playLine]);

  useEffect(() => {
    return () => {
      clearTimers();
      stopAudio();
    };
  }, [clearTimers, stopAudio]);

  const handleStart = useCallback(() => {
    clearTimers();
    stopAudio();
    setIsStarted(true);
    setSceneIndex(0);
    setLineIndex(0);
    setPhase("speaking");
    setIsCharacterVisible(false);
    requestAnimationFrame(() => {
      setIsCharacterVisible(true);
    });
  }, [clearTimers, stopAudio]);

  const handleSkip = useCallback(() => {
    clearTimers();
    stopAudio();
    router.push("/brooks-ai-hub/");
  }, [clearTimers, router, stopAudio]);

  const handleManualAdvance = useCallback(() => {
    if (phaseRef.current !== "speaking") {
      return;
    }
    stopAudio();
    beginPause();
  }, [beginPause, stopAudio]);

  const isTextVisible = isStarted && phase === "speaking";
  const isTalking = phase === "speaking";
  const characterSrc = isTalking ? activeScene.talkingSrc : activeScene.idleSrc;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0a1511] text-white">
      <div className="intro-sky absolute inset-0" />
      <div className="intro-stars absolute inset-0" />
      <div className="intro-mist absolute inset-0" />

      <div className="absolute right-6 top-6 z-20">
        <button
          className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50"
          onClick={handleSkip}
          type="button"
        >
          Skip tutorial
        </button>
      </div>

      <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col px-6 pb-14 pt-24">
        <div className="text-center text-xs uppercase tracking-[0.3em] text-white/70">
          /Brooks AI HUB/ tutorial
        </div>

        {!isStarted ? (
          <div className="mx-auto mt-16 w-full max-w-xl">
            <div className="intro-glass rounded-[32px] px-6 py-10 text-center sm:px-10">
              <h1 className="font-pixel text-[clamp(1.2rem,4vw,2rem)] text-white">
                Tap to start
              </h1>
              <p className="mt-3 text-xs text-white/70 sm:text-sm">
                Meet the guides of Brooks AI HUB in a quick RPG-style walkthrough.
              </p>
              <button
                className="intro-start-button mt-6 rounded-full px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.35em] text-[#1b0f0f] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                onClick={handleStart}
                type="button"
              >
                Start adventure
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-1 flex-col justify-end gap-8">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="relative flex w-full max-w-sm items-end justify-center sm:max-w-md">
                <div
                  className={cn(
                    "relative h-[320px] w-[240px] transition-all duration-1000 ease-out sm:h-[420px] sm:w-[320px]",
                    isCharacterVisible ? "opacity-100" : "translate-y-4 opacity-0"
                  )}
                >
                  <Image
                    alt={activeScene.alt}
                    className="h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                    height={640}
                    priority
                    src={characterSrc}
                    width={480}
                  />
                </div>
              </div>

              <div className="w-full max-w-2xl">
                <div
                  className={cn(
                    "rounded-2xl border border-white/20 bg-black/60 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-500 ease-out",
                    isTextVisible
                      ? "translate-y-0 scale-100 opacity-100"
                      : "pointer-events-none translate-y-2 scale-[0.98] opacity-0"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-pixel text-[11px] uppercase tracking-[0.25em] text-white/80">
                      {activeScene.name}
                    </div>
                    <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
                      {voiceStatus === "loading" ? (
                        <>
                          <LoaderIcon size={14} />
                          Generating voice
                        </>
                      ) : voiceStatus === "playing" ? (
                        "Speaking"
                      ) : (
                        "Voice ready"
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-white/90 sm:text-base">
                    {activeLine.displayText}
                  </p>
                  <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/60">
                    <span>Auto-advancing...</span>
                    <button
                      className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white"
                      onClick={handleManualAdvance}
                      type="button"
                    >
                      Skip line
                    </button>
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-3 text-center text-[10px] uppercase tracking-[0.25em] text-white/40 transition-opacity duration-300",
                    phase === "pause" ? "opacity-100" : "opacity-0"
                  )}
                >
                  ...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
