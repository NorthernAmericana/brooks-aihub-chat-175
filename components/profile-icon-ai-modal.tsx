"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

const STYLE_OPTIONS = [
  "Netflix avatar",
  "Pixel",
  "Illustration",
  "3D sticker",
  "Minimal logo",
] as const;

const STYLE_COLORS: Record<(typeof STYLE_OPTIONS)[number], string> = {
  "Netflix avatar": "#0f172a",
  Pixel: "#1d4ed8",
  Illustration: "#4c1d95",
  "3D sticker": "#0f766e",
  "Minimal logo": "#111827",
};

type ProfileIconAiModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseIcon?: (iconSrc: string) => void;
};

const buildIconSvg = (prompt: string, style: (typeof STYLE_OPTIONS)[number]) => {
  const description = prompt.trim() || "Your icon";
  const background = STYLE_COLORS[style];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="#9333ea" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="64" fill="url(#bg)" />
      <circle cx="105" cy="130" r="44" fill="rgba(255,255,255,0.25)" />
      <circle cx="215" cy="120" r="58" fill="rgba(255,255,255,0.18)" />
      <rect x="76" y="196" width="168" height="64" rx="32" fill="rgba(255,255,255,0.2)" />
      <text x="50%" y="52%" text-anchor="middle" fill="#f8fafc" font-size="22" font-family="Inter, system-ui, sans-serif">
        ${style}
      </text>
      <text x="50%" y="64%" text-anchor="middle" fill="#e2e8f0" font-size="14" font-family="Inter, system-ui, sans-serif">
        ${description}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export function ProfileIconAiModal({
  open,
  onOpenChange,
  onUseIcon,
}: ProfileIconAiModalProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLE_OPTIONS)[number]>(
    STYLE_OPTIONS[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const isErrorPrompt = useMemo(() => {
    const lowered = prompt.toLowerCase();
    return lowered.includes("error") || lowered.includes("fail");
  }, [prompt]);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setStyle(STYLE_OPTIONS[0]);
      setIsGenerating(false);
      setError(null);
      setPreviewSrc(null);
    }
  }, [open]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setPreviewSrc(null);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 900);
      });

      if (isErrorPrompt) {
        throw new Error("Generation failed");
      }

      setPreviewSrc(buildIconSvg(prompt, style));
    } catch (err) {
      setError(
        "We couldn't generate an icon this time. Try another description or style."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseIcon = () => {
    if (previewSrc) {
      onUseIcon?.(previewSrc);
      onOpenChange(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate a profile icon</DialogTitle>
          <DialogDescription>
            Describe the vibe you want and pick a style. We’ll generate a fresh
            icon for your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="profile-icon-prompt">Icon description</Label>
            <Textarea
              id="profile-icon-prompt"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. forest tech mascot, cozy pixel bear, indie noir investigator, etc."
              value={prompt}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-icon-style">Style</Label>
            <Select
              onValueChange={(value) =>
                setStyle(value as (typeof STYLE_OPTIONS)[number])
              }
              value={style}
            >
              <SelectTrigger id="profile-icon-style">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Preview</p>
              <Button
                disabled={isGenerating}
                onClick={handleGenerate}
                type="button"
                variant="secondary"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-background">
              {previewSrc ? (
                <img
                  alt="Generated profile icon preview"
                  className="h-40 w-40 rounded-2xl object-cover"
                  src={previewSrc}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your generated icon will appear here.
                </p>
              )}
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                disabled={!previewSrc || isGenerating}
                onClick={handleUseIcon}
                type="button"
              >
                Use this icon
              </Button>
              <Button
                disabled={isGenerating}
                onClick={handleGenerate}
                type="button"
                variant="outline"
              >
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
