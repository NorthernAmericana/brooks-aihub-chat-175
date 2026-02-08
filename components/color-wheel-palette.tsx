import * as React from "react";

type Mode =
  | "Complementary"
  | "Triadic"
  | "Analogous"
  | "Split"
  | "Square"
  | "Monochromatic";
type Layout = "desktop" | "mobile";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").trim();
  if (![3, 6].includes(clean.length)) {
    return null;
  }
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const to2 = (v: number) => v.toString(16).padStart(2, "0");
  return `#${to2(clamp(Math.round(r), 0, 255))}${to2(
    clamp(Math.round(g), 0, 255)
  )}${to2(clamp(Math.round(b), 0, 255))}`.toUpperCase();
}

function hsvToRgb(h: number, s: number, v: number) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 1);
  const val = clamp(v, 0, 1);

  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;

  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (hue < 60) {
    rp = c;
    gp = x;
    bp = 0;
  } else if (hue < 120) {
    rp = x;
    gp = c;
    bp = 0;
  } else if (hue < 180) {
    rp = 0;
    gp = c;
    bp = x;
  } else if (hue < 240) {
    rp = 0;
    gp = x;
    bp = c;
  } else if (hue < 300) {
    rp = x;
    gp = 0;
    bp = c;
  } else {
    rp = c;
    gp = 0;
    bp = x;
  }

  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function rgbToHsv(r: number, g: number, b: number) {
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const cMax = Math.max(rp, gp, bp);
  const cMin = Math.min(rp, gp, bp);
  const delta = cMax - cMin;

  let h = 0;
  if (delta !== 0) {
    if (cMax === rp) {
      h = 60 * (((gp - bp) / delta) % 6);
    } else if (cMax === gp) {
      h = 60 * ((bp - rp) / delta + 2);
    } else {
      h = 60 * ((rp - gp) / delta + 4);
    }
  }
  if (h < 0) {
    h += 360;
  }

  const s = cMax === 0 ? 0 : delta / cMax;
  const v = cMax;

  return { h, s, v };
}

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

function rotateHue(h: number, deg: number) {
  return ((h + deg) % 360 + 360) % 360;
}

function generatePalette(mode: Mode, h: number, s: number, v: number) {
  const base = { h, s, v };

  const mk = (hh: number, ss = s, vv = v) => hsvToHex(hh, ss, vv);

  switch (mode) {
    case "Complementary":
      return [mk(base.h), mk(rotateHue(base.h, 180))];
    case "Triadic":
      return [
        mk(base.h),
        mk(rotateHue(base.h, 120)),
        mk(rotateHue(base.h, 240)),
      ];
    case "Analogous":
      return [
        mk(rotateHue(base.h, -25)),
        mk(base.h),
        mk(rotateHue(base.h, 25)),
      ];
    case "Split":
      return [mk(base.h), mk(rotateHue(base.h, 150)), mk(rotateHue(base.h, 210))];
    case "Square":
      return [
        mk(base.h),
        mk(rotateHue(base.h, 90)),
        mk(rotateHue(base.h, 180)),
        mk(rotateHue(base.h, 270)),
      ];
    case "Monochromatic":
      return [
        mk(base.h, clamp(base.s * 0.35, 0, 1), clamp(base.v * 0.95, 0, 1)),
        mk(base.h, clamp(base.s * 0.65, 0, 1), clamp(base.v * 0.8, 0, 1)),
        mk(base.h, base.s, base.v),
        mk(base.h, clamp(base.s * 1.0, 0, 1), clamp(base.v * 0.55, 0, 1)),
        mk(base.h, clamp(base.s * 1.0, 0, 1), clamp(base.v * 0.35, 0, 1)),
      ];
    default:
      return [mk(base.h)];
  }
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: active
          ? "1px solid rgba(0,0,0,0.08)"
          : "1px solid rgba(0,0,0,0.06)",
        background: active ? "rgba(0,0,0,0.86)" : "rgba(255,255,255,0.92)",
        color: active ? "white" : "rgba(0,0,0,0.86)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: active
          ? "0 8px 20px rgba(0,0,0,0.18)"
          : "0 6px 14px rgba(0,0,0,0.06)",
      }}
      type="button"
    >
      <span style={{ opacity: active ? 1 : 0.6 }}>{active ? "✓" : " "}</span>
      <span>{label}</span>
    </button>
  );
}

function Swatch({ hex, onCopy }: { hex: string; onCopy?: (hex: string) => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          background: hex,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      />
      <div
        style={{
          flex: 1,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
        }}
      >
        {hex}
      </div>
      {onCopy ? (
        <button
          onClick={() => onCopy(hex)}
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.06)",
            background: "rgba(0,0,0,0.04)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
          type="button"
        >
          Copy
        </button>
      ) : null}
    </div>
  );
}

