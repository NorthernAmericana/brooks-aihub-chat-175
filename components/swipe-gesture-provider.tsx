"use client";

import { useSwipeGesture } from "@/hooks/use-swipe-gesture";

export function SwipeGestureProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useSwipeGesture({ enabled: true, threshold: 100, edgeZone: 50 });
  return <>{children}</>;
}
