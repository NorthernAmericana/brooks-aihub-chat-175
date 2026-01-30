"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/toast";
import { LoaderIcon, SpeakerIcon, StopIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { getOfficialVoiceId } from "@/lib/voice";

const BENJAMIN_VOICE_ID = getOfficialVoiceId("brooks-bears");

const tutorialSteps = [
  {
    id: "cutz-male",
    name: "Cutz",
    title: "Bounty Hunter - NAMC",
    text: "Hey, This is Cutz, the bounty hunter from Northern Americana Media Collection or, NAMC, and I wanna help you get through /Brooks AI HUB/ tutorial.",
    displayText: (
      <>
        Hey, This is Cutz, the bounty hunter from Northern Americana Media
        Collection or, NAMC, and I wanna help you get through{" "}
        <span className="font-semibold text-white">/Brooks AI HUB/</span> tutorial.
      </>
    ),
    voiceId: "lMRe2sVuZ5U4wXWlJxNL",
    talkingSrc: "/characters/cutz-male-talking.png",
    idleSrc: "/characters/cutz-male-standingstill.png",
    alt: "Cutz bounty hunter, male",
  },
  {
    id: "cutz-female",
    name: "Cutz",
    title: "Bounty Hunter",
    text: "Type /.../ to route to different agentic AI for vast explorative questions.",
    displayText: (
      <>
        Type <span className="font-semibold text-white">/.../</span> to route to
        different agentic AI for vast explorative questions.
      </>
    ),
    voiceId: "nW76CsdciIvkEq4JjpjH",
    talkingSrc: "/characters/cutz-female-talking.png",
    idleSrc: "/characters/cutz-female-standingstill.png",
    alt: "Cutz bounty hunter, female",
  },
  {
    id: "benjamin-bear",
    name: "Benjamin Bear",
    title: "Brooks AI HUB Guide",
    text: "Hey, It's Benjamin Bear! Enjoy /Brooks AI HUB/ and have fun exploring the app!",
    displayText: (
      <>
        Hey, It's Benjamin Bear! Enjoy{" "}
        <span className="font-semibold text-white">/Brooks AI HUB/</span> and have
        fun exploring the app!
      </>
    ),
    voiceId: BENJAMIN_VOICE_ID,
    talkingSrc: "/characters/benjamin-bear-talking.png",
    idleSrc: "/characters/benjamin-bear-standingstill.png",
    alt: "Benjamin Bear guide",
  },
];

export default function BrooksAiHubTutorialPage() {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [playingStepId, setPlayingStepId] = useState<string | null>(null);
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const lastStepIndex = tutorialSteps.length - 1;
  const activeStep = tutorialSteps[activeStepIndex];
  const visibleSteps = useMemo(
    () => tutorialSteps.slice(0, activeStepIndex + 1),
    [activeStepIndex]
  );

  const stopAudio = useCallback(() => {
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
    setPlayingStepId(null);
    setLoadingStepId(null);
  }, []);

  const handleSpeak = useCallback(
    async (step: (typeof tutorialSteps)[number]) => {
      if (playingStepId === step.id) {
        stopAudio();
        return;
      }

      stopAudio();
      setLoadingStepId(step.id);

      const controller = new AbortController();
      requestRef.current = controller;

      let didTimeout = false;
      const timeoutId = setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, 15_000);

      try {
        const response = await fetch("/api/tts/elevenlabs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: step.text, voiceId: step.voiceId }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const message =
            typeof errorPayload?.error === "string"
              ? errorPayload.error
              : "Unable to generate speech right now.";
          toast({ type: "error", description: message });
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audio.preload = "auto";
        audioRef.current = audio;

        audio.addEventListener("ended", () => {
          stopAudio();
        });

        audio.addEventListener("error", () => {
          stopAudio();
          toast({ type: "error", description: "Audio playback failed." });
        });

        setLoadingStepId(null);
        setPlayingStepId(step.id);
        await audio.play();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (didTimeout) {
            toast({ type: "error", description: "Speech request timed out." });
          }
          return;
        }
        toast({ type: "error", description: "Unable to generate speech right now." });
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
        }
        clearTimeout(timeoutId);
        setLoadingStepId((current) => (current === step.id ? null : current));
      }
    },
    [playingStepId, stopAudio]
  );

  const handleNext = useCallback(() => {
    if (activeStepIndex >= lastStepIndex) {
      router.push("/brooks-ai-hub/");
      return;
    }

    setActiveStepIndex((previous) =>
      previous < lastStepIndex ? previous + 1 : previous
    );
  }, [activeStepIndex, lastStepIndex, router]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const buttonLabel =
    activeStepIndex >= lastStepIndex ? "Enter Brooks AI HUB" : "Continue";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0a1511] text-white">
      <div className="intro-sky absolute inset-0" />
      <div className="intro-stars absolute inset-0" />
      <div className="intro-mist absolute inset-0" />

      <div className="absolute right-6 top-6 z-20">
        <button
          className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50"
          onClick={() => router.push("/brooks-ai-hub/")}
          type="button"
        >
          Skip tutorial
        </button>
      </div>

      <div className="relative z-10 w-full max-w-6xl px-6 py-12">
        <div className="intro-glass w-full rounded-[32px] px-6 py-8 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-8">
            <header className="space-y-3 text-center">
              <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                /Brooks AI HUB/ tutorial
              </div>
              <h1 className="font-pixel text-[clamp(1.4rem,4vw,2.2rem)] text-white">
                Meet your guides
              </h1>
              <p className="text-sm text-white/70">
                Tap the speaker icons for voice playback, then continue to enter
                the hub.
              </p>
            </header>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section className="flex flex-col gap-4">
                <div className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Guides
                </div>
                <div className="grid gap-4">
                  {tutorialSteps.map((step, index) => {
                    const isActive = index === activeStepIndex;
                    const imageSrc = isActive ? step.talkingSrc : step.idleSrc;

                    return (
                      <div
                        className={cn(
                          "flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm transition",
                          isActive
                            ? "border-emerald-200/60 bg-emerald-200/10 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                            : "opacity-70"
                        )}
                        key={step.id}
                      >
                        <div className="relative h-20 w-16 shrink-0">
                          <Image
                            alt={step.alt}
                            className="h-full w-full object-contain"
                            height={160}
                            priority={isActive}
                            src={imageSrc}
                            width={128}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-white">
                            {step.name}
                          </div>
                          <div className="text-xs text-white/60">{step.title}</div>
                          {isActive ? (
                            <span className="inline-flex rounded-full border border-emerald-200/40 bg-emerald-200/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                              Speaking now
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <div className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Step {activeStepIndex + 1} of {tutorialSteps.length}
                </div>
                <div className="flex flex-col gap-4">
                  {visibleSteps.map((step) => {
                    const isActive = step.id === activeStep.id;
                    const isLoading = loadingStepId === step.id;
                    const isPlaying = playingStepId === step.id;

                    return (
                      <div
                        className={cn(
                          "rounded-2xl border border-white/15 bg-black/30 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm",
                          isActive
                            ? "border-emerald-200/60 bg-emerald-200/10"
                            : "opacity-80"
                        )}
                        key={step.id}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
                              {step.name}
                            </div>
                            <p className="text-sm text-white/90">{step.displayText}</p>
                          </div>
                          <button
                            aria-label={
                              isPlaying
                                ? `Stop ${step.name} voice`
                                : `Play ${step.name} voice`
                            }
                            className={cn(
                              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50",
                              isPlaying ? "bg-emerald-200/30" : ""
                            )}
                            disabled={isLoading}
                            onClick={() => {
                              void handleSpeak(step);
                            }}
                            type="button"
                          >
                            {isLoading ? (
                              <LoaderIcon size={18} />
                            ) : isPlaying ? (
                              <StopIcon size={18} />
                            ) : (
                              <SpeakerIcon size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-white/60">
                Ready to continue? You can replay each voice before moving on.
              </div>
              <button
                className="intro-start-button rounded-full px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.35em] text-[#1b0f0f] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                onClick={handleNext}
                type="button"
              >
                {buttonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
