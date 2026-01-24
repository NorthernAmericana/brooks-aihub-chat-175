"use client";

import { FolderIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { listAgentConfigs } from "@/lib/ai/agents/registry";
import type { CustomAto } from "@/lib/db/schema";

type AtoListPanelProps = {
  onSelectAto?: (slash: string, isOfficial: boolean) => void;
};

export function AtoListPanel({ onSelectAto }: AtoListPanelProps) {
  const [open, setOpen] = useState(false);
  const [customAtos, setCustomAtos] = useState<CustomAto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomAtos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/custom-atos");
      if (response.ok) {
        const data = await response.json();
        setCustomAtos(data);
      }
    } catch (error) {
      console.error("Failed to fetch custom ATOs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCustomAtos();
    }
  }, [open, fetchCustomAtos]);

  const officialAgents = listAgentConfigs()
    .filter((agent) => agent.id !== "default")
    .slice(0, 3);

  const recentCustomAtos = customAtos
    .sort((a, b) => {
      const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  const filteredOfficialAgents = officialAgents.filter((agent) =>
    agent.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomAtos = recentCustomAtos.filter((ato) =>
    ato.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasCustomAtos = customAtos.length > 0;

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          className="h-8 px-2 md:h-fit md:px-2"
          style={{ opacity: hasCustomAtos ? 1 : 0.5 }}
          variant="outline"
        >
          <FolderIcon className="h-4 w-4" />
          <span className="sr-only">ATO Slashes</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>ATO Slashes</SheetTitle>
          <SheetDescription>
            Browse and select official or custom ATO slashes
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="relative">
            <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ATOs..."
              value={searchQuery}
            />
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold text-sm">
                Official ATO slashes
              </h3>
              <div className="space-y-2">
                {filteredOfficialAgents.length > 0 ? (
                  filteredOfficialAgents.map((agent) => (
                    <div
                      className="flex items-center justify-between rounded-md border p-3"
                      key={agent.id}
                    >
                      <div>
                        <div className="font-medium">{agent.label}</div>
                        <div className="text-muted-foreground text-xs">
                          /{agent.slash}/
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          if (onSelectAto) {
                            onSelectAto(agent.slash, true);
                          }
                          setOpen(false);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Use
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No official ATOs found
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-sm">
                Unofficial ATO slashes
              </h3>
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : filteredCustomAtos.length > 0 ? (
                  filteredCustomAtos.map((ato) => (
                    <div
                      className="flex items-center justify-between rounded-md border p-3"
                      key={ato.id}
                    >
                      <div>
                        <div className="font-medium">{ato.name}</div>
                        <div className="text-muted-foreground text-xs">
                          /{ato.slash}/
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            // Open settings for this ATO
                            // This will be handled by the parent component
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <SettingsIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            if (onSelectAto) {
                              onSelectAto(ato.slash, false);
                            }
                            setOpen(false);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {hasCustomAtos
                      ? "No custom ATOs found"
                      : "No custom ATOs created yet"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
