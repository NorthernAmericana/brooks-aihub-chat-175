"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeEdgeHintProps {
  side: "left" | "right";
  open: boolean;
  title?: string;
  message: string;
  durationMs?: number;
}

export function SwipeEdgeHint({
  side,
  open,
  title,
  message,
}: SwipeEdgeHintProps) {
  const isLeft = side === "left";

  return (
    <div className="pointer-events-none fixed inset-y-0 z-[90] overflow-hidden">
      <div
        className={cn(
          "absolute inset-y-0 w-1/2 max-w-md border-white/10 bg-black/50 px-5 py-8 text-white backdrop-blur-md",
          isLeft ? "left-0 border-r" : "right-0 border-l",
          "transition-[transform,opacity] duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-opacity motion-reduce:duration-75",
          open
            ? "translate-x-0 opacity-100"
            : isLeft
              ? "-translate-x-full opacity-0"
              : "translate-x-full opacity-0",
        )}
      >
        <div className={cn("flex items-start gap-3", isLeft ? "flex-row" : "flex-row-reverse")}>
          {isLeft ? (
            <ArrowRight aria-hidden className="mt-0.5 size-5 shrink-0 text-white/90" />
          ) : (
            <ArrowLeft aria-hidden className="mt-0.5 size-5 shrink-0 text-white/90" />
          )}
          <div className={cn("space-y-2", isLeft ? "text-left" : "text-right")}>
            {title ? (
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/70">
                {title}
              </p>
            ) : null}
            <p className="text-sm leading-relaxed text-white/95">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
