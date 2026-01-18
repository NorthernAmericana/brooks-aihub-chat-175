"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size: number;
  className?: string;
};

export function BrandLogo({ size, className }: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center rounded-md bg-muted text-muted-foreground",
          className,
        )}
        style={{ height: size, width: size }}
      >
        <span className="text-[0.55rem] font-semibold">BAH</span>
      </div>
    );
  }

  return (
    <Image
      alt="Brooks AI HUB logo"
      className={cn("object-contain", className)}
      height={size}
      onError={() => setHasError(true)}
      src="/brand/brooks-ai-hub-logo.png"
      width={size}
    />
  );
}
