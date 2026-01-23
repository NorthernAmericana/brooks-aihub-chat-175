"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MemoryCard } from "@/components/memory-card";
import { MemoryVoiceSelector } from "@/components/memory-voice-selector";
import { getDefaultVoice } from "@/lib/voice";

type Memory = {
  id: string;
  route: string | null;
  agentLabel: string;
  rawText: string;
  sourceUri: string;
  savedDate: string;
};

type MemoriesListProps = {
  memories: Memory[];
};

export function MemoriesList({ memories }: MemoriesListProps) {
  // Always use Daniel voice for memories (non-NAMC route)
  const defaultVoice = getDefaultVoice("default");
  const [selectedVoiceId, setSelectedVoiceId] = useState(defaultVoice.id);

  if (memories.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No approved memories yet. When you approve a saved memory in chat,
          it will show up here with its route and agent.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MemoryVoiceSelector onVoiceChange={setSelectedVoiceId} />
      </div>
      <div className="grid gap-4">
        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            id={memory.id}
            route={memory.route}
            agentLabel={memory.agentLabel}
            rawText={memory.rawText}
            sourceUri={memory.sourceUri}
            savedDate={memory.savedDate}
            voiceId={selectedVoiceId}
          />
        ))}
      </div>
    </div>
  );
}
