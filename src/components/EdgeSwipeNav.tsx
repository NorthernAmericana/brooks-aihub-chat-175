"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PointerEventHandler } from "react";

const SWIPE_THRESHOLD_PX = 60;
const NAVIGATION_COOLDOWN_MS = 600;

type HandleConfig = {
  side: "left" | "right";
  href: string;
  ariaLabel: string;
};

type TrackingState = {
  isTracking: boolean;
  startX: number;
  startY: number;
};

export function EdgeSwipeNav() {
  const pathname = usePathname();
  const router = useRouter();
  const trackingRef = useRef<TrackingState>({
    isTracking: false,
    startX: 0,
    startY: 0,
  });
  const navigatedRef = useRef(false);
  const cooldownTimeoutRef = useRef<number | null>(null);

  const handleConfig = useMemo<HandleConfig | null>(() => {
    if (pathname === "/") {
      return {
        side: "left",
        href: "/commons",
        ariaLabel: "Open NAT: Commons",
      };
    }

    if (pathname?.startsWith("/commons")) {
      return {
        side: "right",
        href: "/",
        ariaLabel: "Return to Brooks AI HUB",
      };
    }

    return null;
  }, [pathname]);

  const startCooldown = useCallback(() => {
    navigatedRef.current = true;
    if (cooldownTimeoutRef.current) {
      window.clearTimeout(cooldownTimeoutRef.current);
    }
    cooldownTimeoutRef.current = window.setTimeout(() => {
      navigatedRef.current = false;
    }, NAVIGATION_COOLDOWN_MS);
  }, []);

  const navigate = useCallback(() => {
    if (!handleConfig || navigatedRef.current) {
      return;
    }
    startCooldown();
    router.push(handleConfig.href);
  }, [handleConfig, router, startCooldown]);

  const resetTracking = useCallback(() => {
    trackingRef.current.isTracking = false;
    trackingRef.current.startX = 0;
    trackingRef.current.startY = 0;
  }, []);

  const handlePointerDown = useCallback<
    PointerEventHandler<HTMLButtonElement>
  >((event) => {
    if (navigatedRef.current) {
      return;
    }
    trackingRef.current.isTracking = true;
    trackingRef.current.startX = event.clientX;
    trackingRef.current.startY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback<PointerEventHandler<HTMLButtonElement>>(
    (event) => {
      if (!trackingRef.current.isTracking || !handleConfig) {
        return;
      }

      const dx = event.clientX - trackingRef.current.startX;
      const dy = event.clientY - trackingRef.current.startY;

      if (Math.abs(dy) > Math.abs(dx)) {
        resetTracking();
        return;
      }

      if (handleConfig.side === "left" && dx >= SWIPE_THRESHOLD_PX) {
        resetTracking();
        navigate();
      }

      if (handleConfig.side === "right" && dx <= -SWIPE_THRESHOLD_PX) {
        resetTracking();
        navigate();
      }
    },
    [handleConfig, navigate, resetTracking],
  );

  const handlePointerUp = useCallback<PointerEventHandler<HTMLButtonElement>>(
    (event) => {
      resetTracking();
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [resetTracking],
  );

  const handlePointerCancel = useCallback<
    PointerEventHandler<HTMLButtonElement>
  >((event) => {
    resetTracking();
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, [resetTracking]);

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) {
        window.clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  if (!handleConfig) {
    return null;
  }

  const positioningStyle =
    handleConfig.side === "left"
      ? { left: "max(0px, env(safe-area-inset-left))" }
      : { right: "max(0px, env(safe-area-inset-right))" };

  return (
    <button
      aria-label={handleConfig.ariaLabel}
      className="fixed top-1/2 z-50 flex h-16 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/60 text-slate-900/70 shadow-[0_6px_18px_rgba(0,0,0,0.2)] backdrop-blur-sm transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-400/60 dark:border-white/20 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
      onClick={navigate}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={positioningStyle}
      type="button"
    >
      <svg
        aria-hidden
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
      >
        {handleConfig.side === "left" ? (
          <path d="M15 6l-6 6 6 6" />
        ) : (
          <path d="M9 6l6 6-6 6" />
        )}
      </svg>
    </button>
  );
}
