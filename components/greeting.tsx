"use client";

import { motion, motionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { listAgentConfigs } from "@/lib/ai/agents/registry";

type GreetingProps = {
  onSelectFolder?: (folder: string) => void;
};

export const Greeting = ({ onSelectFolder }: GreetingProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const suggestedFolders = useMemo(() => {
    const desiredOrder = [
      { slash: "Brooks AI HUB", foundersOnly: false },
      { slash: "BrooksBears", foundersOnly: false },
      { slash: "BrooksBears/BenjaminBear", foundersOnly: true },
      { slash: "MyCarMindATO", foundersOnly: false },
      { slash: "MyFlowerAI", foundersOnly: false },
      { slash: "Brooks AI HUB/Summaries", foundersOnly: true },
      { slash: "NAT", foundersOnly: false },
      { slash: "NAMC", foundersOnly: false },
    ];

    const agentBySlash = new Map(
      listAgentConfigs().map((agent) => [agent.slash, agent])
    );
    const labelOverrides: Record<string, string> = {
      NAT: "Northern Americana Tech Agent",
    };

    return desiredOrder
      .map((entry) => {
        const agent = agentBySlash.get(entry.slash);
        if (!agent) {
          return null;
        }

        return {
          label: labelOverrides[agent.slash] ?? agent.label,
          slash: agent.slash,
          folder: `/${agent.slash}/`,
          foundersOnly: entry.foundersOnly,
        };
      })
      .filter(
        (
          folder
        ): folder is {
          label: string;
          slash: string;
          folder: string;
          foundersOnly: boolean;
        } => Boolean(folder)
      );
  }, []);

  const formattedNow = useMemo(
    () =>
      now.toLocaleString(undefined, {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
      }),
    [now]
  );

  const cloudStyles = useMemo(
    () => [
      { offsetY: 0, minWidth: "clamp(7.5rem, 38vw, 10.5rem)" },
      { offsetY: 6, minWidth: "clamp(7.25rem, 36vw, 9.75rem)" },
      { offsetY: -6, minWidth: "clamp(7.25rem, 37vw, 10rem)" },
      { offsetY: 10, minWidth: "clamp(7rem, 35vw, 9.5rem)" },
      { offsetY: -10, minWidth: "clamp(7.5rem, 40vw, 10.75rem)" },
      { offsetY: 4, minWidth: "clamp(7rem, 34vw, 9.25rem)" },
      { offsetY: -4, minWidth: "clamp(7.25rem, 36vw, 10.25rem)" },
      { offsetY: 8, minWidth: "clamp(7.25rem, 36vw, 9.75rem)" },
      { offsetY: -8, minWidth: "clamp(7.25rem, 37vw, 10rem)" },
    ],
    []
  );

  const cloudLayerRef = useRef<HTMLDivElement | null>(null);
  const cloudRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const cloudMotionValues = useMemo(
    () =>
      suggestedFolders.map((_, index) => {
        const style = cloudStyles[index % cloudStyles.length];
        return {
          x: motionValue(0),
          y: motionValue(style.offsetY),
        };
      }),
    [cloudStyles, suggestedFolders]
  );

  const clampCloudToLayer = (index: number) => {
    const cloud = cloudRefs.current[index];
    const layer = cloudLayerRef.current;
    if (!cloud || !layer) {
      return;
    }

    const layerRect = layer.getBoundingClientRect();
    const cloudRect = cloud.getBoundingClientRect();
    const motionValues = cloudMotionValues[index];
    let nextX = motionValues.x.get();
    let nextY = motionValues.y.get();

    const padding = 8;
    const leftLimit = layerRect.left + padding;
    const rightLimit = layerRect.right - padding;
    const topLimit = layerRect.top + padding;
    const bottomLimit = layerRect.bottom - padding;

    if (cloudRect.left < leftLimit) {
      nextX += leftLimit - cloudRect.left;
    }
    if (cloudRect.right > rightLimit) {
      nextX -= cloudRect.right - rightLimit;
    }
    if (cloudRect.top < topLimit) {
      nextY += topLimit - cloudRect.top;
    }
    if (cloudRect.bottom > bottomLimit) {
      nextY -= cloudRect.bottom - bottomLimit;
    }

    motionValues.x.set(nextX);
    motionValues.y.set(nextY);
  };

  useEffect(() => {
    const handleResize = () => {
      cloudMotionValues.forEach((_, index) => clampCloudToLayer(index));
    };

    const resizeTimer = window.setTimeout(handleResize, 120);
    window.addEventListener("resize", handleResize);
    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [cloudMotionValues]);

  const bumpOverlappingClouds = (activeIndex: number) => {
    const activeCloud = cloudRefs.current[activeIndex];
    if (!activeCloud) {
      return;
    }

    const activeRect = activeCloud.getBoundingClientRect();
    const activeCenterX = activeRect.left + activeRect.width / 2;
    const activeCenterY = activeRect.top + activeRect.height / 2;
    const bumpDistance = 18;
    const maxOffset = 120;

    cloudRefs.current.forEach((cloud, index) => {
      if (!cloud || index === activeIndex) {
        return;
      }

      const rect = cloud.getBoundingClientRect();
      const isOverlapping =
        activeRect.left < rect.right &&
        activeRect.right > rect.left &&
        activeRect.top < rect.bottom &&
        activeRect.bottom > rect.top;

      if (!isOverlapping) {
        return;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const directionX = activeCenterX >= centerX ? -1 : 1;
      const directionY = activeCenterY >= centerY ? -1 : 1;
      const motionValues = cloudMotionValues[index];

      const nextX = Math.min(
        maxOffset,
        Math.max(-maxOffset, motionValues.x.get() + directionX * bumpDistance)
      );
      const nextY = Math.min(
        maxOffset,
        Math.max(-maxOffset, motionValues.y.get() + directionY * bumpDistance)
      );

      motionValues.x.set(nextX);
      motionValues.y.set(nextY);
      clampCloudToLayer(index);
    });
  };

  return (
    <div
      className="relative mx-auto mt-2 flex min-h-[60svh] w-full items-center justify-center px-4 py-6 sm:mt-4 sm:min-h-[65svh] sm:px-6 sm:py-8 md:mt-12 md:min-h-[70svh] md:px-10 md:py-10"
      key="overview"
    >
      <div
        className="pointer-events-auto absolute inset-0 z-0 flex w-full flex-wrap content-center justify-center gap-3 overflow-hidden px-3 py-4 sm:px-6 sm:py-6"
        ref={cloudLayerRef}
      >
        {suggestedFolders.map((folder, index) => {
          const style = cloudStyles[index % cloudStyles.length];
          const motionValues = cloudMotionValues[index];

          return (
            <motion.button
              className="cloud-button flex h-full max-w-[46vw] px-3 py-2 text-[0.65rem] text-foreground transition hover:bg-muted/50 hover:border-foreground/40 sm:max-w-none sm:px-4 sm:py-2.5 sm:text-sm"
              drag
              dragConstraints={cloudLayerRef}
              dragElastic={0.08}
              dragMomentum={false}
              key={folder.folder}
              onClick={() => onSelectFolder?.(folder.folder)}
              onDrag={() => {
                bumpOverlappingClouds(index);
                clampCloudToLayer(index);
              }}
              onDragEnd={() => {
                bumpOverlappingClouds(index);
                clampCloudToLayer(index);
              }}
              ref={(node) => {
                cloudRefs.current[index] = node;
              }}
              style={{
                minWidth: style.minWidth,
                x: motionValues.x,
                y: motionValues.y,
              }}
              type="button"
            >
              <span className="flex w-full flex-col gap-0.5 text-left leading-tight">
                <span className="text-xs font-medium leading-snug sm:text-sm">
                  {folder.label}
                  {folder.foundersOnly ? (
                    <span
                      aria-label="Founders access only"
                      className="ml-1 inline-flex align-middle text-sm"
                      title="Founders access only"
                    >
                      💎
                    </span>
                  ) : null}
                </span>
                <span className="text-[0.6rem] uppercase leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-[0.65rem]">
                  {folder.folder}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center gap-2.5 text-center pointer-events-none sm:max-w-2xl">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-balance font-semibold text-xl leading-tight text-foreground sm:text-2xl md:text-3xl"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5 }}
        >
          <span className="font-pixel">/Brooks AI HUB/</span>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs md:text-sm"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.6 }}
        >
          {formattedNow}
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 w-full text-xs leading-relaxed sm:text-sm md:mt-5"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-[0.6rem] md:text-xs">
            all ATO App Folder Clouds
          </div>
        </motion.div>
      </div>
    </div>
  );
};
