"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface UseSwipeGestureOptions {
  enabled?: boolean;
  threshold?: number;
  edgeZone?: number;
}

export function useSwipeGesture({
  enabled = true,
  threshold = 100,
  edgeZone = 50,
}: UseSwipeGestureOptions = {}) {
  const router = useRouter();
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const isFromEdgeRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      const windowWidth = window.innerWidth;
      const startX = touch.clientX;

      // Check if touch started from right edge
      if (startX > windowWidth - edgeZone) {
        isFromEdgeRef.current = true;
        startXRef.current = startX;
        startYRef.current = touch.clientY;
        isDraggingRef.current = true;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const startX = e.clientX;

      // Check if click started from right edge
      if (startX > windowWidth - edgeZone) {
        isFromEdgeRef.current = true;
        startXRef.current = startX;
        startYRef.current = e.clientY;
        isDraggingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !isFromEdgeRef.current) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // Check if it's a horizontal swipe (not vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -threshold) {
        // Swipe left from right edge - open store
        isDraggingRef.current = false;
        isFromEdgeRef.current = false;
        router.push("/store");
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !isFromEdgeRef.current) {
        return;
      }

      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;

      // Check if it's a horizontal drag (not vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -threshold) {
        // Drag left from right edge - open store
        isDraggingRef.current = false;
        isFromEdgeRef.current = false;
        router.push("/store");
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      isFromEdgeRef.current = false;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isFromEdgeRef.current = false;
    };

    // Add event listeners
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled, threshold, edgeZone, router]);
}
