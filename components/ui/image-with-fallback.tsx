"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type ImageWithFallbackProps = ImageProps & {
  containerClassName?: string;
  fallbackClassName?: string;
};

export function ImageWithFallback({
  containerClassName,
  fallbackClassName,
  className,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [hasImage, setHasImage] = useState(true);

  const handleError: NonNullable<ImageProps["onError"]> = (event) => {
    setHasImage(false);
    onError?.(event);
  };

  const { fill, width, height, ...imageProps } = props;
  const shouldUseIntrinsicSize = !fill && !containerClassName;

  return (
    <div
      className={cn("relative", containerClassName)}
      style={shouldUseIntrinsicSize ? { width, height } : undefined}
    >
      {hasImage ? (
        <Image
          {...imageProps}
          fill={fill}
          width={width}
          height={height}
          className={className}
          onError={handleError}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 rounded-[inherit] bg-gradient-to-br from-slate-900/70 via-slate-700/40 to-slate-500/30",
            fallbackClassName,
          )}
        />
      )}
    </div>
  );
}
