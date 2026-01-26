"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
      { transform: "translateY(0px)", minWidth: "10.5rem" },
      { transform: "translateY(6px)", minWidth: "9.75rem" },
      { transform: "translateY(-6px)", minWidth: "10rem" },
      { transform: "translateY(10px)", minWidth: "9.5rem" },
      { transform: "translateY(-10px)", minWidth: "10.75rem" },
      { transform: "translateY(4px)", minWidth: "9.25rem" },
      { transform: "translateY(-4px)", minWidth: "10.25rem" },
      { transform: "translateY(8px)", minWidth: "9.75rem" },
      { transform: "translateY(-8px)", minWidth: "10rem" },
    ],
    []
  );

  return (
    <div
      className="relative mx-auto mt-2 flex size-full max-w-xl flex-col items-center justify-center gap-2.5 px-4 py-6 text-center sm:mt-4 sm:max-w-2xl sm:px-6 sm:py-8 md:mt-12 md:px-10 md:py-10"
      key="overview"
    >
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
          Suggested folders
        </div>
        <div className="mt-4 flex w-full flex-wrap justify-center gap-3">
          {suggestedFolders.map((folder, index) => (
            <button
              className="flex h-full rounded-full border border-border bg-muted/30 px-4 py-2 text-xs text-foreground transition hover:bg-muted/50 hover:border-foreground/40 sm:px-4 sm:py-2.5 sm:text-sm"
              key={folder.folder}
              onClick={() => onSelectFolder?.(folder.folder)}
              type="button"
              style={cloudStyles[index % cloudStyles.length]}
            >
              <span className="flex w-full flex-col gap-0.5 text-left leading-tight">
                <span className="text-xs font-semibold sm:text-sm">
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
                <span className="text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground sm:text-[0.65rem]">
                  {folder.folder}
                </span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
