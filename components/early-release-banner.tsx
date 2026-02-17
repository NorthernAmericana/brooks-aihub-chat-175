"use client";

import {
  EARLY_RELEASE_START_AT,
  EARLY_RELEASE_TIMEZONE,
  FOUNDERS_PRICE_USD,
  getCountdownParts,
  isEarlyRelease,
} from "@/lib/launch-config";

type EarlyReleaseBannerProps = {
  className?: string;
  compact?: boolean;
};

export function EarlyReleaseBanner({
  className = "",
  compact = false,
}: EarlyReleaseBannerProps) {
  const launchLive = isEarlyRelease();
  const countdown = getCountdownParts();
  const launchDateLabel = EARLY_RELEASE_START_AT.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: EARLY_RELEASE_TIMEZONE,
  });

  return (
    <div
      className={`rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm text-emerald-50 ${className}`}
    >
      <p className="font-semibold uppercase tracking-[0.2em] text-emerald-100/80">
        Early Release
      </p>
      {launchLive ? (
        <p className="mt-2">
          Early Release is LIVE — Founders Access ${FOUNDERS_PRICE_USD.toFixed(2)}
          /mo.
        </p>
      ) : (
        <>
          <p className="mt-2">
            Early Release launches {launchDateLabel} — Founders Access is the
            only paid plan (${FOUNDERS_PRICE_USD.toFixed(2)}/mo).
          </p>
          <p className="mt-1 text-xs text-emerald-100/80">
            Countdown: {countdown.days}d {countdown.hours}h {countdown.minutes}m
          </p>
        </>
      )}
      {!compact && (
        <p className="mt-2 text-xs text-emerald-100/80">
          Included now: Founders-gated routes and current plan limits only.
          Voice/STT/TTS features remain experimental and are not a guaranteed
          launch promise.
        </p>
      )}
    </div>
  );
}
