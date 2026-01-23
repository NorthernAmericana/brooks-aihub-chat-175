"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SpeakerIcon } from "@/components/icons";

type MemoryCardProps = {
  id: string;
  route: string | null;
  agentLabel: string;
  rawText: string;
  sourceUri: string;
  savedDate: string;
  voiceId: string;
};

export function MemoryCard({
  id,
  route,
  agentLabel,
  rawText,
  sourceUri,
  savedDate,
  voiceId,
}: MemoryCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (isSpeaking) {
      toast.error("Already playing audio.");
      return;
    }

    setIsSpeaking(true);
    const loadingToast = toast.loading("Generating speech...");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);

      const response = await fetch("/api/tts/elevenlabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, voiceId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message =
          errorPayload?.error ?? "Unable to generate speech right now.";
        toast.error(message);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Ensure audio is preloaded to prevent glitching
      audio.preload = "auto";
      audio.autoplay = false;

      // Handle audio cleanup
      const cleanupAudio = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };

      audio.addEventListener("ended", cleanupAudio);
      audio.addEventListener("error", () => {
        cleanupAudio();
        toast.error("Audio playback failed.");
      });

      // Wait for audio to be ready before playing to prevent glitches
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener("canplaythrough", () => resolve(), {
          once: true,
        });
        audio.addEventListener("error", reject, { once: true });
        audio.load();
      });

      await audio.play();
      toast.success("Playing memory.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.error("Speech request timed out.");
      } else {
        toast.error("Unable to generate speech right now.");
      }
    } finally {
      setIsSpeaking(false);
      toast.dismiss(loadingToast);
    }
  };

  return (
    <Card key={id}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{route}</Badge>
          <Badge variant="secondary">{agentLabel}</Badge>
          <span className="text-xs text-muted-foreground">
            Saved {savedDate}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm text-foreground">{rawText}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSpeak}
            disabled={isSpeaking}
            className="shrink-0"
            title="Speak memory"
          >
            <SpeakerIcon />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Source: {sourceUri}
        </div>
      </CardContent>
    </Card>
  );
}
