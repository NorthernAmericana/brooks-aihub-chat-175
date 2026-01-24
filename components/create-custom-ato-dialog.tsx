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
  DialogTrigger,
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

type CreateCustomAtoDialogProps = {
  onSuccess?: () => void;
  promptInstructionsLimit?: number;
};

export function CreateCustomAtoDialog({
  onSuccess,
  promptInstructionsLimit = 200,
}: CreateCustomAtoDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slash, setSlash] = useState("");
  const [voiceId, setVoiceId] = useState(ALL_VOICE_OPTIONS[0].id);
  const [voiceLabel, setVoiceLabel] = useState(ALL_VOICE_OPTIONS[0].label);
  const [promptInstructions, setPromptInstructions] = useState("");
  const [memoryScope, setMemoryScope] = useState<"ato-only" | "hub-wide">(
    "ato-only"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleVoiceChange = (value: string) => {
    const voice = ALL_VOICE_OPTIONS.find((v) => v.id === value);
    if (voice) {
      setVoiceId(voice.id);
      setVoiceLabel(voice.label);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/custom-atos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slash,
          voiceId,
          voiceLabel,
          promptInstructions,
          memoryScope,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create custom ATO");
      }

      toast.success("Custom ATO created successfully!");
      setOpen(false);
      setName("");
      setSlash("");
      setPromptInstructions("");
      setMemoryScope("ato-only");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create custom ATO:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create custom ATO"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="justify-start" size="sm" variant="outline">
          Make your own ATO /../
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Custom ATO</DialogTitle>
            <DialogDescription>
              Create your own custom Autonomous Technological Organism with
              personalized settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ATO Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom ATO"
                required
                value={name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slash">Slash Command</Label>
              <Input
                id="slash"
                onChange={(e) => setSlash(e.target.value)}
                placeholder="MyCustomATO"
                required
                value={slash}
              />
              <p className="text-muted-foreground text-xs">
                Will be used as /{slash}/
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="voice">Default Voice</Label>
              <Select onValueChange={handleVoiceChange} value={voiceId}>
                <SelectTrigger id="voice">
                  <SelectValue />
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
            <div className="grid gap-2">
              <Label htmlFor="instructions">
                Prompt Instructions ({promptInstructions.length}/
                {promptInstructionsLimit})
              </Label>
              <Textarea
                id="instructions"
                maxLength={promptInstructionsLimit}
                onChange={(e) => setPromptInstructions(e.target.value)}
                placeholder="Enter custom instructions for your ATO..."
                rows={4}
                value={promptInstructions}
              />
              <p className="text-muted-foreground text-xs">
                Define how your ATO should behave and respond
              </p>
            </div>
            <div className="grid gap-2">
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
              <p className="text-muted-foreground text-xs">
                Choose whether memories are shared across all ATOs or kept
                private to this ATO
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isLoading} type="submit">
              {isLoading ? "Creating..." : "Create ATO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
