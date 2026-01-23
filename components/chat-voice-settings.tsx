"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDefaultVoice, getVoiceOptions, type VoiceOption } from "@/lib/voice";
import { ChevronDown, ChevronUp, Volume2 } from "lucide-react";

type ChatVoiceSettingsProps = {
  chatId: string;
  routeKey: string | null;
  initialVoiceId?: string | null;
  initialVoiceLabel?: string | null;
};

export function ChatVoiceSettings({
  chatId,
  routeKey,
  initialVoiceId,
  initialVoiceLabel,
}: ChatVoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const defaultVoice = getDefaultVoice(routeKey ?? "default");
  const voiceOptions = getVoiceOptions(routeKey ?? "default");
  
  // Current voice from props or default
  const currentVoiceId = initialVoiceId ?? defaultVoice.id;
  const currentVoiceLabel = initialVoiceLabel ?? defaultVoice.label;
  
  // Local state for pending changes (before Apply is clicked)
  const [pendingVoiceId, setPendingVoiceId] = useState<string>(currentVoiceId);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if there are unsaved changes
  const hasChanges = pendingVoiceId !== currentVoiceId;
  
  // Find the pending voice option
  const pendingVoice = voiceOptions.find(v => v.id === pendingVoiceId) ?? {
    id: pendingVoiceId,
    label: currentVoiceLabel,
  };

  const handleApply = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/chat-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          ttsEnabled: true,
          ttsVoiceId: pendingVoice.id,
          ttsVoiceLabel: pendingVoice.label,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update voice settings.");
      }
      
      toast.success(`Voice changed to ${pendingVoice.label}`);
      
      // Reload the page to apply the changes
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Unable to save voice settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t border-border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 text-sm">
          <Volume2 className="h-4 w-4" />
          <span className="font-medium">Voice Settings</span>
          <span className="text-muted-foreground">
            ({currentVoiceLabel})
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select Voice</label>
            <Select
              value={pendingVoiceId}
              onValueChange={setPendingVoiceId}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voiceOptions.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.label}
                    {voice.id === defaultVoice.id && " (Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {routeKey === "namc" 
                ? "Choose between Bruce NAMC and Selena NAMC voices"
                : "Using Daniel - Brooks AI HUB voice"
              }
            </p>
          </div>
          
          {hasChanges && (
            <Button 
              onClick={handleApply} 
              disabled={isSaving}
              className="w-full"
              size="sm"
            >
              {isSaving ? "Applying..." : "Apply Voice Change"}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
