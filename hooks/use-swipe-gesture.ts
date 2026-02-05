"use client";

import { useEffect, useRef } from "react";

interface UseSwipeGestureOptions {
  enabled?: boolean;
  threshold?: number;
  edgeZone?: number;
  onSwipeLeftFromRightEdge?: () => void;
  onSwipeRightFromLeftEdge?: () => void;
}

export function useSwipeGesture({
  enabled = true,
  threshold = 100,
  edgeZone = 50,
  onSwipeLeftFromRightEdge,
  onSwipeRightFromLeftEdge,
}: UseSwipeGestureOptions = {}) {
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const activeEdgeRef = useRef<"left" | "right" | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const startGesture = (startX: number, startY: number) => {
      const windowWidth = window.innerWidth;
      const isFromLeftEdge = startX < edgeZone;
      if (startX > windowWidth - edgeZone) {
        activeEdgeRef.current = "right";
      } else if (isFromLeftEdge) {
        activeEdgeRef.current = "left";
      } else {
        activeEdgeRef.current = null;
      }

      if (activeEdgeRef.current) {
        startXRef.current = startX;
        startYRef.current = startY;
        isDraggingRef.current = true;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      startGesture(touch.clientX, touch.clientY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      startGesture(e.clientX, e.clientY);
    };

    const maybeTriggerSwipe = (currentX: number, currentY: number) => {
      if (!isDraggingRef.current || !activeEdgeRef.current) {
        return;
      }

      const deltaX = currentX - startXRef.current;
      const deltaY = currentY - startYRef.current;

      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }

      if (activeEdgeRef.current === "right" && deltaX < -threshold) {
        isDraggingRef.current = false;
        activeEdgeRef.current = null;
        onSwipeLeftFromRightEdge?.();
      }

      if (activeEdgeRef.current === "left" && deltaX > threshold) {
        isDraggingRef.current = false;
        activeEdgeRef.current = null;
        onSwipeRightFromLeftEdge?.();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !activeEdgeRef.current) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      maybeTriggerSwipe(touch.clientX, touch.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !activeEdgeRef.current) {
        return;
      }

      maybeTriggerSwipe(e.clientX, e.clientY);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      activeEdgeRef.current = null;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      activeEdgeRef.current = null;
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
  }, [
    edgeZone,
    enabled,
    onSwipeLeftFromRightEdge,
    onSwipeRightFromLeftEdge,
    threshold,
  ]);
}
