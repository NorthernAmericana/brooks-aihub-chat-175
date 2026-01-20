"use client";

import { useEffect, useMemo, useState } from "react";
import { useAgents } from "@/hooks/use-agents";
import { normalizeRoute } from "@/lib/ai/routing";
import { getMostUsedRoute, getRouteUsage, recordRouteUsage } from "@/lib/route-usage";
import { cn } from "@/lib/utils";

const buildSuggestions = (
  routes: string[],
  activeRoute: string,
  mostUsedRoute: string | null
) => {
  const normalizedActive = normalizeRoute(activeRoute);
  const suggestions = [normalizedActive];
  const hubRoute = normalizeRoute("/hub");

  if (!suggestions.includes(hubRoute)) {
    suggestions.push(hubRoute);
  }

  if (mostUsedRoute) {
    const normalizedMostUsed = normalizeRoute(mostUsedRoute);
    if (!suggestions.includes(normalizedMostUsed)) {
      suggestions.push(normalizedMostUsed);
    }
  }

  for (const route of routes) {
    const normalized = normalizeRoute(route);
    if (!suggestions.includes(normalized)) {
      suggestions.push(normalized);
    }
    if (suggestions.length >= 3) {
      break;
    }
  }

  return suggestions.slice(0, 3);
};

type RouteSwitcherProps = {
  activeRoute: string;
  isReadonly: boolean;
  onRouteSelect: (route: string) => void;
};

export function RouteSwitcher({
  activeRoute,
  isReadonly,
  onRouteSelect,
}: RouteSwitcherProps) {
  const { data: agents = [] } = useAgents();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [usage, setUsage] = useState<Record<string, number>>({});

  useEffect(() => {
    setUsage(getRouteUsage());
  }, []);

  useEffect(() => {
    if (!activeRoute) {
      return;
    }
    const updatedUsage = recordRouteUsage(activeRoute);
    setUsage(updatedUsage);
  }, [activeRoute]);

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return agents;
    }

    return agents.filter((agent) => {
      const haystack = `${agent.route} ${agent.displayName} ${agent.description}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [agents, search]);

  const mostUsedRoute = useMemo(
    () => getMostUsedRoute(usage, [activeRoute, "/hub"]),
    [usage, activeRoute]
  );

  const suggestedRoutes = useMemo(
    () => buildSuggestions(
      agents.map((agent) => agent.route),
      activeRoute,
      mostUsedRoute
    ),
    [agents, activeRoute, mostUsedRoute]
  );

  const selectedRouteLabel =
    agents.find((agent) => normalizeRoute(agent.route) === normalizeRoute(activeRoute))
      ?.displayName ?? "Unknown route";

  const handleSelect = (route: string) => {
    if (isReadonly) {
      return;
    }
    onRouteSelect(route);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border/60 bg-muted px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Current {normalizeRoute(activeRoute)}
        </span>
        <span className="text-xs text-muted-foreground">{selectedRouteLabel}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {suggestedRoutes.map((route) => {
            const agent = agents.find(
              (candidate) => normalizeRoute(candidate.route) === normalizeRoute(route)
            );
            return (
              <button
                className={cn(
                  "rounded-full border border-border/60 bg-background px-2 py-1 text-[0.65rem] font-medium text-foreground transition hover:border-border",
                  normalizeRoute(route) === normalizeRoute(activeRoute) &&
                    "border-primary/50 bg-primary/10 text-primary"
                )}
                disabled={isReadonly}
                key={route}
                onClick={() => handleSelect(route)}
                type="button"
              >
                {agent?.route ?? route}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <input
          className="h-8 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          disabled={isReadonly}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 150);
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search routes by name or description"
          type="text"
          value={search}
        />
        {isOpen && filteredAgents.length > 0 && (
          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-sm shadow-lg">
            {filteredAgents.map((agent) => (
              <button
                className="flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left text-foreground hover:bg-accent"
                key={agent.id}
                disabled={isReadonly}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(agent.route);
                }}
                type="button"
              >
                <span className="text-xs font-semibold">
                  {agent.displayName} · {agent.route}
                </span>
                <span className="text-[0.65rem] text-muted-foreground">
                  {agent.description}
                </span>
              </button>
            ))}
          </div>
        )}
        {isOpen && filteredAgents.length === 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-popover p-2 text-xs text-muted-foreground shadow-lg">
            No routes match.
          </div>
        )}
      </div>
    </div>
  );
}
