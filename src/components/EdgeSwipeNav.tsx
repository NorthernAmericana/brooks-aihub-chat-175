"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEventHandler } from "react";

const SWIPE_THRESHOLD_PX = 90;
const NAVIGATION_COOLDOWN_MS = 600;
const PREVIEW_WIDTH_PX = 240;

type HandleConfig = {
  side: "left" | "right";
  href: string;
  ariaLabel: string;
  previewTitle: string;
  previewSubtitle: string;
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const navigatedRef = useRef(false);
  const cooldownTimeoutRef = useRef<number | null>(null);

  const handleConfig = useMemo<HandleConfig | null>(() => {
    if (pathname === "/" || pathname === "/welcome") {
      return {
        side: "left",
        href: "/commons",
        ariaLabel: "Open NAT: Commons",
        previewTitle: "NAT: Commons",
        previewSubtitle: "Swipe right to enter",
      };
    }

    if (pathname?.startsWith("/brooks-ai-hub")) {
      return {
        side: "left",
        href: "/commons",
        ariaLabel: "Open NAT: Commons",
        previewTitle: "NAT: Commons",
        previewSubtitle: "Swipe right to enter",
      };
    }

    if (pathname?.startsWith("/commons")) {
      return {
        side: "right",
        href: "/",
        ariaLabel: "Return to Brooks AI HUB",
        previewTitle: "Brooks AI HUB",
        previewSubtitle: "Swipe left to return",
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
    setDragOffset(0);
    setIsDragging(false);
  }, [handleConfig, router, startCooldown]);

  const resetTracking = useCallback(() => {
    trackingRef.current.isTracking = false;
    trackingRef.current.startX = 0;
    trackingRef.current.startY = 0;
    setDragOffset(0);
    setIsDragging(false);
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
    setIsDragging(true);
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
        return;
      }

      if (handleConfig.side === "right" && dx <= -SWIPE_THRESHOLD_PX) {
        resetTracking();
        navigate();
        return;
      }

      if (handleConfig.side === "left") {
        setDragOffset(Math.min(Math.max(dx, 0), PREVIEW_WIDTH_PX));
        return;
      }

      if (handleConfig.side === "right") {
        setDragOffset(-Math.min(Math.max(-dx, 0), PREVIEW_WIDTH_PX));
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

  const previewStyle =
    handleConfig.side === "left"
      ? {
          transform: `translateX(${dragOffset - PREVIEW_WIDTH_PX}px)`,
          left: "max(0px, env(safe-area-inset-left))",
        }
      : {
          transform: `translateX(${PREVIEW_WIDTH_PX + dragOffset}px)`,
          right: "max(0px, env(safe-area-inset-right))",
        };

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-y-0 z-40 flex w-[240px] flex-col justify-center gap-2 border border-black/10 bg-white/80 px-6 text-slate-900 shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-white ${
          isDragging ? "" : "transition-transform duration-200 ease-out"
        }`}
        style={previewStyle}
      >
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
          Preview
        </div>
        <div className="font-semibold text-lg">{handleConfig.previewTitle}</div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {handleConfig.previewSubtitle}
        </div>
      </div>

      <button
        aria-label={handleConfig.ariaLabel}
        className="fixed top-1/2 z-50 flex h-20 w-5 -translate-y-1/2 touch-pan-y items-center justify-center rounded-full border border-black/10 bg-white/60 shadow-[0_6px_18px_rgba(0,0,0,0.2)] backdrop-blur-sm transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-400/60 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20"
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={positioningStyle}
        type="button"
      >
        <span className="sr-only">{handleConfig.ariaLabel}</span>
        <span className="h-8 w-1 rounded-full bg-slate-400/70 dark:bg-white/70" />
      </button>
    </>
  );
}
