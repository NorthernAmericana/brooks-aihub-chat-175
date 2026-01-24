"use client";

import { FolderIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomAtoDialog } from "@/components/custom-ato-dialog";
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
import type { CustomAto } from "@/lib/db/schema";

const OFFICIAL_ATOS = [
  { id: "namc", label: "NAMC AI Media Curator", slash: "NAMC" },
  { id: "nat", label: "NAT Strategy", slash: "NAT" },
  { id: "brooks-bears", label: "Brooks Bears", slash: "BrooksBears" },
  { id: "my-car-mind", label: "My Car Mind ATO", slash: "MyCarMindATO" },
  { id: "my-flower-ai", label: "My Flower AI", slash: "MyFlowerAI" },
];

export function AtoBrowser() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customAtos, setCustomAtos] = useState<CustomAto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCustomAtos();
    }
  }, [open]);

  const fetchCustomAtos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/custom-ato");
      if (response.ok) {
        const data = await response.json();
        setCustomAtos(data);
      }
    } catch (error) {
      console.error("Error fetching custom ATOs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAtoClick = (slash: string) => {
    router.push(`/brooks-ai-hub/?slash=${slash}`);
    setOpen(false);
  };

  const filteredOfficialAtos = OFFICIAL_ATOS.filter(
    (ato) =>
      searchQuery === "" ||
      ato.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ato.slash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomAtos = customAtos.filter(
    (ato) =>
      searchQuery === "" ||
      ato.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ato.slashRoute.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show 3 most recent for each category
  const recentOfficialAtos = filteredOfficialAtos.slice(0, 3);
  const recentCustomAtos = filteredCustomAtos.slice(0, 3);

  // Icon opacity: 50% when no custom ATOs exist
  const iconOpacity = customAtos.length === 0 ? "opacity-50" : "opacity-100";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className={`h-8 px-2 md:h-fit md:px-2 ${iconOpacity}`}
          variant="outline"
          title="Browse ATO slashes"
        >
          <FolderIcon className="h-4 w-4" />
          <span className="sr-only">Browse ATO slashes</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>ATO Slashes</SheetTitle>
          <SheetDescription>
            Browse and search official and custom ATO slashes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ATOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Official ATO Slashes */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Official ATO Slashes</h3>
            <div className="space-y-1">
              {recentOfficialAtos.length > 0 ? (
                recentOfficialAtos.map((ato) => (
                  <Button
                    key={ato.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleAtoClick(ato.slash)}
                  >
                    /{ato.slash}/ - {ato.label}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No official ATOs found
                </p>
              )}
            </div>
          </div>

          {/* Unofficial ATO Slashes */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Unofficial ATO Slashes
            </h3>
            <div className="space-y-1">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : recentCustomAtos.length > 0 ? (
                recentCustomAtos.map((ato) => (
                  <div
                    key={ato.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start"
                      onClick={() => handleAtoClick(ato.slashRoute)}
                    >
                      /{ato.slashRoute}/ - {ato.name}
                    </Button>
                    <CustomAtoDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          title="Edit ATO settings"
                        >
                          <SettingsIcon className="h-4 w-4" />
                        </Button>
                      }
                      ato={ato}
                      onSuccess={fetchCustomAtos}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No custom ATOs found. Create one to get started!
                </p>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="pt-2 text-sm text-muted-foreground">
              Showing {recentOfficialAtos.length + recentCustomAtos.length}{" "}
              results
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
