"use client";

import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "@/components/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listAgentConfigs } from "@/lib/ai/agents/registry";
import { cn, fetcher } from "@/lib/utils";

type GreetingProps = {
  onSelectFolder?: (folder: string, options?: { atoId?: string }) => void;
};

type AtoListResponse = {
  atos: Array<{
    id: string;
    name: string;
    route: string | null;
    description: string | null;
  }>;
};

const formatAtoRoute = (value: string) =>
  value
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/[^a-zA-Z0-9/_-]/g, "");

export const Greeting = ({ onSelectFolder }: GreetingProps) => {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const { data: atoData, mutate: mutateAtos } = useSWR<AtoListResponse>(
    "/api/ato",
    fetcher
  );
  const [selectedAtoId, setSelectedAtoId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const customAtoFolders = useMemo(() => {
    const atos = atoData?.atos ?? [];
    return atos
      .map((ato) => {
        const routeSource = ato.route || ato.name;
        const formattedRoute = formatAtoRoute(routeSource);
        if (!formattedRoute) {
          return null;
        }
        return {
          label: ato.name,
          slash: formattedRoute,
          folder: `/${formattedRoute}/`,
          foundersOnly: false,
          badge: "custom" as const,
          atoId: ato.id,
        };
      })
      .filter(
        (
          folder
        ): folder is {
          label: string;
          slash: string;
          folder: string;
          foundersOnly: boolean;
          badge: "custom";
          atoId: string;
        } => Boolean(folder)
      );
  }, [atoData]);

  useEffect(() => {
    if (
      selectedAtoId &&
      !customAtoFolders.some((folder) => folder.atoId === selectedAtoId)
    ) {
      setSelectedAtoId(null);
    }
  }, [customAtoFolders, selectedAtoId]);

  const suggestedFolders = useMemo(() => {
    const desiredOrder: Array<{
      slash: string;
      foundersOnly: boolean;
      badge?: "gem" | "free";
    }> = [
      { slash: "Brooks AI HUB", foundersOnly: false },
      { slash: "BrooksBears", foundersOnly: false },
      { slash: "BrooksBears/BenjaminBear", foundersOnly: true, badge: "gem" },
      { slash: "MyCarMindATO", foundersOnly: false },
      { slash: "MyCarMindATO/Driver", foundersOnly: false, badge: "free" },
      { slash: "MyCarMindATO/Trucker", foundersOnly: true, badge: "gem" },
      {
        slash: "MyCarMindATO/DeliveryDriver",
        foundersOnly: false,
        badge: "free",
      },
      {
        slash: "MyCarMindATO/Traveler",
        foundersOnly: false,
        badge: "free",
      },
      { slash: "MyFlowerAI", foundersOnly: false },
      { slash: "Brooks AI HUB/Summaries", foundersOnly: true, badge: "gem" },
      { slash: "NAT", foundersOnly: false },
      { slash: "NAMC", foundersOnly: false },
    ];

    const agentBySlash = new Map(
      listAgentConfigs().map((agent) => [agent.slash, agent])
    );
    const labelOverrides: Record<string, string> = {
      NAT: "Northern Americana Tech Agent",
    };

    return desiredOrder
      .map((entry) => {
        const agent = agentBySlash.get(entry.slash);
        if (!agent) {
          return null;
        }

        const folderItem: {
          label: string;
          slash: string;
          folder: string;
          foundersOnly: boolean;
          badge?: "gem" | "free";
        } = {
          label: labelOverrides[agent.slash] ?? agent.label,
          slash: agent.slash,
          folder: `/${agent.slash}/`,
          foundersOnly: entry.foundersOnly,
        };

        if (entry.badge) {
          folderItem.badge = entry.badge;
        }

        return folderItem;
      })
      .filter(
        (
          folder
        ): folder is {
          label: string;
          slash: string;
          folder: string;
          foundersOnly: boolean;
          badge?: "gem" | "free";
        } => Boolean(folder)
      );
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

  const cloudStyles = useMemo(
    () => [
      { transform: "translateY(0px)", minWidth: "10.75rem" },
      { transform: "translateY(2px)", minWidth: "10rem" },
      { transform: "translateY(-2px)", minWidth: "10.5rem" },
      { transform: "translateY(3px)", minWidth: "9.75rem" },
      { transform: "translateY(-3px)", minWidth: "10.25rem" },
      { transform: "translateY(1px)", minWidth: "9.75rem" },
      { transform: "translateY(-1px)", minWidth: "10.5rem" },
      { transform: "translateY(2px)", minWidth: "10rem" },
      { transform: "translateY(-2px)", minWidth: "10.25rem" },
    ],
    []
  );

  const handleDeleteAto = async () => {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ato/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to delete ATO.");
      }
      toast({
        type: "success",
        description: `${deleteTarget.name} deleted.`,
      });
      setSelectedAtoId((current) =>
        current === deleteTarget.id ? null : current
      );
      await mutateAtos();
    } catch (error) {
      console.error(error);
      toast({
        type: "error",
        description: "Unable to delete this ATO.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div
      className="relative mx-auto mt-2 flex size-full max-w-xl flex-col items-center justify-center gap-2.5 px-4 py-6 text-center sm:mt-4 sm:max-w-2xl sm:px-6 sm:py-8 md:mt-12 md:px-10 md:py-10"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-balance font-semibold text-xl leading-tight text-foreground sm:text-2xl md:text-3xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <span className="greeting-title font-pixel">/Brooks AI HUB/</span>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="greeting-time mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs md:text-sm"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        {formattedNow}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 w-full text-xs leading-relaxed sm:text-sm md:mt-5"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        {customAtoFolders.length > 0 && (
          <div className="mb-6">
            <div className="greeting-clouds-label text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-[0.6rem] md:text-xs">
              your custom ATO clouds
            </div>
            <div className="mt-4 flex w-full flex-wrap justify-center gap-4">
              {customAtoFolders.map((folder, index) => (
                <div
                  className="relative"
                  key={folder.folder}
                  style={cloudStyles[index % cloudStyles.length]}
                >
                  <button
                    aria-pressed={selectedAtoId === folder.atoId}
                    className={cn(
                      "cloud-button flex h-full px-4 py-2 text-xs transition hover:scale-[1.01] active:scale-[0.99] sm:px-4 sm:py-3 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/40",
                      selectedAtoId === folder.atoId
                        ? "ring-2 ring-foreground/40 ring-offset-2 ring-offset-background"
                        : null
                    )}
                    onClick={() => {
                      setSelectedAtoId(folder.atoId);
                      onSelectFolder?.(folder.folder, { atoId: folder.atoId });
                    }}
                    type="button"
                  >
                    <span className="flex w-full flex-col gap-0.5 pr-6 text-left leading-tight">
                      <span className="text-xs font-medium leading-snug sm:text-sm">
                        {folder.label}
                        <span
                          className="ml-1 inline-flex align-middle text-[0.5rem] font-bold uppercase tracking-wider text-amber-500 sm:text-[0.55rem]"
                          title="Custom ATO"
                        >
                          CUSTOM
                        </span>
                      </span>
                      <span className="text-[0.6rem] uppercase leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-[0.65rem]">
                        {folder.folder}
                      </span>
                    </span>
                  </button>
                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (open) {
                        setSelectedAtoId(folder.atoId);
                      }
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={`Manage ${folder.label}`}
                        className="absolute right-1 top-1 h-7 w-7 rounded-full bg-background/70 p-0 text-muted-foreground hover:bg-background hover:text-foreground"
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          router.push(`/create-ato/${folder.atoId}`);
                        }}
                      >
                        Customize settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() =>
                          setDeleteTarget({
                            id: folder.atoId,
                            name: folder.label,
                          })
                        }
                      >
                        Delete ATO
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="greeting-clouds-label text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-[0.6rem] md:text-xs">
          all ATO App Folder Clouds
        </div>
        <div className="mt-4 flex w-full flex-wrap justify-center gap-4">
          {suggestedFolders.map((folder, index) => (
            <button
              className="cloud-button flex h-full px-4 py-2 text-xs transition hover:scale-[1.01] active:scale-[0.99] sm:px-4 sm:py-3 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/40"
              key={folder.folder}
              onClick={() => onSelectFolder?.(folder.folder)}
              style={cloudStyles[index % cloudStyles.length]}
              type="button"
            >
              <span className="flex w-full flex-col gap-0.5 text-left leading-tight">
                <span className="text-xs font-medium leading-snug sm:text-sm">
                  {folder.label}
                  {folder.badge === "gem" ? (
                    <span
                      aria-hidden="true"
                      className="ml-1 inline-flex align-middle text-sm"
                      title="Founders access only"
                    >
                      💎
                    </span>
                  ) : folder.badge === "free" ? (
                    <span
                      className="ml-1 inline-flex align-middle text-[0.5rem] font-bold uppercase tracking-wider text-green-500 animate-pulse sm:text-[0.55rem]"
                      title="Free access - no founders subscription required"
                    >
                      FREE
                    </span>
                  ) : null}
                  {folder.badge === "gem" ? (
                    <span className="sr-only">Founders access only</span>
                  ) : null}
                </span>
                <span className="text-[0.6rem] uppercase leading-relaxed tracking-[0.08em] text-muted-foreground sm:text-[0.65rem]">
                  {folder.folder}
                </span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ATO?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the unofficial ATO from your custom cloud list. It
              does not delete existing chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAto}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete ATO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
