"use client";

import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { listAgentConfigs } from "@/lib/ai/agents/registry";
import { getStoredSlashActions, normalizeSlash } from "@/lib/suggested-actions";

export function SlashSuggestions({
  onSelect,
  onClose,
}: {
  onSelect: (slash: string) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const agentConfigs = useMemo(() => listAgentConfigs(), []);
  const recentActions = useMemo(() => getStoredSlashActions(), []);

  const filteredSuggestions = useMemo(() => {
    const query = normalizeSlash(searchQuery);

    // Get unique agents from recent actions
    const recentAgentIds = new Set(
      recentActions.map((action) => {
        const normalized = normalizeSlash(action.slash);
        const agent = agentConfigs.find(
          (a) => normalizeSlash(a.slash) === normalized
        );
        return agent?.id;
      })
    );

    // Filter agents
    const filtered = agentConfigs
      .filter((agent) => agent.id !== "default")
      .filter((agent) => {
        if (!query) {
          return true;
        }
        const normalized = normalizeSlash(agent.slash);
        const labelLower = agent.label.toLowerCase();
        return (
          normalized.includes(query) ||
          labelLower.includes(query.toLowerCase()) ||
          agent.id.includes(query.toLowerCase())
        );
      });

    // Sort by recent usage
    return filtered.sort((a, b) => {
      const aRecent = recentAgentIds.has(a.id) ? 1 : 0;
      const bRecent = recentAgentIds.has(b.id) ? 1 : 0;
      return bRecent - aRecent;
    });
  }, [searchQuery, agentConfigs, recentActions]);

  const topThree = filteredSuggestions.slice(0, 3);

  return (
    <div className="absolute bottom-full left-0 z-10 mb-2 w-full rounded-lg border border-border bg-background p-3 shadow-lg">
      {/* Search input */}
      <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
        <SearchIcon className="size-4 text-muted-foreground" />
        <input
          autoFocus
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onClose();
            } else if (e.key === "Enter" && topThree.length > 0) {
              onSelect(topThree[0].slash);
            }
          }}
          placeholder="Search routes..."
          type="text"
          value={searchQuery}
        />
      </div>

      {/* Suggestions */}
      <div className="flex flex-col gap-1">
        {topThree.length > 0 ? (
          topThree.map((agent) => (
            <Button
              className="cloud-button cloud-button--inline w-full justify-start text-left text-sm transition hover:scale-[1.01] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/40"
              key={agent.id}
              onClick={() => onSelect(agent.slash)}
              variant="ghost"
            >
              <span className="font-mono text-primary/90 tracking-[0.04em]">
                /{agent.slash}/
              </span>
              <span className="ml-2 text-muted-foreground">{agent.label}</span>
            </Button>
          ))
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No routes found
          </div>
        )}
      </div>
    </div>
  );
}
