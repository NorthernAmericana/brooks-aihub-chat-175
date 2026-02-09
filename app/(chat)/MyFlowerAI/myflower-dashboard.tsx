"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AgeGate } from "@/components/myflowerai/aura/age-gate";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import type { MyFlowerDaySummary } from "./types";

type MoodEffect = {
  id: string;
  label: string;
};

type QuickAddOption = {
  id: string;
  label: string;
  amountG: number;
  productType: "flower" | "vape" | "edible" | "tincture" | "concentrate" | "topical" | "other";
  notes: string;
};

type MyFlowerAiDashboardProps = {
  date: string;
  initialDay: MyFlowerDaySummary | null;
  authRequired: boolean;
  errorMessage: string | null;
};

const moodEffects: MoodEffect[] = [
  { id: "relaxed", label: "Relaxed" },
  { id: "creative", label: "Creative" },
  { id: "focused", label: "Focused" },
  { id: "sleepy", label: "Sleepy" },
  { id: "anxious", label: "Anxious" },
  { id: "social", label: "Social" },
] as const;

const quickAddOptions: QuickAddOption[] = [
  {
    id: "joint-05",
    label: "+0.5g joint",
    amountG: 0.5,
    productType: "flower",
    notes: "Quick add: joint",
  },
  {
    id: "preroll-10",
    label: "+1.0g pre-roll",
    amountG: 1.0,
    productType: "flower",
    notes: "Quick add: pre-roll",
  },
  {
    id: "bowl-01",
    label: "+0.1g bowl",
    amountG: 0.1,
    productType: "flower",
    notes: "Quick add: bowl",
  },
];

const productTypes: QuickAddOption["productType"][] = [
  "flower",
  "vape",
  "edible",
  "tincture",
  "concentrate",
  "topical",
  "other",
];

const formatProductType = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }
  return parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

