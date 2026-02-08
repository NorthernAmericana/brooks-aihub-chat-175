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
  source_route?: string | null;
  metadata?: { route?: string | null } | null;
  agentLabel: string;
  approvedAt: string;
  createdAt: string;
  tags: string[];
  source: MemorySource;
};

type MemoriesClientProps = {
  initialMemories: MemoryItem[];
  initialNextCursor: number | null;
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

type MemoryRouteInfo = {
  routeKey: string | null;
  productRoute: string | null;
  fullRoute: string | null;
};

const normalizeRoute = (route: string | null | undefined) => {
  if (!route) {
    return null;
  }

  const trimmed = route.trim().replace(/^\/|\/$/g, "");
  if (!trimmed) {
    return null;
  }

  return `/${trimmed}/`;
};

const deriveMemoryRoute = (memory: MemoryItem): MemoryRouteInfo => {
  const candidate =
    memory.route ??
    memory.source_route ??
    (typeof memory.metadata?.route === "string"
      ? memory.metadata.route
      : null);
  const fullRoute = normalizeRoute(candidate);
  const trimmed = fullRoute ? fullRoute.replace(/^\/|\/$/g, "") : null;
  const rootSegment = trimmed ? trimmed.split("/")[0] : null;
  const productRoute = rootSegment ? `/${rootSegment}/` : null;

  return {
    routeKey: fullRoute,
    productRoute,
    fullRoute,
  };
};

const formatDerivedRoute = (routeInfo: MemoryRouteInfo) =>
  routeInfo.fullRoute ? routeInfo.fullRoute : "General";

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

const PAGE_LIMIT = 50;

type MemoryListResponse = {
  rows: MemoryItem[];
  nextCursor: number | null;
  distinctRoutes: string[];
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
  const routeInfo = deriveMemoryRoute(memory);

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
              <Badge variant="outline">
                {formatDerivedRoute(routeInfo)}
              </Badge>
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
  onLoadMore,
  onPrevious,
  hasNext,
  hasPrevious,
  isLoading,
  pageLabel,
}: {
  memories: MemoryItem[];
  onSpeak: (memory: MemoryItem) => void;
  onLoadMore: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
  pageLabel: string;
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
          {memories.length} memories shown on {pageLabel}.
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
                const routeInfo = deriveMemoryRoute(memory);
                const scope = getScopeInfo(routeInfo.fullRoute);
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
                      <Badge variant="outline">
                        {formatDerivedRoute(routeInfo)}
                      </Badge>
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
        <span>
          Showing {memories.length} memories on {pageLabel}.
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={isLoading || !hasPrevious}
            onClick={onPrevious}
            size="sm"
            type="button"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={isLoading || !hasNext}
            onClick={onLoadMore}
            size="sm"
            type="button"
          >
            Load more
          </Button>
        </div>
      </div>
    </Card>
  );
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildCalendarDays = (currentMonth: Date) => {
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

  return calendarDays;
};

type CalendarGridProps = {
  currentMonth: Date;
  memoriesByDate: Map<string, MemoryItem[]>;
  selectedDay: string | null;
  onSelectDay: (dayKey: string) => void;
  variant?: "compact" | "full";
};

const CalendarGrid = ({
  currentMonth,
  memoriesByDate,
  selectedDay,
  onSelectDay,
  variant = "full",
}: CalendarGridProps) => {
  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth),
    [currentMonth]
  );
  const today = new Date();
  const isCompact = variant === "compact";
  const maxSlots = isCompact ? 1 : 2;

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-7 text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div className="px-2 py-1 text-center font-medium" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs">
        {calendarDays.map((calendarDay) => {
          const dayKey = format(calendarDay, "yyyy-MM-dd");
          const dayMemories = memoriesByDate.get(dayKey) ?? [];
          const isSelected = selectedDay === dayKey;
          const isCurrentMonth = isSameMonth(calendarDay, currentMonth);
          const isToday = isSameDay(calendarDay, today);

          return (
            <button
              className={cn(
                "group flex min-h-[96px] flex-col gap-2 rounded-lg border border-border/60 p-2 text-left transition hover:border-primary/50 hover:bg-muted/40",
                isCurrentMonth ? "bg-background" : "bg-muted/40",
                isSelected ? "ring-2 ring-primary/60" : null,
                isCompact ? "min-h-[88px]" : "min-h-[120px]"
              )}
              key={dayKey}
              onClick={() => onSelectDay(dayKey)}
              type="button"
            >
              <div className="flex items-center justify-between text-left font-medium">
                <span
                  className={cn(
                    "text-sm",
                    isToday ? "text-primary" : "text-foreground",
                    !isCurrentMonth ? "opacity-60" : null
                  )}
                >
                  {format(calendarDay, "d")}
                </span>
                {dayMemories.length > 0 ? (
                  <Badge variant="secondary">{dayMemories.length}</Badge>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {dayMemories.slice(0, maxSlots).map((memory) => (
                  <div
                    className={cn(
                      "rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground",
                      isCompact ? "line-clamp-1" : "line-clamp-2"
                    )}
                    key={memory.id}
                  >
                    {memory.rawText}
                  </div>
                ))}
                {dayMemories.length > maxSlots ? (
                  <span className="text-[10px] text-primary">
                    +{dayMemories.length - maxSlots} more
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CalendarDayDetails = ({
  selectedDay,
  memories,
  onSpeak,
  onBack,
}: {
  selectedDay: string | null;
  memories: MemoryItem[];
  onSpeak: (memory: MemoryItem) => void;
  onBack?: () => void;
}) => {
  return (
    <div className="grid gap-3">
      {selectedDay ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {format(parseISO(selectedDay), "EEEE, MMMM d")}
            </p>
            <p className="text-xs text-muted-foreground">
              {memories.length > 0
                ? `${memories.length} memories saved`
                : "No memories saved for this day."}
            </p>
          </div>
          {onBack ? (
            <Button onClick={onBack} size="sm" type="button" variant="ghost">
              Back to calendar
            </Button>
          ) : null}
        </div>
      ) : null}

      {memories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Pick a day to explore the memories saved on that date.
        </div>
      ) : (
        memories.map((memory) => {
          const routeInfo = deriveMemoryRoute(memory);
          const scope = getScopeInfo(routeInfo.fullRoute);
          return (
            <div
              className="rounded-lg border border-border/60 bg-background p-3"
              key={memory.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {formatDerivedRoute(routeInfo)}
                </Badge>
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
        })
      )}
    </div>
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"calendar" | "day">(
    "calendar"
  );

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

  useEffect(() => {
    if (!selectedDay) {
      return;
    }

    if (!memoriesByDate.has(selectedDay)) {
      const firstAvailableDay = memories[0] ? getMemoryDateKey(memories[0]) : null;
      setSelectedDay(firstAvailableDay);
    }
  }, [memories, memoriesByDate, selectedDay]);

  const openCalendar = () => {
    setCalendarMode("calendar");
    setCalendarOpen(true);
  };

  const openDay = (dayKey: string) => {
    setSelectedDay(dayKey);
    setCalendarMode("day");
    setCalendarOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Calendar overview
              </CardTitle>
              <CardDescription>
                Press any date to open a full-screen calendar view.
              </CardDescription>
            </div>
            <Button onClick={openCalendar} type="button" variant="outline">
              Open full calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                {memories.length} memories across your calendar.
              </p>
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
          <div className="mt-4">
            <CalendarGrid
              currentMonth={currentMonth}
              memoriesByDate={memoriesByDate}
              onSelectDay={openDay}
              selectedDay={selectedDay}
              variant="compact"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog onOpenChange={setCalendarOpen} open={calendarOpen}>
        <DialogContent className="h-dvh w-dvw max-w-none rounded-none border-none p-0">
          <div className="flex h-dvh flex-col bg-background">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 px-4 py-4">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-lg font-semibold">
                  {calendarMode === "calendar"
                    ? "Memory calendar"
                    : selectedDay
                      ? format(parseISO(selectedDay), "MMMM d, yyyy")
                      : "Day details"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {calendarMode === "calendar"
                    ? "Tap a date to explore memories on that day."
                    : "Review the memories saved on this date."}
                </p>
              </DialogHeader>
              <div className="flex items-center gap-2">
                {calendarMode === "day" ? (
                  <Button
                    onClick={() => setCalendarMode("calendar")}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Back to calendar
                  </Button>
                ) : null}
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
            <div className="flex-1 overflow-y-auto p-4">
              {calendarMode === "calendar" ? (
                <CalendarGrid
                  currentMonth={currentMonth}
                  memoriesByDate={memoriesByDate}
                  onSelectDay={(dayKey) => {
                    setSelectedDay(dayKey);
                    setCalendarMode("day");
                  }}
                  selectedDay={selectedDay}
                  variant="full"
                />
              ) : (
                <CalendarDayDetails
                  memories={selectedMemories}
                  onBack={() => setCalendarMode("calendar")}
                  onSpeak={onSpeak}
                  selectedDay={selectedDay}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const MemoriesClient = ({
  initialMemories: memories,
  initialNextCursor,
}: MemoriesClientProps) => {
  const router = useRouter();
  const [localMemories, setLocalMemories] = useState<MemoryItem[]>(
    memories
  );
  const [view, setView] = useState<"table" | "calendar">("table");
  const [routeFilter, setRouteFilter] = useState("all");
  const [subrouteFilter, setSubrouteFilter] = useState("all");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    getVoiceOption(null).id
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(
    initialNextCursor
  );
  const pageCacheRef = useRef(
    new Map<number, { rows: MemoryItem[]; nextCursor: number | null }>()
  );
  const [playingMemoryId, setPlayingMemoryId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    pageCacheRef.current.set(0, {
      rows: memories,
      nextCursor: initialNextCursor,
    });
    setLocalMemories(memories);
    setNextCursor(initialNextCursor);
  }, [initialNextCursor, memories]);

  const loadPage = async (offset: number, options?: { force?: boolean }) => {
    const cached = pageCacheRef.current.get(offset);
    if (cached && !options?.force) {
      setLocalMemories(cached.rows);
      setNextCursor(cached.nextCursor);
      setCurrentOffset(offset);
      return;
    }

    setIsLoadingPage(true);
    try {
      const searchParams = new URLSearchParams({
        limit: PAGE_LIMIT.toString(),
        offset: offset.toString(),
      });
      const response = await fetch(
        `/api/memories/list?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        toast.error(errorPayload?.error ?? "Unable to load memories.");
        return;
      }

      const payload = (await response.json()) as MemoryListResponse;
      pageCacheRef.current.set(offset, {
        rows: payload.rows,
        nextCursor: payload.nextCursor,
      });
      setLocalMemories(payload.rows);
      setNextCursor(payload.nextCursor);
      setCurrentOffset(offset);
    } catch (_error) {
      toast.error("Unable to load memories.");
    } finally {
      setIsLoadingPage(false);
    }
  };

  useEffect(() => {
    void loadPage(0, { force: true });
  }, []);

  const selectedVoice = useMemo<VoiceOption>(() => {
    return getVoiceOption(selectedVoiceId);
  }, [selectedVoiceId]);

  const routeData = useMemo(() => {
    return localMemories.map((memory) => ({
      memory,
      routeInfo: deriveMemoryRoute(memory),
    }));
  }, [localMemories]);

  const productRoutes = useMemo(() => {
    const routes = new Set<string>();
    for (const { routeInfo } of routeData) {
      if (routeInfo.productRoute) {
        routes.add(routeInfo.productRoute);
      }
    }
    return Array.from(routes).sort((a, b) => a.localeCompare(b));
  }, [routeData]);

  const subroutes = useMemo(() => {
    if (routeFilter === "all") {
      return [];
    }
    const routes = new Set<string>();
    for (const { routeInfo } of routeData) {
      if (routeInfo.productRoute === routeFilter && routeInfo.fullRoute) {
        routes.add(routeInfo.fullRoute);
      }
    }
    return Array.from(routes).sort((a, b) => a.localeCompare(b));
  }, [routeData, routeFilter]);

  const filteredMemories = useMemo(() => {
    const scopedMemories = routeData
      .filter(({ routeInfo }) => {
        if (routeFilter === "all") {
          return true;
        }
        if (routeInfo.productRoute !== routeFilter) {
          return false;
        }
        if (subrouteFilter !== "all") {
          return routeInfo.fullRoute === subrouteFilter;
        }
        return true;
      })
      .map(({ memory }) => memory);

    return [...scopedMemories].sort(
      (a, b) =>
        new Date(getMemoryDate(b)).getTime() -
        new Date(getMemoryDate(a)).getTime()
    );
  }, [routeData, routeFilter, subrouteFilter]);

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
      pageCacheRef.current.clear();
      setCurrentOffset(0);
      setNextCursor(null);
      void loadPage(0, { force: true });
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
    <div className="flex min-h-full flex-col gap-6 pb-24">
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
            <Label htmlFor="memories-route">Route</Label>
            <Select
              onValueChange={(value) => {
                setRouteFilter(value);
                setSubrouteFilter("all");
              }}
              value={routeFilter}
            >
              <SelectTrigger className="w-[180px]" id="memories-route">
                <SelectValue placeholder="All routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All routes</SelectItem>
                {productRoutes.map((route) => (
                  <SelectItem key={route} value={route}>
                    {route}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {routeFilter !== "all" && subroutes.length > 0 ? (
            <div className="grid gap-1">
              <Label htmlFor="memories-subroute">Subroute</Label>
              <Select
                onValueChange={(value) => setSubrouteFilter(value)}
                value={subrouteFilter}
              >
                <SelectTrigger className="w-[200px]" id="memories-subroute">
                  <SelectValue placeholder="All subroutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subroutes</SelectItem>
                  {subroutes.map((route) => (
                    <SelectItem key={route} value={route}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
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

      {view === "calendar" ? (
        <CalendarView memories={filteredMemories} onSpeak={handleSpeak} />
      ) : (
        <MemoriesTable
          hasNext={Boolean(nextCursor)}
          hasPrevious={currentOffset > 0}
          isLoading={isLoadingPage}
          memories={filteredMemories}
          onLoadMore={() => {
            if (nextCursor !== null) {
              void loadPage(nextCursor);
            }
          }}
          onPrevious={() => {
            const previousOffset = Math.max(0, currentOffset - PAGE_LIMIT);
            void loadPage(previousOffset);
          }}
          onSpeak={handleSpeak}
          pageLabel={`page ${Math.floor(currentOffset / PAGE_LIMIT) + 1}`}
        />
      )}
    </div>
  );
};
