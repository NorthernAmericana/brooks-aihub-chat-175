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
      className="mx-auto mt-4 flex size-full max-w-2xl flex-col items-center justify-center px-4 text-center md:mt-12 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-2xl md:text-3xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <span className="bg-gradient-to-r from-fuchsia-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,200,160,0.45)]">
          /Brooks AI HUB/
        </span>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 text-sm uppercase tracking-[0.2em] text-zinc-500 md:text-base"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        {formattedNow}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 w-full text-sm text-muted-foreground"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Suggested folders
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {suggestedFolders.map((folder) => (
            <button
              className="rounded-full border border-border px-4 py-2 text-base text-foreground transition hover:border-primary/60 hover:text-primary"
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
