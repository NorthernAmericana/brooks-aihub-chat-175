"use client";

import { useEffect, useState } from "react";
import { FolderIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomATO } from "@/lib/db/schema";
import { ATOSettingsDialog } from "./ato-settings-dialog";

const OFFICIAL_ATOS = [
  { id: "brooks-ai-hub", label: "Brooks AI HUB", slash: "Brooks AI HUB" },
  { id: "namc", label: "NAMC AI Media Curator", slash: "NAMC" },
  { id: "brooks-bears", label: "Brooks Bears", slash: "BrooksBears" },
  { id: "my-car-mind", label: "My Car Mind ATO", slash: "MyCarMindATO" },
  { id: "my-flower-ai", label: "My Flower AI", slash: "MyFlowerAI" },
  { id: "nat", label: "NAT Strategy", slash: "NAT" },
];

interface ATOBrowserProps {
  onSelectATO?: (slash: string) => void;
}

export function ATOBrowser({ onSelectATO }: ATOBrowserProps) {
  const [open, setOpen] = useState(false);
  const [customATOs, setCustomATOs] = useState<CustomATO[]>([]);
  const [hasCustomATOs, setHasCustomATOs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedATO, setSelectedATO] = useState<CustomATO | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCustomATOs();
    }
  }, [open]);

  const fetchCustomATOs = async () => {
    try {
      const response = await fetch("/api/custom-atos");
      if (response.ok) {
        const data = await response.json();
        setCustomATOs(data.customATOs || []);
        setHasCustomATOs((data.customATOs || []).length > 0);
      }
    } catch (error) {
      console.error("Failed to fetch custom ATOs:", error);
    }
  };

  const filteredOfficialATOs = OFFICIAL_ATOS.filter(
    (ato) =>
      searchQuery === "" ||
      ato.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ato.slash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomATOs = customATOs.filter(
    (ato) =>
      searchQuery === "" ||
      ato.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ato.slash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOfficialATO = (slash: string) => {
    if (onSelectATO) {
      onSelectATO(slash);
    }
    setOpen(false);
  };

  const handleSelectCustomATO = (ato: CustomATO) => {
    setSelectedATO(ato);
    setSettingsOpen(true);
  };

  const handleATOUpdate = () => {
    fetchCustomATOs();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="h-8 px-2 md:h-fit md:px-2"
            variant="outline"
            aria-label="Browse ATOs"
          >
            <FolderIcon className={`h-4 w-4 ${!hasCustomATOs ? "opacity-50" : ""}`} />
            <span className="sr-only">Browse ATOs</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Browse ATOs</DialogTitle>
            <DialogDescription>
              View and manage official and custom ATO slash commands
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ATOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="official" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="official">Official ATOs</TabsTrigger>
              <TabsTrigger value="custom">Unofficial ATOs</TabsTrigger>
            </TabsList>

            <TabsContent
              value="official"
              className="mt-4 h-[400px] overflow-y-auto"
            >
              <div className="space-y-2">
                {filteredOfficialATOs.slice(0, 3).map((ato) => (
                  <div
                    key={ato.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{ato.label}</div>
                      <div className="text-sm text-muted-foreground">
                        /{ato.slash}/
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelectOfficialATO(ato.slash)}
                    >
                      Add to Chat
                    </Button>
                  </div>
                ))}
                {filteredOfficialATOs.length > 3 && (
                  <>
                    <div className="py-2 text-center text-sm text-muted-foreground">
                      More results
                    </div>
                    {filteredOfficialATOs.slice(3).map((ato) => (
                      <div
                        key={ato.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                      >
                        <div>
                          <div className="font-medium">{ato.label}</div>
                          <div className="text-sm text-muted-foreground">
                            /{ato.slash}/
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectOfficialATO(ato.slash)}
                        >
                          Add to Chat
                        </Button>
                      </div>
                    ))}
                  </>
                )}
                {filteredOfficialATOs.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No official ATOs found
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="custom"
              className="mt-4 h-[400px] overflow-y-auto"
            >
              <div className="space-y-2">
                {filteredCustomATOs.length === 0 && searchQuery === "" && (
                  <div className="py-8 text-center text-muted-foreground">
                    No custom ATOs yet. Create one from the sidebar!
                  </div>
                )}
                {filteredCustomATOs.length === 0 && searchQuery !== "" && (
                  <div className="py-8 text-center text-muted-foreground">
                    No custom ATOs found matching "{searchQuery}"
                  </div>
                )}
                {filteredCustomATOs.slice(0, 3).map((ato) => (
                  <div
                    key={ato.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{ato.name}</div>
                      <div className="text-sm text-muted-foreground">
                        /{ato.slash}/ • {ato.voiceLabel}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectCustomATO(ato)}
                      >
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (onSelectATO) onSelectATO(ato.slash);
                          setOpen(false);
                        }}
                      >
                        Add to Chat
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredCustomATOs.length > 3 && (
                  <>
                    <div className="py-2 text-center text-sm text-muted-foreground">
                      More results
                    </div>
                    {filteredCustomATOs.slice(3).map((ato) => (
                      <div
                        key={ato.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{ato.name}</div>
                          <div className="text-sm text-muted-foreground">
                            /{ato.slash}/ • {ato.voiceLabel}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectCustomATO(ato)}
                          >
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (onSelectATO) onSelectATO(ato.slash);
                              setOpen(false);
                            }}
                          >
                            Add to Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {selectedATO && (
        <ATOSettingsDialog
          ato={selectedATO}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onUpdate={handleATOUpdate}
        />
      )}
    </>
  );
}
