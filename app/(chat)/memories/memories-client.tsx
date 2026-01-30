"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ALL_VOICES, type VoiceOption } from "@/lib/voice";

export type MemorySource = {
  label: string;
  href?: string | null;
  type: "chat" | "unknown";
  uri: string;
};

export type MemoryItem = {
  id: string;
  rawText: string;
  route: string | null;
  agentLabel: string;
  approvedAt: string;
  createdAt: string;
  tags: string[];
  source: MemorySource;
};

type MemoriesClientProps = {
  memories: MemoryItem[];
};

type MemoryScope = {
  label: string;
  detail: string;
  badgeVariant: "default" | "secondary" | "outline";
};

const SHARED_PROJECTS = new Map([
  ["mycarmindato", "MyCarMindATO"],
  ["brooksbears", "BrooksBears"],
]);

const formatRoute = (route: string | null) => {
  if (!route) {
    return "General";
  }

  const trimmed = route.replace(/^\/|\/$/g, "");
  return `/${trimmed}/`;
};

const getMemoryDate = (memory: MemoryItem) =>
  memory.approvedAt || memory.createdAt;

const getMemoryDateKey = (memory: MemoryItem) =>
  format(parseISO(getMemoryDate(memory)), "yyyy-MM-dd");

const getScopeInfo = (route: string | null): MemoryScope => {
  if (!route) {
    return {
      label: "General",
      detail: "Available across your chats",
      badgeVariant: "outline",
    };
  }

  const trimmed = route.replace(/^\/|\/$/g, "");
  const rootSegment = trimmed.split("/")[0] ?? trimmed;
  const normalizedRoot = rootSegment.replace(/\s+/g, "").toLowerCase();
  const sharedLabel = SHARED_PROJECTS.get(normalizedRoot);

  if (sharedLabel) {
    return {
      label: "Shared",
      detail: `Shared within ${sharedLabel}`,
      badgeVariant: "default",
    };
  }

  return {
    label: "Official ATO",
    detail: `Scoped to /${rootSegment}/`,
    badgeVariant: "secondary",
  };
};

const getRangeDate = (value: string, isEnd: boolean) => {
  const suffix = isEnd ? "T23:59:59.999Z" : "T00:00:00.000Z";
  return new Date(`${value}${suffix}`);
};

const getVoiceOption = (voiceId: string | null) => {
  return ALL_VOICES.find((voice) => voice.id === voiceId) ?? ALL_VOICES[0];
};

