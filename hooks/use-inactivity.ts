"use client";

import { useEffect, useRef, useState } from "react";

interface UseInactivityResult {
  isIdle: boolean;
  lastActiveAt: number;
}

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "pointerdown",
  "touchstart",
  "keydown",
  "scroll",
  "wheel",
  "focus",
];

export function useInactivity(idleMs = 60_000): UseInactivityResult {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActiveAt, setLastActiveAt] = useState(() => Date.now());
  const timeoutRef = useRef<number | null>(null);
  const idleDeadlineRef = useRef<number>(Date.now() + idleMs);

  useEffect(() => {
    const clearIdleTimeout = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const shouldTrack = () =>
      document.visibilityState === "visible" && document.hasFocus();

    const scheduleIdleTimeout = () => {
      clearIdleTimeout();

      if (!shouldTrack()) {
        return;
      }

      const remainingMs = Math.max(0, idleDeadlineRef.current - Date.now());
      timeoutRef.current = window.setTimeout(() => {
        if (shouldTrack()) {
          setIsIdle(true);
        }
      }, remainingMs);
    };

    const markActive = () => {
      idleDeadlineRef.current = Date.now() + idleMs;
      setLastActiveAt(Date.now());
      setIsIdle(false);
      scheduleIdleTimeout();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        clearIdleTimeout();
        return;
      }

      markActive();
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActive, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    scheduleIdleTimeout();

    return () => {
      clearIdleTimeout();
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActive);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [idleMs]);

  return { isIdle, lastActiveAt };
}
