"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDefaultVoice, getVoiceOptions, type VoiceOption } from "@/lib/voice";

type MemoryVoiceSelectorProps = {
  onVoiceChange: (voiceId: string) => void;
};

export function MemoryVoiceSelector({ onVoiceChange }: MemoryVoiceSelectorProps) {
  // Always use Daniel voice for memories (non-NAMC route)
  const defaultVoice = getDefaultVoice("default");
  const voiceOptions = getVoiceOptions("default");
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(defaultVoice);

  const handleVoiceChange = (voiceId: string) => {
    const voice = voiceOptions.find((v) => v.id === voiceId);
    if (voice) {
      setSelectedVoice(voice);
      onVoiceChange(voiceId);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="memory-voice-select" className="text-sm font-medium">
        Voice:
      </Label>
      <Select
        value={selectedVoice.id}
        onValueChange={handleVoiceChange}
      >
        <SelectTrigger id="memory-voice-select" className="w-[240px]">
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {voiceOptions.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              {voice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
