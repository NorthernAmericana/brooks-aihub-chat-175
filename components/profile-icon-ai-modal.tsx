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
  "Pixel",
  "Illustration",
  "3D sticker",
  "Minimal logo",
] as const;

type ProfileIconAiModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseIcon?: (iconSrc: string) => void;
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
  const [isSaving, setIsSaving] = useState(false);
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
      setIsSaving(false);
      setError(null);
      setPreviewSrc(null);
    }
  }, [open]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setPreviewSrc(null);

    try {
      if (!prompt.trim()) {
        setError("Add a description so we can generate the icon.");
        return;
      }

      if (isErrorPrompt) {
        throw new Error("Generation failed");
      }

      const response = await fetch("/api/profile/generate-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image generation failed");
      }

      if (!data.image_url) {
        throw new Error("Image generation returned no image");
      }

      setPreviewSrc(data.image_url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't generate an icon this time. Try another description or style."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseIcon = async () => {
    if (!previewSrc || isSaving) {
      return;
    }

    setError(null);
    onUseIcon?.(previewSrc);
    setIsSaving(true);

    try {
      const response = await fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: previewSrc }),
      });

      if (!response.ok) {
        throw new Error("Failed to save avatar");
      }

      onOpenChange(false);
    } catch (_err) {
      setError("We couldn't save that icon. Please try again.");
    } finally {
      setIsSaving(false);
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
                disabled={!previewSrc || isGenerating || isSaving}
                onClick={handleUseIcon}
                type="button"
              >
                {isSaving ? "Saving..." : "Use this icon"}
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
