"use client";

import { FolderIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AgentConfig } from "@/lib/ai/agents/registry";

interface AtoBrowserProps {
  currentChatId?: string;
}

export function AtoBrowser({ currentChatId: _currentChatId }: AtoBrowserProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [customAgents, setCustomAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasCustomAgents, setHasCustomAgents] = useState(false);

  useEffect(() => {
    // Check if user has any custom agents
    fetch("/api/custom-agents")
      .then((res) => res.json())
      .then((data) => {
        if (data.agents && data.agents.length > 0) {
          setHasCustomAgents(true);
        }
      })
      .catch((err) => {
        console.error("Failed to check custom agents:", err);
      });
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      // Load all agents when sheet opens
      Promise.all([
        fetch("/api/agents-list").then((res) => res.json()),
        fetch("/api/custom-agents").then((res) => res.json()),
      ])
        .then(([agentsData, customData]) => {
          if (agentsData.agents) {
            const official = agentsData.agents.filter(
              (a: AgentConfig) => !a.isCustom && a.id !== "default"
            );
            setAgents(official);
          }
          if (customData.agents) {
            setCustomAgents(customData.agents);
          }
        })
        .catch((err) => {
          console.error("Failed to load agents:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      agent.label.toLowerCase().includes(query) ||
      agent.slash.toLowerCase().includes(query)
    );
  });

  const filteredCustomAgents = customAgents.filter((agent) => {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      agent.label.toLowerCase().includes(query) ||
      agent.slash.toLowerCase().includes(query)
    );
  });

  // Get 3 most recently used from each category
  const recentOfficial = filteredAgents.slice(0, 3);
  const recentCustom = filteredCustomAgents.slice(0, 3);

  const handleSelectAgent = (agent: AgentConfig) => {
    // Navigate to a new chat with this slash
    const slash = `/${agent.slash}/`;
    router.push(`/brooks-ai-hub/?slash=${encodeURIComponent(slash)}`);
    setOpen(false);
  };

  const handleOpenSettings = (agent: AgentConfig) => {
    // Open settings for custom agent
    if (agent.isCustom) {
      router.push(`/settings?agentId=${agent.id}`);
      setOpen(false);
    }
  };

  // Show folder icon only if user has custom agents
  // Render at 50% opacity if no custom agents exist (per latest guidance)
  const iconOpacity = hasCustomAgents ? "opacity-100" : "opacity-50";

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          className={`h-8 px-2 md:h-fit md:px-2 ${iconOpacity}`}
          size="sm"
          variant="outline"
        >
          <FolderIcon className="size-4" />
          <span className="sr-only">Browse ATOs</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Browse ATO Slashes</SheetTitle>
          <SheetDescription>
            Search and select an ATO slash to start a new chat
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-4">
          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <SearchIcon className="size-4 text-muted-foreground" />
            <Input
              className="border-0 p-0 focus-visible:ring-0"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ATO slashes..."
              value={searchQuery}
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <>
              {/* Official ATO slashes */}
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm">Official ATO Slashes</h3>
                {recentOfficial.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {recentOfficial.map((agent) => (
                      <div
                        className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-accent"
                        key={agent.id}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm text-primary">
                            /{agent.slash}/
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {agent.label}
                          </span>
                        </div>
                        <Button
                          onClick={() => handleSelectAgent(agent)}
                          size="sm"
                          variant="ghost"
                        >
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No official ATOs found
                  </p>
                )}
              </div>

              {/* Unofficial/Custom ATO slashes */}
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm">
                  Unofficial ATO Slashes
                </h3>
                {recentCustom.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {recentCustom.map((agent) => (
                      <div
                        className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-accent"
                        key={agent.id}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm text-primary">
                            /{agent.slash}/
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {agent.label}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleOpenSettings(agent)}
                            size="sm"
                            variant="ghost"
                          >
                            <SettingsIcon className="size-4" />
                          </Button>
                          <Button
                            onClick={() => handleSelectAgent(agent)}
                            size="sm"
                            variant="ghost"
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No custom ATOs created yet.{" "}
                    <button
                      className="text-primary underline"
                      onClick={() => {
                        setOpen(false);
                        router.push("/brooks-ai-hub/");
                      }}
                      type="button"
                    >
                      Create one
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
