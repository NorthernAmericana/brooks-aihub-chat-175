"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { ALL_VOICE_OPTIONS } from "@/lib/voice";

interface CreateCustomAtoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCustomAtoModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCustomAtoModalProps) {
  const [name, setName] = useState("");
  const [slash, setSlash] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [defaultVoiceId, setDefaultVoiceId] = useState(ALL_VOICE_OPTIONS[0].id);
  const [memoryScope, setMemoryScope] = useState<"ato-only" | "hub-wide">(
    "ato-only"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limits, setLimits] = useState<{
    limit: number;
    current: number;
    isFounder: boolean;
    isDev: boolean;
  } | null>(null);

  const maxPromptLength = limits?.isFounder ? 999 : 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedVoice = ALL_VOICE_OPTIONS.find(
        (v) => v.id === defaultVoiceId
      );

      const response = await fetch("/api/custom-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slash,
          systemPrompt,
          defaultVoiceId,
          defaultVoiceLabel: selectedVoice?.label,
          memoryScope,
          tools: [
            "createDocument",
            "updateDocument",
            "requestSuggestions",
            "saveMemory",
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create custom ATO");
      }

      toast.success("Custom ATO created successfully!");
      onSuccess();
      // Reset form
      setName("");
      setSlash("");
      setSystemPrompt("");
      setDefaultVoiceId(ALL_VOICE_OPTIONS[0].id);
      setMemoryScope("ato-only");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create custom ATO"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load limits when dialog opens
  const handleOpenChange = async (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen && !limits) {
      try {
        const response = await fetch("/api/custom-agents");
        const data = await response.json();
        if (data.limits) {
          setLimits(data.limits);
        }
      } catch (error) {
        console.error("Failed to load limits:", error);
      }
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Make your own ATO /../</DialogTitle>
          <DialogDescription>
            Create a custom ATO slash for personalized AI interactions.
            {limits && !limits.isDev && (
              <span className="mt-1 block text-sm">
                {limits.current}/{limits.limit} custom ATOs used this month
                {limits.isFounder && " (Founder Edition)"}
              </span>
            )}
            {limits?.isDev && (
              <span className="mt-1 block text-sm text-green-600">
                Dev mode: unlimited custom ATOs
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">ATO Name *</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom ATO"
                required
                value={name}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="slash">Slash Route *</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="slash"
                  onChange={(e) => {
                    const cleaned = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "");
                    setSlash(cleaned);
                  }}
                  placeholder="mycustomato"
                  required
                  value={slash}
                />
                <span className="text-muted-foreground">/</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="voice">Default Voice</Label>
              <Select onValueChange={setDefaultVoiceId} value={defaultVoiceId}>
                <SelectTrigger id="voice">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="prompt">
                Prompt Instructions ({systemPrompt.length}/{maxPromptLength})
              </Label>
              <Textarea
                className="min-h-[120px]"
                id="prompt"
                maxLength={maxPromptLength}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter custom instructions for your ATO..."
                value={systemPrompt}
              />
              <p className="text-xs text-muted-foreground">
                {limits?.isFounder
                  ? "Founder Edition: Up to 999 characters"
                  : "Default: Up to 500 characters"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="memoryScope">Memory Scope</Label>
              <Select
                onValueChange={(value) =>
                  setMemoryScope(value as "ato-only" | "hub-wide")
                }
                value={memoryScope}
              >
                <SelectTrigger id="memoryScope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ato-only">ATO-only</SelectItem>
                  <SelectItem value="hub-wide">Brooks AI HUB-wide</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose whether memories are specific to this ATO or shared
                across the hub
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting || !name || !slash} type="submit">
              {isSubmitting ? "Creating..." : "Create ATO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
