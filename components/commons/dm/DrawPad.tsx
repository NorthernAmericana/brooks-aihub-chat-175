"use client";

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type DrawTool = "pen" | "eraser";

type DrawPoint = {
  x: number;
  y: number;
};

type DrawStroke = {
  points: DrawPoint[];
  width: number;
  tool: DrawTool;
};

type DrawPadDraft = {
  version: number;
  strokes: DrawStroke[];
  view: {
    width: number;
    height: number;
  };
  toolState: {
    activeTool: DrawTool;
    strokeWidth: number;
  };
};

type DrawPadProps = {
  roomId: string;
  canWrite: boolean;
  onSent?: () => void;
};

const DRAFT_VERSION = 1;
const DRAFT_PREFIX = "dm_drawpad_draft:";
const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 560;
const DEFAULT_STROKE_WIDTH = 4;

function createEmptyDraft(): DrawPadDraft {
  return {
    version: DRAFT_VERSION,
    strokes: [],
    view: {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    },
    toolState: {
      activeTool: "pen",
      strokeWidth: DEFAULT_STROKE_WIDTH,
    },
  };
}

function isDrawPadDraft(value: unknown): value is DrawPadDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeDraft = value as Partial<DrawPadDraft>;
  return Array.isArray(maybeDraft.strokes) && typeof maybeDraft.version === "number";
}

function distanceToSegment(point: DrawPoint, start: DrawPoint, end: DrawPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const projectionX = start.x + clampedT * dx;
  const projectionY = start.y + clampedT * dy;

  return Math.hypot(point.x - projectionX, point.y - projectionY);
}

function strokeContainsPoint(stroke: DrawStroke, point: DrawPoint, threshold: number): boolean {
  if (stroke.points.length === 0) {
    return false;
  }

  if (stroke.points.length === 1) {
    return Math.hypot(point.x - stroke.points[0].x, point.y - stroke.points[0].y) <= threshold;
  }

  for (let index = 1; index < stroke.points.length; index += 1) {
    const start = stroke.points[index - 1];
    const end = stroke.points[index];

    if (distanceToSegment(point, start, end) <= threshold) {
      return true;
    }
  }

  return false;
}

