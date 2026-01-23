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
    const desired = new Set([
      "BrooksBears",
      "MyCarMindATO",
      "MyFlowerAI",
      "NAMC",
    ]);

    return listAgentConfigs()
      .filter((agent) => desired.has(agent.slash))
      .map((agent) => ({
        label: agent.label,
        slash: agent.slash,
        folder: `/${agent.slash}/`,
      }));
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

  return (
    <div
      className="woodsy-base soft-vignette neon-outline relative mx-auto mt-2 flex size-full max-w-xl flex-col items-center justify-center gap-2.5 rounded-3xl border-2 border-transparent px-4 py-6 text-center sm:mt-4 sm:max-w-2xl sm:px-6 sm:py-8 md:mt-12 md:px-10 md:py-10"
      key="overview"
    >
      <div className="retro-rainbow-border pointer-events-none absolute inset-0 rounded-3xl" />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-balance font-semibold text-xl leading-tight sm:text-2xl md:text-3xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <span className="font-pixel retro-rainbow-text pixel-text-shadow drop-shadow-[0_0_12px_rgba(0,0,0,0.45)]">
          /Brooks AI HUB/
        </span>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-zinc-200/80 sm:text-xs md:text-sm"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        {formattedNow}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 w-full text-xs leading-relaxed text-zinc-100/80 sm:text-sm md:mt-5"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-[0.55rem] uppercase tracking-[0.2em] text-zinc-200/70 sm:text-[0.6rem] md:text-xs">
          Suggested folders
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {suggestedFolders.map((folder) => (
            <button
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:border-white/40 hover:text-white sm:px-4 sm:py-2 sm:text-sm md:text-base"
              key={folder.folder}
              onClick={() => onSelectFolder?.(folder.folder)}
              type="button"
            >
              <span className="flex flex-col gap-0.5 text-left leading-tight">
                <span className="text-xs font-semibold sm:text-sm md:text-base">
                  {folder.label}
                </span>
                <span className="text-[0.6rem] uppercase tracking-[0.15em] text-white/70 sm:text-[0.65rem] md:text-xs">
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
