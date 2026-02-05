"use client";

import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import type { RouteSuggestion } from "@/lib/routes/types";
import { normalizeRouteKey, sanitizeRouteSegment } from "@/lib/routes/utils";
import { getStoredSlashActions, normalizeSlash } from "@/lib/suggested-actions";
import { fetcher } from "@/lib/utils";

type RoutesResponse = {
  routes: RouteSuggestion[];
};

export function SlashSuggestions({
  onSelect,
  onClose,
}: {
  onSelect: (slash: string, options?: { atoId?: string }) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: routeData } = useSWR<RoutesResponse>("/api/routes", fetcher);
  const recentActions = useMemo(() => getStoredSlashActions(), []);

  const suggestions = useMemo(() => {
    const byRoute = new Map<string, RouteSuggestion>();
    for (const route of routeData?.routes ?? []) {
      const key = normalizeRouteKey(route.slash);
      if (!byRoute.has(key)) {
        byRoute.set(key, route);
      }
    }
    return Array.from(byRoute.values());
  }, [routeData]);

  const filteredSuggestions = useMemo(() => {
    const query = sanitizeRouteSegment(searchQuery).toLowerCase();

    // Get unique agents from recent actions
    const recentSlashKeys = new Set(
      recentActions.map((action) => normalizeSlash(action.slash))
    );

    // Filter agents
    const filtered = suggestions
      .filter((agent) => agent.id !== "default")
      .filter((agent) => {
        if (!query) {
          return true;
        }
        const normalized = sanitizeRouteSegment(agent.slash).toLowerCase();
        const labelLower = agent.label.toLowerCase();
        return (
          normalized.includes(query) ||
          labelLower.includes(query) ||
          agent.id.includes(query.toLowerCase())
        );
      });

    // Sort by recent usage
    return filtered.sort((a, b) => {
      const aRecent = recentSlashKeys.has(normalizeSlash(a.slash)) ? 1 : 0;
      const bRecent = recentSlashKeys.has(normalizeSlash(b.slash)) ? 1 : 0;
      return bRecent - aRecent;
    });
  }, [searchQuery, suggestions, recentActions]);

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
              onSelect(topThree[0].slash, { atoId: topThree[0].atoId });
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
              onClick={() => onSelect(agent.slash, { atoId: agent.atoId })}
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
