"use client";

import { cn } from "@/lib/utils";

export type ChatSwipeMenuItem = {
  id: string;
  label: string;
};

export function ChatSwipeMenu({
  activeItemId,
  items,
  onChange,
  className,
}: {
  activeItemId: string | null;
  items: ChatSwipeMenuItem[];
  onChange: (id: string | null) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center",
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.id === activeItemId;
        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              isActive
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:border-border"
            )}
            key={item.id}
            onClick={() => onChange(isActive ? null : item.id)}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