export default function ColorWheelPalette(props: {
  initialColor: string;
  initialMode: Mode;
  layout: Layout;
  showSwatches: boolean;
  showCopyButtons: boolean;
  onPaletteChange?: (payload: { base: string; mode: Mode; colors: string[] }) => void;
  width?: number;
  height?: number;
}) {
  const { layout, showSwatches, showCopyButtons } = props;

  const [mode, setMode] = React.useState<Mode>(
    props.initialMode ?? "Complementary"
  );

  const initial = React.useMemo(() => {
    const rgb = hexToRgb(props.initialColor || "#DA9DFF");
    if (!rgb) {
      return { h: 280, s: 0.35, v: 0.9 };
    }
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [props.initialColor]);

  const [h, setH] = React.useState<number>(initial.h);
  const [s, setS] = React.useState<number>(initial.s);
  const [v, setV] = React.useState<number>(initial.v);

  const [hexInput, setHexInput] = React.useState<string>(
    hsvToHex(initial.h, initial.s, initial.v)
  );
  const [copyToast, setCopyToast] = React.useState<string>("");

  const wheelRef = React.useRef<HTMLDivElement | null>(null);
  const dragging = React.useRef(false);

  const baseHex = React.useMemo(() => hsvToHex(h, s, v), [h, s, v]);
  const fullBrightHex = React.useMemo(() => hsvToHex(h, s, 1), [h, s]);

  const colors = React.useMemo(() => generatePalette(mode, h, s, v), [mode, h, s, v]);

  React.useEffect(() => {
    setHexInput(baseHex);
    props.onPaletteChange?.({ base: baseHex, mode, colors });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseHex, mode, colors.join("|")]);

  const indicator = React.useMemo(() => {
    const rad = ((h - 90) * Math.PI) / 180;
    const r = s * 0.5;
    const x = 0.5 + Math.cos(rad) * r;
    const y = 0.5 + Math.sin(rad) * r;
    return { x, y };
  }, [h, s]);

  const updateFromPointer = React.useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) {
      return;
    }
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = rect.width / 2;

    const sat = clamp(dist / radius, 0, 1);

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    angle = (angle + 90 + 360) % 360;

    setH(angle);
    setS(sat);
  }, []);

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) {
        return;
      }
      updateFromPointer(e.clientX, e.clientY);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [updateFromPointer]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast("Copied ✨");
      window.setTimeout(() => setCopyToast(""), 900);
    } catch {
      setCopyToast("Copy failed 😭");
      window.setTimeout(() => setCopyToast(""), 900);
    }
  };

  const applyHex = (value: string) => {
    const cleaned = value.startsWith("#") ? value : `#${value}`;
    const rgb = hexToRgb(cleaned);
    if (!rgb) {
      return;
    }
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setH(hsv.h);
    setS(hsv.s);
    setV(hsv.v);
  };

  const isDesktop = layout === "desktop";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: isDesktop ? 18 : 14,
        borderRadius: 18,
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        color: "rgba(0,0,0,0.88)",
        position: "relative",
      }}
    >
      {copyToast ? (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.82)",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {copyToast}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          gap: isDesktop ? 18 : 14,
          height: "100%",
        }}
      >
        <div
          style={{
            width: isDesktop ? 320 : "100%",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
              Pick a color
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value.toUpperCase())}
                onBlur={() => applyHex(hexInput)}
                placeholder="#DA9DFF"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "white",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={() => copy(baseHex)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: baseHex,
                  cursor: "pointer",
                }}
                title="Copy base color"
                type="button"
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
              Pick a palette type
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              {(
                [
                  "Complementary",
                  "Triadic",
                  "Analogous",
                  "Split",
                  "Square",
                  "Monochromatic",
                ] as Mode[]
              ).map((currentMode) => (
                <ModeButton
                  key={currentMode}
                  label={currentMode}
                  active={mode === currentMode}
                  onClick={() => setMode(currentMode)}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div
            ref={wheelRef}
            onPointerDown={(e) => {
              dragging.current = true;
              updateFromPointer(e.clientX, e.clientY);
            }}
            style={{
              width: isDesktop ? 340 : "100%",
              maxWidth: 360,
              aspectRatio: "1 / 1",
              borderRadius: "999px",
              position: "relative",
              background:
                "radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 55%), conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
              border: "1px solid rgba(0,0,0,0.06)",
              cursor: "crosshair",
              userSelect: "none",
            }}
            title="Drag to pick hue/saturation"
          >
            <div
              style={{
                position: "absolute",
                left: `${indicator.x * 100}%`,
                top: `${indicator.y * 100}%`,
                transform: "translate(-50%, -50%)",
                width: 18,
                height: 18,
                borderRadius: 999,
                border: "2px solid rgba(255,255,255,0.95)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
                background: "rgba(0,0,0,0.12)",
              }}
            />
          </div>

          <div style={{ width: isDesktop ? 340 : "100%", maxWidth: 360 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 8,
                opacity: 0.85,
              }}
            >
              Brightness
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(v * 100)}
              onChange={(e) => setV(parseInt(e.target.value, 10) / 100)}
              style={{
                width: "100%",
                height: 14,
                borderRadius: 999,
                appearance: "none",
                background: `linear-gradient(90deg, #000000, ${fullBrightHex})`,
                outline: "none",
              }}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
              Base:{" "}
              <span style={{ fontFamily: "ui-monospace, monospace" }}>
                {baseHex}
              </span>
              {showCopyButtons ? (
                <>
                  {" "}
                  ·{" "}
                  <button
                    onClick={() => copy(baseHex)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontWeight: 800,
                      textDecoration: "underline",
                    }}
                    type="button"
                  >
                    copy
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {showSwatches ? (
            <div
              style={{ width: isDesktop ? 340 : "100%", maxWidth: 360, display: "grid", gap: 10 }}
            >
              {colors.map((c) => (
                <Swatch
                  key={c}
                  hex={c}
                  onCopy={showCopyButtons ? (hex) => copy(hex) : undefined}
                />
              ))}
              {showCopyButtons ? (
                <button
                  onClick={() =>
                    copy(JSON.stringify({ base: baseHex, mode, colors }, null, 2))
                  }
                  style={{
                    marginTop: 2,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                  type="button"
                >
                  Copy palette JSON
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
