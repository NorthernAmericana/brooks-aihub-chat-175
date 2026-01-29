"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { AgeGate } from "@/components/myflowerai/aura/age-gate";

type MoodEffect = {
  id: string;
  label: string;
};

const moodEffects: MoodEffect[] = [
  { id: "relaxed", label: "Relaxed" },
  { id: "creative", label: "Creative" },
  { id: "focused", label: "Focused" },
  { id: "sleepy", label: "Sleepy" },
  { id: "anxious", label: "Anxious" },
  { id: "social", label: "Social" },
] as const;

export default function MyFlowerAiHomePage() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [selectedMoodEffects, setSelectedMoodEffects] = useState<Set<string>>(
    () => new Set()
  );
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCount = selectedMoodEffects.size;

  const usedToday = useMemo(() => {
    return { usedGrams: 3.5, targetGrams: 5.0 } as const;
  }, []);

  const progress = useMemo(() => {
    if (usedToday.targetGrams <= 0) {
      return 0;
    }
    return Math.max(
      0,
      Math.min(1, usedToday.usedGrams / usedToday.targetGrams)
    );
  }, [usedToday]);

  const handleToggleMoodEffect = (id: string) => {
    setSelectedMoodEffects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePickPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return nextUrl;
    });
  };

  return (
    <>
      <AgeGate onVerified={() => setAgeVerified(true)} />
      {ageVerified && (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
          <header className="flex items-center justify-between gap-3 rounded-3xl border border-black/5 bg-white/70 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-pink-100">
                <Image
                  alt="MyFlowerAI icon"
                  className="h-full w-full object-cover"
                  height={44}
                  src="/icons/myflowerai-appicon.png"
                  width={44}
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-black">MyFlowerAI</h1>
                <p className="text-xs text-black/60">
                  Cannabis harm reduction dashboard (placeholder)
                </p>
              </div>
            </div>
            <div className="rounded-full bg-black/5 px-3 py-1 text-xs text-black/70">
              1 strain (mock)
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-2xl font-semibold text-black">
                    {usedToday.usedGrams.toFixed(1)}g{" "}
                    <span className="text-sm font-normal text-black/60">
                      / {usedToday.targetGrams.toFixed(1)}g
                    </span>
                  </div>
                  <div className="text-xs text-black/60">Used today</div>
                </div>
                <div className="text-xs text-black/60">Placeholder limit</div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full bg-white ring-1 ring-black/10">
                  <div
                    className="absolute inset-1 rounded-full bg-[conic-gradient(from_180deg,rgba(236,72,153,0.85)_0,rgba(236,72,153,0.85)_var(--p),rgba(0,0,0,0.06)_var(--p),rgba(0,0,0,0.06)_100%)]"
                    style={{
                      ["--p" as never]: `${(progress * 100).toFixed(0)}%`,
                    }}
                  />
                  <div className="absolute inset-3 rounded-full bg-white ring-1 ring-black/10" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-black/60">Goal pacing</div>
                  <div className="text-sm text-black/80">
                    {Math.round(progress * 100)}% of daily target
                  </div>
                  <div className="text-xs text-black/50">
                    Visualization placeholder
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-black">
                  Strains used
                </h2>
                <div className="text-xs text-black/60">Today</div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3">
                  <div className="text-sm text-black">Purple Haze</div>
                  <div className="text-sm text-black/70">+2g</div>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3">
                  <div className="text-sm text-black">OG Kush</div>
                  <div className="text-sm text-black/70">+1.5g</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-black/50">
                Placeholder — will be generated from your logs.
              </p>
            </section>
          </div>

          <section className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-black">
                Mood & effects
              </h2>
              <div className="text-xs text-black/60">
                {selectedCount} selected
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {moodEffects.map((item) => {
                const isSelected = selectedMoodEffects.has(item.id);
                return (
                  <button
                    className={`rounded-full px-3 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 ${
                      isSelected
                        ? "bg-pink-600 text-white"
                        : "bg-black/5 text-black/80 hover:bg-black/10"
                    }`}
                    key={item.id}
                    onClick={() => handleToggleMoodEffect(item.id)}
                    type="button"
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-black/50">
              Placeholder UI — these tags will help the agent find patterns.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-black">
                Recently logged
              </h2>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-black/5 p-3">
                  <div className="h-14 w-20 rounded-xl bg-black/10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm text-black">
                        Sativa Joint (Purple Haze)
                      </div>
                      <div className="text-xs text-black/60">12:42 PM</div>
                    </div>
                    <div className="mt-1 text-xs text-black/60">
                      THC 22% • CBD 1% • Relaxed, Creative
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-black/5 p-3">
                  <div className="h-14 w-20 rounded-xl bg-black/10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm text-black">
                        Edible gummy (Indica)
                      </div>
                      <div className="text-xs text-black/60">9:10 PM</div>
                    </div>
                    <div className="mt-1 text-xs text-black/60">
                      Dose + method placeholder
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-black">
                Photo check-in (placeholder)
              </h2>
              <p className="mt-2 text-sm text-black/70">
                Add a photo of your cannabis or how you’re consuming (joint,
                bowl, vape, edible packaging) to help the agent contextualize
                your logs.
              </p>

              <div className="mt-4">
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  className="w-full rounded-full bg-pink-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                  onClick={handlePickPhoto}
                  type="button"
                >
                  Take/upload a photo
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
                {photoPreviewUrl ? (
                  <div className="relative aspect-[16/10]">
                    <Image
                      alt="Selected photo preview"
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, 512px"
                      src={photoPreviewUrl}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center text-sm text-black/50">
                    No photo selected
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-black/50">
                Placeholder — image analysis + harm-reduction prompts coming
                soon.
              </p>
            </section>
          </div>

          <section className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-black">
              AI insights & feedback
            </h2>
            <p className="mt-2 text-sm text-black/70">
              Agentic feedback placeholder: Your daytime sativa sessions
              correlate with higher “creative” tags. Consider a lighter dose
              later in the day if sleep quality dips.
            </p>
            <p className="mt-3 text-xs text-black/50">
              Informational only. Not medical advice.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