const MemoryDialog = ({
  memory,
  scope,
}: {
  memory: MemoryItem;
  scope: MemoryScope;
}) => {
  const sourceLabel =
    memory.source.type === "chat" ? "Chat source" : "Source";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          Open
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Memory summary</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 text-sm">
          <div className="rounded-md border border-border bg-muted/40 p-3 text-foreground">
            {memory.rawText}
          </div>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{formatRoute(memory.route)}</Badge>
              <Badge variant="secondary">{memory.agentLabel}</Badge>
              <Badge variant={scope.badgeVariant}>{scope.label}</Badge>
            </div>
            <div>{scope.detail}</div>
            <div>
              {sourceLabel}:{" "}
              {memory.source.href ? (
                <Link
                  className="text-primary hover:underline"
                  href={memory.source.href}
                >
                  {memory.source.label}
                </Link>
              ) : (
                <span>{memory.source.label}</span>
              )}
            </div>
            <div>Raw source URI: {memory.source.uri}</div>
            {memory.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MemoriesTable = ({
  memories,
  onSpeak,
}: {
  memories: MemoryItem[];
  onSpeak: (memory: MemoryItem) => void;
}) => {
  if (memories.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No approved memories yet. When you approve a saved memory in chat, it
          will show up here with its route, scope, and source.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base font-semibold">
          Memory ledger
        </CardTitle>
        <CardDescription>
          {memories.length} approved memories available.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Summary</th>
                <th className="px-4 py-3 text-left font-medium">Route</th>
                <th className="px-4 py-3 text-left font-medium">Scope</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {memories.map((memory) => {
                const dateLabel = format(
                  parseISO(getMemoryDate(memory)),
                  "MMM d, yyyy"
                );
                const scope = getScopeInfo(memory.route);
                return (
                  <tr className="hover:bg-muted/40" key={memory.id}>
                    <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                      {dateLabel}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="line-clamp-3 text-sm text-foreground">
                        {memory.rawText}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{memory.agentLabel}</Badge>
                        {memory.tags.length > 0 ? (
                          <span>{memory.tags.length} tags</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant="outline">{formatRoute(memory.route)}</Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <Badge variant={scope.badgeVariant}>{scope.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {scope.detail}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
                      {memory.source.href ? (
                        <Link
                          className="text-primary hover:underline"
                          href={memory.source.href}
                        >
                          {memory.source.label}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {memory.source.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          onClick={() => onSpeak(memory)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Speak
                        </Button>
                        <MemoryDialog memory={memory} scope={scope} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const CalendarView = ({
  memories,
  onSpeak,
}: {
  memories: MemoryItem[];
  onSpeak: (memory: MemoryItem) => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  const memoriesByDate = useMemo(() => {
    const map = new Map<string, MemoryItem[]>();
    for (const memory of memories) {
      const key = getMemoryDateKey(memory);
      const existing = map.get(key);
      if (existing) {
        existing.push(memory);
        continue;
      }
      map.set(key, [memory]);
    }
    return map;
  }, [memories]);

  const selectedMemories = useMemo(() => {
    if (!selectedDay) {
      return [];
    }
    return memoriesByDate.get(selectedDay) ?? [];
  }, [memoriesByDate, selectedDay]);

  useEffect(() => {
    if (!selectedDay && memories.length > 0) {
      setSelectedDay(getMemoryDateKey(memories[0]));
    }
  }, [memories, selectedDay]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)]">
      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <CardDescription>
                Tap a day to explore memories or use quick slots below.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                Prev
              </Button>
              <Button
                onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                size="sm"
                type="button"
                variant="ghost"
              >
                Today
              </Button>
              <Button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 text-xs text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div className="px-2 py-1 text-center font-medium" key={label}>
                {label}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2 text-xs">
            {calendarDays.map((calendarDay) => {
              const dayKey = format(calendarDay, "yyyy-MM-dd");
              const dayMemories = memoriesByDate.get(dayKey) ?? [];
              const isSelected = selectedDay === dayKey;
              const isCurrentMonth = isSameMonth(calendarDay, currentMonth);

              return (
                <div
                  className={cn(
                    "flex min-h-[110px] flex-col gap-2 rounded-md border border-border/60 p-2",
                    isCurrentMonth ? "bg-background" : "bg-muted/40",
                    isSelected ? "ring-2 ring-primary/60" : null
                  )}
                  key={dayKey}
                >
                  <button
                    className={cn(
                      "flex items-center justify-between text-left font-medium",
                      isSameDay(calendarDay, new Date())
                        ? "text-primary"
                        : "text-foreground"
                    )}
                    onClick={() => {
                      setSelectedDay(dayKey);
                      setSelectedMemoryId(null);
                    }}
                    type="button"
                  >
                    <span className="text-sm">{format(calendarDay, "d")}</span>
                    {dayMemories.length > 0 ? (
                      <Badge variant="secondary">{dayMemories.length}</Badge>
                    ) : null}
                  </button>
                  <div className="flex flex-1 flex-col gap-1">
                    {dayMemories.slice(0, 2).map((memory) => (
                      <button
                        className={cn(
                          "rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-left text-[11px] text-muted-foreground transition hover:bg-muted/60",
                          selectedMemoryId === memory.id
                            ? "border-primary/60 text-foreground"
                            : null
                        )}
                        key={memory.id}
                        onClick={() => {
                          setSelectedDay(dayKey);
                          setSelectedMemoryId(memory.id);
                        }}
                        type="button"
                      >
                        {memory.rawText}
                      </button>
                    ))}
                    {dayMemories.length > 2 ? (
                      <button
                        className="text-left text-[11px] text-primary hover:underline"
                        onClick={() => {
                          setSelectedDay(dayKey);
                          setSelectedMemoryId(null);
                        }}
                        type="button"
                      >
                        +{dayMemories.length - 2} more
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base font-semibold">
            {selectedDay
              ? format(parseISO(selectedDay), "EEE, MMM d")
              : "Select a day"}
          </CardTitle>
          <CardDescription>
            {selectedMemories.length > 0
              ? `${selectedMemories.length} memory summaries`
              : "No memories saved for this day."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4">
          {selectedMemories.map((memory) => {
            const scope = getScopeInfo(memory.route);
            return (
              <div
                className={cn(
                  "rounded-lg border border-border/60 p-3",
                  selectedMemoryId === memory.id
                    ? "border-primary/60 bg-muted/40"
                    : "bg-background"
                )}
                key={memory.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatRoute(memory.route)}</Badge>
                  <Badge variant="secondary">{memory.agentLabel}</Badge>
                  <Badge variant={scope.badgeVariant}>{scope.label}</Badge>
                </div>
                <p className="mt-2 text-sm text-foreground">{memory.rawText}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {memory.source.href ? (
                    <Link
                      className="text-primary hover:underline"
                      href={memory.source.href}
                    >
                      {memory.source.label}
                    </Link>
                  ) : (
                    <span>{memory.source.label}</span>
                  )}
                  <span>•</span>
                  <span>{scope.detail}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => onSpeak(memory)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Speak
                  </Button>
                  <MemoryDialog memory={memory} scope={scope} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export const MemoriesClient = ({ memories }: MemoriesClientProps) => {
  const router = useRouter();
  const [localMemories, setLocalMemories] = useState<MemoryItem[]>(memories);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [scopeFilter, setScopeFilter] = useState<
    "all" | "shared" | "official" | "general"
  >("all");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    getVoiceOption(null).id
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [playingMemoryId, setPlayingMemoryId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setLocalMemories(memories);
  }, [memories]);

  const selectedVoice = useMemo<VoiceOption>(() => {
    return getVoiceOption(selectedVoiceId);
  }, [selectedVoiceId]);

  const filteredMemories = useMemo(() => {
    if (scopeFilter === "all") {
      return localMemories;
    }

    return localMemories.filter((memory) => {
      const scope = getScopeInfo(memory.route);
      if (scopeFilter === "shared") {
        return scope.label === "Shared";
      }
      if (scopeFilter === "official") {
        return scope.label === "Official ATO";
      }
      return scope.label === "General";
    });
  }, [localMemories, scopeFilter]);

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioRef.current = null;
    setPlayingMemoryId(null);
  };

  const handleSpeak = async (memory: MemoryItem) => {
    if (playingMemoryId === memory.id) {
      resetAudio();
      return;
    }

    if (!memory.rawText.trim()) {
      toast.error("There's no memory summary to read.");
      return;
    }

    resetAudio();
    const loadingToast = toast.loading("Generating speech...");
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15_000);

      const response = await fetch("/api/tts/elevenlabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: memory.rawText,
          voiceId: selectedVoice.id,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message =
          errorPayload?.error ?? "Unable to generate speech right now.";
        toast.error(message);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audio.preload = "auto";
      audioRef.current = audio;
      setPlayingMemoryId(memory.id);

      audio.addEventListener("ended", () => {
        resetAudio();
      });
      audio.addEventListener("error", () => {
        resetAudio();
        toast.error("Audio playback failed.");
      });

      await audio.play();
      toast.success(`Playing ${selectedVoice.label}.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.error("Speech request timed out.");
      } else {
        toast.error("Unable to generate speech right now.");
      }
      resetAudio();
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      toast.dismiss(loadingToast);
    }
  };

  const deleteMemories = async (payload?: {
    startDate: string;
    endDate: string;
  }) => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/memories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        toast.error(errorPayload?.error ?? "Unable to delete memories.");
        return;
      }

      const result = (await response.json()) as { deletedCount: number };
      if (payload) {
        const start = getRangeDate(payload.startDate, false).getTime();
        const end = getRangeDate(payload.endDate, true).getTime();
        const remaining = localMemories.filter((memory) => {
          const memoryTime = new Date(getMemoryDate(memory)).getTime();
          return memoryTime < start || memoryTime > end;
        });
        setLocalMemories(remaining);
      } else {
        setLocalMemories([]);
      }
      toast.success(`Deleted ${result.deletedCount} memories.`);
      router.refresh();
    } catch (_error) {
      toast.error("Unable to delete memories.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isRangeReady = Boolean(rangeStart && rangeEnd);

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Memories</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Approved memories saved from chat appear here with shared scope, route,
          and source details.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid gap-1">
            <Label htmlFor="memories-view">View</Label>
            <Select
              onValueChange={(value) =>
                setView(value === "calendar" ? "calendar" : "table")
              }
              value={view}
            >
              <SelectTrigger className="w-[160px]" id="memories-view">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="memories-scope">Scope</Label>
            <Select
              onValueChange={(value) =>
                setScopeFilter(value as typeof scopeFilter)
              }
              value={scopeFilter}
            >
              <SelectTrigger className="w-[160px]" id="memories-scope">
                <SelectValue placeholder="All scopes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All memories</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
                <SelectItem value="official">Official ATO</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="summary-voice">Summary speaker</Label>
          <Select
            onValueChange={(value) => setSelectedVoiceId(value)}
            value={selectedVoiceId}
          >
            <SelectTrigger className="w-[220px]" id="summary-voice">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {ALL_VOICES.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Memory cleanup
          </CardTitle>
          <CardDescription>
            Delete all memories or clear a date range.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="grid gap-2">
            <Label htmlFor="range-start">From</Label>
            <Input
              id="range-start"
              onChange={(event) => setRangeStart(event.target.value)}
              type="date"
              value={rangeStart}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="range-end">To</Label>
            <Input
              id="range-end"
              onChange={(event) => setRangeEnd(event.target.value)}
              type="date"
              value={rangeEnd}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!isRangeReady || isDeleting} type="button">
                Delete range
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete date range?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes memories from {rangeStart || "?"} to{" "}
                  {rangeEnd || "?"}. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (isRangeReady) {
                      void deleteMemories({
                        startDate: rangeStart,
                        endDate: rangeEnd,
                      });
                    }
                  }}
                  type="button"
                >
                  Delete range
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isDeleting || localMemories.length === 0}
                type="button"
                variant="destructive"
              >
                Delete all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all memories?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every approved memory. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void deleteMemories()}
                  type="button"
                >
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-y-auto">
        {view === "calendar" ? (
          <CalendarView memories={filteredMemories} onSpeak={handleSpeak} />
        ) : (
          <MemoriesTable memories={filteredMemories} onSpeak={handleSpeak} />
        )}
      </div>
    </div>
  );
};