export function MyFlowerAiDashboard({
  date,
  initialDay,
  authRequired,
  errorMessage,
}: MyFlowerAiDashboardProps) {
  const [ageVerified, setAgeVerified] = useState(false);
  const [selectedMoodEffects, setSelectedMoodEffects] = useState<Set<string>>(
    () => new Set()
  );
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [shareToCommons, setShareToCommons] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [entryProductType, setEntryProductType] = useState<
    QuickAddOption["productType"]
  >("flower");
  const [entryAmountG, setEntryAmountG] = useState("");
  const [entryStrainName, setEntryStrainName] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [daySummary, setDaySummary] = useState<MyFlowerDaySummary | null>(
    initialDay
  );
  const [authRequiredState, setAuthRequiredState] = useState(authRequired);
  const [errorState, setErrorState] = useState(errorMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCount = selectedMoodEffects.size;
  const usedGrams = daySummary?.totals.total_g ?? 0;
  const targetGrams = daySummary?.goal?.target_g ?? 0;
  const logs = daySummary?.logs ?? [];
  const strainsUsed = daySummary?.strains_used ?? [];

  const progress = useMemo(() => {
    if (targetGrams <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(1, usedGrams / targetGrams));
  }, [targetGrams, usedGrams]);

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

    setPhotoFile(file);
    const nextUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return nextUrl;
    });
  };

  const refreshDaySummary = async () => {
    const response = await fetch(`/api/myflower/day?date=${date}`);
    if (response.status === 401) {
      setAuthRequiredState(true);
      setErrorState(null);
      return;
    }
    if (!response.ok) {
      setErrorState("Unable to refresh daily totals.");
      return;
    }
    const data = (await response.json()) as MyFlowerDaySummary;
    setDaySummary(data);
    setErrorState(null);
  };

  const handleQuickAdd = async (option: QuickAddOption) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch("/api/myflower/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurred_at: new Date().toISOString(),
          product_type: option.productType,
          amount_g: option.amountG,
          notes: option.notes,
        }),
      });

      if (response.status === 401) {
        setAuthRequiredState(true);
        setActionError("Please sign in to log entries.");
        return;
      }

      if (!response.ok) {
        setActionError("We couldn't save that entry. Try again.");
        return;
      }

      await refreshDaySummary();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetEntryForm = () => {
    setEntryAmountG("");
    setEntryStrainName("");
    setEntryNotes("");
    setShareToCommons(false);
    setPhotoFile(null);
    setPhotoPreviewUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return null;
    });
  };

  const handleCloseEntry = () => {
    setIsAddEntryOpen(false);
    setActionError(null);
    resetEntryForm();
  };

  const handleSubmitEntry = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      let photoAssetId: string | null = null;

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);

        const uploadResponse = await fetch("/api/myflower/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.status === 401) {
          setAuthRequiredState(true);
          setActionError("Please sign in to upload photos.");
          return;
        }

        if (!uploadResponse.ok) {
          setActionError("We couldn't upload that photo. Try again.");
          return;
        }

        const uploadData = (await uploadResponse.json()) as {
          asset_id?: string;
        };
        photoAssetId = uploadData.asset_id ?? null;
      }

      const response = await fetch("/api/myflower/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurred_at: new Date().toISOString(),
          product_type: entryProductType,
          amount_g: entryAmountG ? Number(entryAmountG) : null,
          strain_name: entryStrainName.trim() || null,
          notes: entryNotes.trim() || null,
          photo_asset_id: photoAssetId,
          share_to_commons: shareToCommons,
        }),
      });

      if (response.status === 401) {
        setAuthRequiredState(true);
        setActionError("Please sign in to log entries.");
        return;
      }

      if (!response.ok) {
        setActionError("We couldn't save that entry. Try again.");
        return;
      }

      resetEntryForm();
      setIsAddEntryOpen(false);

      await refreshDaySummary();
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAuthMessage = authRequiredState;
  const showEmptyLogs = !showAuthMessage && logs.length === 0;

  return (
    <>
      <AgeGate onVerified={() => setAgeVerified(true)} />
      {ageVerified && (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
          <header className="flex items-center justify-between gap-3 rounded-3xl border border-black/5 bg-white/70 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-pink-100">
                <ImageWithFallback
                  alt="MyFlowerAI icon"
                  className="h-full w-full object-cover"
                  containerClassName="size-full"
                  height={44}
                  src="/icons/myflowerai-appicon.png"
                  width={44}
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-black">MyFlowerAI</h1>
                <p className="text-xs text-black/60">
                  Cannabis harm reduction dashboard
                </p>
              </div>
            </div>
            <div className="rounded-full bg-black/5 px-3 py-1 text-xs text-black/70">
              {strainsUsed.length} strain{strainsUsed.length === 1 ? "" : "s"}
            </div>
          </header>

          <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-black">
                Strain library
              </h2>
              <p className="text-xs text-black/60">
                Search the MyFlowerAI catalog of indexed strains.
              </p>
            </div>
            <Link
              className="rounded-full bg-pink-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-pink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
              href="/MyFlowerAI/strain-library"
            >
              Open library
            </Link>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-2xl font-semibold text-black">
                    {usedGrams.toFixed(1)}g{" "}
                    <span className="text-sm font-normal text-black/60">
                      {targetGrams > 0
                        ? `/ ${targetGrams.toFixed(1)}g`
                        : ""}
                    </span>
                  </div>
                  <div className="text-xs text-black/60">Used today</div>
                </div>
                <div className="text-xs text-black/60">
                  {targetGrams > 0 ? "Daily goal" : "No goal set"}
                </div>
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
                    {targetGrams > 0
                      ? `${Math.round(progress * 100)}% of daily target`
                      : "Add a target to track progress"}
                  </div>
                  <div className="text-xs text-black/50">
                    {daySummary?.totals.count ?? 0} entries logged
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Quick add
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAddOptions.map((option) => (
                    <button
                      className="rounded-full bg-black/5 px-3 py-2 text-xs font-semibold text-black/80 transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting || showAuthMessage}
                      key={option.id}
                      onClick={() => handleQuickAdd(option)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {actionError && (
                  <p className="text-xs text-red-600">{actionError}</p>
                )}
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
                {strainsUsed.length > 0 ? (
                  strainsUsed.map((strain) => (
                    <div
                      className="flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3"
                      key={strain.display_name}
                    >
                      <div className="text-sm text-black">
                        {strain.display_name}
                      </div>
                      <div className="text-sm text-black/70">
                        +{strain.total_g.toFixed(1)}g
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-black/5 px-4 py-3 text-sm text-black/60">
                    No strains logged yet today.
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-black/50">
                Totals are grouped from today&apos;s logs.
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
                Today&apos;s entries
              </h2>
              {showAuthMessage && (
                <p className="mt-3 text-sm text-black/60">
                  Sign in to view your entries and daily totals.
                </p>
              )}
              {errorState && !showAuthMessage && (
                <p className="mt-3 text-sm text-red-600">{errorState}</p>
              )}
              {showEmptyLogs && (
                <p className="mt-3 text-sm text-black/60">
                  No entries yet today. Use quick add to log a session.
                </p>
              )}
              {!showAuthMessage && logs.length > 0 && (
                <div className="mt-3 space-y-3">
                  {logs.map((log) => (
                    <div
                      className="flex items-center gap-3 rounded-2xl bg-black/5 p-3"
                      key={log.id}
                    >
                      <div className="relative h-14 w-20 overflow-hidden rounded-xl bg-black/10">
                        {log.photo_url ? (
                          <ImageWithFallback
                            alt={`${log.display.strain_name} thumbnail`}
                            className="object-cover"
                            containerClassName="size-full"
                            fill
                            sizes="80px"
                            src={log.photo_url}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-black/40">
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm text-black">
                            {log.display.strain_name} ·{" "}
                            {formatProductType(log.product_type)}
                          </div>
                          <div className="text-xs text-black/60">
                            {formatTime(log.occurred_at)}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-black/60">
                          {log.display.amount ?? "Amount not logged"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-black">Add entry</h2>
              <p className="mt-2 text-sm text-black/70">
                Log a session with optional photos so MyFlowerAI can keep your
                journal organized.
              </p>
              <p className="mt-3 text-xs text-black/50">
                Don’t post personal info in photos.
              </p>
              <div className="mt-4">
                <button
                  className="w-full rounded-full bg-pink-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                  onClick={() => {
                    setActionError(null);
                    setIsAddEntryOpen(true);
                  }}
                  type="button"
                >
                  Add entry
                </button>
              </div>
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

      {isAddEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-black">
                  Add a MyFlowerAI entry
                </h3>
                <p className="mt-1 text-xs text-black/60">
                  Capture your session details and optional photo.
                </p>
              </div>
              <button
                className="rounded-full bg-black/5 px-3 py-1 text-xs text-black/60"
                onClick={handleCloseEntry}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-black/50">
                Product type
                <select
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                  onChange={(event) =>
                    setEntryProductType(
                      event.target.value as QuickAddOption["productType"]
                    )
                  }
                  value={entryProductType}
                >
                  {productTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatProductType(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-black/50">
                Amount (g)
                <input
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                  min="0"
                  onChange={(event) => setEntryAmountG(event.target.value)}
                  placeholder="0.5"
                  step="0.1"
                  type="number"
                  value={entryAmountG}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-black/50">
                Strain name
                <input
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                  onChange={(event) => setEntryStrainName(event.target.value)}
                  placeholder="e.g., Blue Dream"
                  type="text"
                  value={entryStrainName}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-black/50">
                Notes
                <textarea
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                  onChange={(event) => setEntryNotes(event.target.value)}
                  placeholder="How did it feel?"
                  rows={3}
                  value={entryNotes}
                />
              </label>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-black/50">
                  <span>Photo</span>
                  {photoFile && (
                    <span className="text-black/60">{photoFile.name}</span>
                  )}
                </div>
                <input
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handlePhotoChange}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  className="mt-2 w-full rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black/70 transition hover:bg-black/5"
                  onClick={handlePickPhoto}
                  type="button"
                >
                  Take/upload a photo
                </button>
                <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-white">
                  {photoPreviewUrl ? (
                    <div className="relative aspect-[16/10]">
                      <ImageWithFallback
                        alt="Selected photo preview"
                        className="object-cover"
                        containerClassName="size-full"
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
                <p className="mt-2 text-xs text-black/50">
                  Don’t post personal info in photos.
                </p>
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm text-black/80">
                <span>
                  Share to NAT: Commons
                  <span className="mt-1 block text-xs text-black/50">
                    Create a public post for community research.
                  </span>
                </span>
                <input
                  checked={shareToCommons}
                  className="h-4 w-4"
                  onChange={(event) => setShareToCommons(event.target.checked)}
                  type="checkbox"
                />
              </label>

              {actionError && (
                <p className="text-xs text-red-600">{actionError}</p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black/70 transition hover:bg-black/5"
                  onClick={handleCloseEntry}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  onClick={handleSubmitEntry}
                  type="button"
                >
                  {isSubmitting ? "Saving..." : "Save entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
