"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SpeakerIcon } from "@/components/icons";
import { playTextToSpeech } from "@/lib/audio";

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
      await playTextToSpeech(rawText, voiceId);
      toast.success("Playing memory.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to generate speech right now.";
      toast.error(message);
    } finally {
      setIsSpeaking(false);
      toast.dismiss(loadingToast);
    }
  };

  return (
    <Card>
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
