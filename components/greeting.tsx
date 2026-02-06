"use client";

import { ChevronRight, MoreVertical } from "lucide-react";
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
import type { RouteSuggestion } from "@/lib/routes/types";
import {
  formatRoutePath,
  normalizeRouteKey,
  sanitizeRouteSegment,
} from "@/lib/routes/utils";
import { cn, fetcher } from "@/lib/utils";

type GreetingProps = {
  onSelectFolder?: (folder: string, options?: { atoId?: string }) => void;
};

type TreeNode = {
  segment: string;
  path: string;
  label?: string;
  route?: string;
  badge?: "gem" | "free" | "custom";
  foundersOnly?: boolean;
  children: TreeNode[];
};

const TreeNodeItem = ({
  node,
  depth = 0,
  onSelectFolder,
}: {
  node: TreeNode;
  depth?: number;
  onSelectFolder?: (folder: string) => void;
}) => {
  const hasChildren = node.children.length > 0;
  const label = node.label ?? node.segment;
  const [expanded, setExpanded] = useState(depth === 0);
  const childrenId = `tree-children-${node.path
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .toLowerCase()}`;

  return (
    <li className="space-y-2">
      <div
        className={cn(
          "flex w-full items-start gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-left transition hover:bg-background",
          depth > 0 ? "ml-4" : null
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-muted"
            aria-expanded={expanded}
            aria-controls={childrenId}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${label} subroutes`}
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                expanded ? "rotate-90" : "rotate-0"
              )}
            />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}
        <button
          className="flex min-w-0 flex-1 flex-col items-start gap-1"
          onClick={() => {
            if (node.route) {
              onSelectFolder?.(node.route);
            }
          }}
          type="button"
        >
          <span className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-muted-foreground">📁</span>
            <span>{label}</span>
            {hasChildren ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.5rem] uppercase tracking-[0.2em] text-muted-foreground">
                {node.children.length} subroute
                {node.children.length === 1 ? "" : "s"}
              </span>
            ) : null}
            {node.badge === "gem" ? (
              <span className="text-sm" title="Founders access only">
                💎
              </span>
            ) : node.badge === "free" ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-emerald-500">
                Free
              </span>
            ) : null}
          </span>
          {node.route ? (
            <span className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">
              {node.route}
            </span>
          ) : null}
          {node.foundersOnly ? (
            <span className="text-[0.55rem] uppercase tracking-[0.2em] text-amber-500">
              Founders only
            </span>
          ) : null}
        </button>
      </div>
      {hasChildren && expanded ? (
        <ul className="space-y-2" id={childrenId}>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

type AtoListResponse = {
  atos: Array<{
    id: string;
    name: string;
    route: string | null;
    description: string | null;
  }>;
};

export const Greeting = ({ onSelectFolder }: GreetingProps) => {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [clockMode, setClockMode] = useState(false);
  const { data: routeData } = useSWR<{ routes: RouteSuggestion[] }>(
    "/api/routes",
    fetcher
  );
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1_000);

    return () => window.clearInterval(interval);
  }, []);

  const customAtoFolders = useMemo(() => {
    const atos = atoData?.atos ?? [];
    return atos
      .map((ato) => {
        const routeSource = ato.route || ato.name;
        const formattedRoute = sanitizeRouteSegment(routeSource);
        if (!formattedRoute) {
          return null;
        }
        return {
          label: ato.name,
          slash: formattedRoute,
          folder: formatRoutePath(formattedRoute),
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
    const officialRoutes =
      routeData?.routes?.filter((route) => route.kind === "official") ?? [];
    const routeByKey = new Map(
      officialRoutes.map((route) => [normalizeRouteKey(route.slash), route])
    );
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
      { slash: "NAMC/Reader", foundersOnly: true, badge: "gem" },
      { slash: "NAMC/Lore-Playground", foundersOnly: false, badge: "free" },
    ];
    const labelOverrides: Record<string, string> = {
      NAT: "Northern Americana Tech Agent",
      "NAMC/Lore-Playground": "Lore Playground",
    };

    return desiredOrder
      .map((entry) => {
        const route = routeByKey.get(normalizeRouteKey(entry.slash));
        if (!route) {
          return null;
        }

        const folderItem: {
          label: string;
          slash: string;
          folder: string;
          foundersOnly: boolean;
          badge?: "gem" | "free";
        } = {
          label: labelOverrides[route.slash] ?? route.label,
          slash: route.slash,
          folder: route.route,
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

  const officialTree = useMemo<TreeNode[]>(() => {
    const root: TreeNode = {
      segment: "",
      path: "",
      children: [],
    };

    suggestedFolders.forEach((folder) => {
      const segments = folder.slash.split("/").filter(Boolean);
      let current = root;
      segments.forEach((segment, index) => {
        const nextPath = current.path ? `${current.path}/${segment}` : segment;
        let child = current.children.find((node) => node.segment === segment);
        if (!child) {
          child = {
            segment,
            path: nextPath,
            children: [],
          };
          current.children.push(child);
        }
        if (index === segments.length - 1) {
          child.label = folder.label;
          child.route = folder.folder;
          child.badge = folder.badge;
          child.foundersOnly = folder.foundersOnly;
        }
        current = child;
      });
    });

    const sortTree = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.segment.localeCompare(b.segment));
      nodes.forEach((node) => sortTree(node.children));
    };
    sortTree(root.children);

    return root.children;
  }, [suggestedFolders]);

  const allAtoFolders = useMemo(() => {
    const combined = [
      ...suggestedFolders.map((folder) => ({
        ...folder,
        badge: folder.badge,
      })),
      ...customAtoFolders.map((folder) => ({
        label: folder.label,
        slash: folder.slash,
        folder: folder.folder,
        foundersOnly: false,
        badge: "custom" as const,
        atoId: folder.atoId,
      })),
    ];

    const sorted = [...combined].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    return sortOrder === "asc" ? sorted : sorted.reverse();
  }, [customAtoFolders, sortOrder, suggestedFolders]);

  const digitalTime = useMemo(
    () =>
      now.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
    [now]
  );

  const fullDate = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [now]
  );

  const analogHands = useMemo(() => {
    const seconds = now.getSeconds();
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    return {
      second: seconds * 6,
      minute: minutes * 6,
      hour: hours * 30,
    };
  }, [now]);

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
        className="greeting-time mt-2 w-full max-w-sm rounded-3xl border border-border/60 bg-gradient-to-r from-background/80 via-background/70 to-background/60 px-4 py-3 text-left shadow-sm backdrop-blur-sm sm:max-w-md"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {clockMode ? (
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 rounded-full border border-border/70 bg-background/90 shadow-sm">
                  <svg
                    aria-hidden="true"
                    className="h-full w-full"
                    viewBox="0 0 100 100"
                  >
                    <g stroke="currentColor" className="text-muted-foreground/70">
                      {Array.from({ length: 12 }, (_, index) => {
                        const angle = index * 30;
                        return (
                          <line
                            key={`tick-${angle}`}
                            x1="50"
                            y1="8"
                            x2="50"
                            y2="16"
                            strokeWidth="2"
                            strokeLinecap="round"
                            transform={`rotate(${angle} 50 50)`}
                          />
                        );
                      })}
                    </g>
                    <g strokeLinecap="round">
                      <line
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        transform={`rotate(${analogHands.hour} 50 50)`}
                      />
                      <line
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="20"
                        stroke="currentColor"
                        strokeOpacity="0.8"
                        strokeWidth="3"
                        transform={`rotate(${analogHands.minute} 50 50)`}
                      />
                      <line
                        x1="50"
                        y1="52"
                        x2="50"
                        y2="16"
                        stroke="#10b981"
                        strokeWidth="2"
                        transform={`rotate(${analogHands.second} 50 50)`}
                      />
                    </g>
                    <circle cx="50" cy="50" r="4" fill="currentColor" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-[0.12em] text-foreground sm:text-base">
                    {digitalTime}
                  </div>
                  <div className="mt-0.5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                    {fullDate}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-semibold tracking-[0.12em] text-foreground sm:text-base">
                  {digitalTime}
                </div>
                <div className="mt-0.5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                  {fullDate}
                </div>
              </>
            )}
          </div>

          <label className="inline-flex shrink-0 items-center justify-end gap-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span>Clock</span>
            <input
              aria-label="Toggle analog clock mode"
              checked={clockMode}
              className="h-3.5 w-3.5 accent-emerald-500"
              onChange={(event) => setClockMode(event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 w-full text-xs leading-relaxed sm:text-sm md:mt-5"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        <div className="mb-6 w-full rounded-3xl border border-border/60 bg-gradient-to-br from-foreground/5 via-background/80 to-background p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-left">
            <div>
              <div className="text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                ATO Explorer Widgets
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Browse official and custom ATO routes like a file explorer.
              </p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {suggestedFolders.length + customAtoFolders.length} total folders
            </div>
          </div>
          <div className="mt-4 grid w-full gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm">
              <div className="flex items-center justify-between text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                <span>Official ATO file system</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-emerald-500">
                  Verified
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Officially made ATOs with routes and subroutes.
              </p>
              <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-border/60 bg-background/80 p-3">
                <ul className="space-y-2 text-xs">
                  {officialTree.map((node) => (
                    <TreeNodeItem
                      key={node.path}
                      node={node}
                      onSelectFolder={onSelectFolder}
                    />
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm">
              <div className="flex items-center justify-between text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                <span>Custom ATO file system</span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-amber-500">
                  Your builds
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Your custom-made ATOs with editable settings.
              </p>
              <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-border/60 bg-background/80 p-3">
                {customAtoFolders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No custom ATOs yet. Create one to see it listed here.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {customAtoFolders.map((folder) => (
                      <li
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2"
                        key={folder.folder}
                      >
                        <button
                          aria-pressed={selectedAtoId === folder.atoId}
                          className={cn(
                            "flex flex-1 flex-col items-start gap-1 text-left text-xs font-medium",
                            selectedAtoId === folder.atoId
                              ? "text-foreground"
                              : "text-foreground/80"
                          )}
                          onClick={() => {
                            setSelectedAtoId(folder.atoId);
                            onSelectFolder?.(folder.folder, {
                              atoId: folder.atoId,
                            });
                          }}
                          type="button"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground">📁</span>
                            <span>{folder.label}</span>
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-amber-500">
                              Custom
                            </span>
                          </span>
                          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                            {folder.folder}
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
                              className="h-8 w-8 rounded-full bg-background/70 p-0 text-muted-foreground hover:bg-background hover:text-foreground"
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
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="greeting-clouds-label text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-[0.6rem] md:text-xs">
            all ATO App Folder Clouds
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-7 rounded-full text-[0.55rem] uppercase tracking-[0.2em]"
                size="sm"
                variant="outline"
              >
                Sort: {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setSortOrder("asc")}>
                Alphabetical (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortOrder("desc")}>
                Reverse (Z-A)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4 flex w-full flex-wrap justify-center gap-4">
          {allAtoFolders.map((folder, index) => (
            <button
              className="cloud-button flex h-full px-4 py-2 text-xs transition hover:scale-[1.01] active:scale-[0.99] sm:px-4 sm:py-3 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/40"
              key={folder.folder}
              onClick={() =>
                onSelectFolder?.(folder.folder, {
                  atoId: "atoId" in folder ? folder.atoId : undefined,
                })
              }
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
                  ) : folder.badge === "custom" ? (
                    <span
                      className="ml-1 inline-flex align-middle text-[0.5rem] font-bold uppercase tracking-wider text-amber-500 sm:text-[0.55rem]"
                      title="Custom ATO"
                    >
                      CUSTOM
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
