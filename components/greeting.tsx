"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { listAgentConfigs } from "@/lib/ai/agents/registry";

export const Greeting = () => {
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
      .map((agent) => `/${agent.slash}/`);
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
      className="woodsy-base soft-vignette neon-outline relative mx-auto mt-4 flex size-full max-w-2xl flex-col items-center justify-center gap-3 rounded-3xl border-2 border-transparent px-5 py-8 text-center sm:px-6 sm:py-10 md:mt-12 md:px-10 md:py-12"
      key="overview"
    >
      <div className="retro-rainbow-border pointer-events-none absolute inset-0 rounded-3xl" />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-balance font-semibold text-2xl leading-tight md:text-3xl"
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
        className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-200/80 md:text-sm"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        {formattedNow}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 w-full text-sm leading-relaxed text-zinc-100/80 md:mt-6"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-[0.6rem] uppercase tracking-[0.2em] text-zinc-200/70 md:text-xs">
          Suggested folders
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {suggestedFolders.map((folder) => (
            <button
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-white/40 hover:text-white sm:text-base"
              key={folder}
              type="button"
            >
              {folder}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
