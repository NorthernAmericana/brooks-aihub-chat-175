"use client";

import { useRouter } from "next/navigation";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";

export function SwipeGestureProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useSwipeGesture({
    edgeZone: 50,
    enabled: true,
    onSwipeLeftFromRightEdge: () => router.push("/store"),
    threshold: 100,
  });

  return <>{children}</>;
}