export function DrawPad({ roomId, canWrite, onSent }: DrawPadProps) {
  const draftStorageKey = `${DRAFT_PREFIX}${roomId}`;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeStrokeRef = useRef<DrawStroke | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedRef = useRef(false);

  const [draft, setDraft] = useState<DrawPadDraft>(() => createEmptyDraft());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const activeTool = draft.toolState.activeTool;
  const strokeWidth = draft.toolState.strokeWidth;

  const redraw = useCallback((nextDraft: DrawPadDraft) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineJoin = "round";
    context.lineCap = "round";

    for (const stroke of nextDraft.strokes) {
      if (stroke.points.length === 0) {
        continue;
      }

      context.strokeStyle = "#123257";
      context.lineWidth = stroke.width;
      context.beginPath();
      context.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let index = 1; index < stroke.points.length; index += 1) {
        context.lineTo(stroke.points[index].x, stroke.points[index].y);
      }

      context.stroke();
    }
  }, []);

  const getCanvasPoint = useCallback((event: globalThis.PointerEvent): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  useEffect(() => {
    const localDraft = window.localStorage.getItem(draftStorageKey);
    if (localDraft) {
      try {
        const parsed = JSON.parse(localDraft) as unknown;
        if (isDrawPadDraft(parsed)) {
          setDraft(parsed);
        }
      } catch {
        // noop
      }
    }

    hasHydratedRef.current = true;

    void (async () => {
      try {
        const response = await fetch(`/api/dm/rooms/${encodeURIComponent(roomId)}/drawpad-draft`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { draft?: unknown };
        if (isDrawPadDraft(payload.draft)) {
          setDraft(payload.draft);
        }
      } catch {
        // noop
      }
    })();
  }, [draftStorageKey, roomId]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const resizeCanvas = () => {
      const width = Math.max(Math.floor(container.clientWidth), 320);
      const height = Math.max(Math.floor(container.clientHeight), 260);

      if (canvas.width === width && canvas.height === height) {
        return;
      }

      canvas.width = width;
      canvas.height = height;

      setDraft((current) => ({
        ...current,
        view: {
          width,
          height,
        },
      }));
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    redraw(draft);
  }, [draft, redraw]);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void fetch(`/api/dm/rooms/${encodeURIComponent(roomId)}/drawpad-draft`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draft }),
      });
    }, 700);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [draft, draftStorageKey, roomId]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!canWrite) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const point = getCanvasPoint(event.nativeEvent);
      if (!point) {
        return;
      }

      canvas.setPointerCapture(event.pointerId);
      activePointerIdRef.current = event.pointerId;

      if (activeTool === "eraser") {
        const threshold = Math.max(strokeWidth * 1.5, 12);
        setDraft((current) => ({
          ...current,
          strokes: current.strokes.filter(
            (stroke) => !strokeContainsPoint(stroke, point, threshold)
          ),
        }));
        return;
      }

      activeStrokeRef.current = {
        points: [point],
        width: strokeWidth,
        tool: activeTool,
      };

      setDraft((current) => ({
        ...current,
        strokes: [...current.strokes, activeStrokeRef.current as DrawStroke],
      }));
    },
    [activeTool, canWrite, getCanvasPoint, strokeWidth]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!canWrite || activePointerIdRef.current !== event.pointerId) {
        return;
      }

      if (activeTool === "eraser") {
        return;
      }

      const activeStroke = activeStrokeRef.current;
      if (!activeStroke) {
        return;
      }

      const point = getCanvasPoint(event.nativeEvent);
      if (!point) {
        return;
      }

      activeStroke.points.push(point);
      setDraft((current) => ({
        ...current,
        strokes: [...current.strokes.slice(0, -1), { ...activeStroke, points: [...activeStroke.points] }],
      }));
    },
    [activeTool, canWrite, getCanvasPoint]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!canWrite || activePointerIdRef.current !== event.pointerId) {
        return;
      }

      const canvas = canvasRef.current;
      if (canvas && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      activeStrokeRef.current = null;
      activePointerIdRef.current = null;
    },
    [canWrite]
  );

  const canSend = useMemo(() => canWrite && draft.strokes.length > 0 && !isSending, [canWrite, draft.strokes.length, isSending]);

  const sendDrawPad = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !canSend) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((nextBlob) => resolve(nextBlob), "image/png");
      });

      if (!blob) {
        throw new Error("Could not export draw pad image");
      }

      const formData = new FormData();
      formData.append("file", blob, `drawpad-${Date.now()}.png`);

      const uploadResponse = await fetch(
        `/api/dm/rooms/${encodeURIComponent(roomId)}/drawpad-upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Could not upload draw pad image");
      }

      const uploadPayload = (await uploadResponse.json()) as { url?: string };
      if (!uploadPayload.url) {
        throw new Error("Upload response missing URL");
      }

      const sendResponse = await fetch(
        `/api/dm/rooms/${encodeURIComponent(roomId)}/messages/drawpad`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assetUrl: uploadPayload.url,
            metadata: {
              source: "drawpad",
              draftVersion: draft.version,
              strokeCount: draft.strokes.length,
            },
          }),
        }
      );

      if (!sendResponse.ok) {
        throw new Error("Could not send draw pad");
      }

      onSent?.();
    } catch (_error) {
      setErrorMessage("Unable to send draw pad. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [canSend, draft.strokes.length, draft.version, onSent, roomId]);

  return (
    <div className="flex h-full min-h-[20rem] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`border-2 px-3 py-1 text-xs font-bold ${
            activeTool === "pen" ? "border-[#0f2742] bg-[#123257] text-white" : "border-[#0f2742] bg-white"
          }`}
          onClick={() =>
            setDraft((current) => ({
              ...current,
              toolState: { ...current.toolState, activeTool: "pen" },
            }))
          }
          type="button"
        >
          Pen
        </button>
        <button
          className={`border-2 px-3 py-1 text-xs font-bold ${
            activeTool === "eraser"
              ? "border-[#0f2742] bg-[#123257] text-white"
              : "border-[#0f2742] bg-white"
          }`}
          onClick={() =>
            setDraft((current) => ({
              ...current,
              toolState: { ...current.toolState, activeTool: "eraser" },
            }))
          }
          type="button"
        >
          Eraser
        </button>
        <button
          className="border-2 border-[#0f2742] bg-white px-3 py-1 text-xs font-bold"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              strokes: [],
            }))
          }
          type="button"
        >
          Clear All
        </button>
        <label className="ml-auto text-xs">
          Width
          <input
            className="ml-2 align-middle"
            max={18}
            min={1}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                toolState: { ...current.toolState, strokeWidth: Number(event.target.value) },
              }))
            }
            type="range"
            value={strokeWidth}
          />
        </label>
      </div>

      <div className="relative min-h-[14rem] flex-1 border-2 border-[#0f2742] bg-white" ref={containerRef}>
        <canvas
          className="h-full w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          ref={canvasRef}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs">{draft.strokes.length} strokes</p>
        <button
          className="border-2 border-[#0f2742] bg-[#123257] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          disabled={!canSend}
          onClick={() => void sendDrawPad()}
          type="button"
        >
          {isSending ? "Sending…" : "Send Draw Pad"}
        </button>
      </div>

      {errorMessage ? <p className="text-xs text-red-700">{errorMessage}</p> : null}
    </div>
  );
}
