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
import type { CustomAto } from "@/lib/db/schema";

type CustomAtoDialogProps = {
  trigger: React.ReactNode;
  ato?: CustomAto;
  onSuccess?: () => void;
};

export function CustomAtoDialog({
  trigger,
  ato,
  onSuccess,
}: CustomAtoDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(ato?.name || "");
  const [slashRoute, setSlashRoute] = useState(ato?.slashRoute || "");
  const [voiceId, setVoiceId] = useState(ato?.voiceId || "");
  const [promptInstructions, setPromptInstructions] = useState(
    ato?.promptInstructions || ""
  );
  const [memoryScope, setMemoryScope] = useState<"ato-only" | "hub-wide">(
    ato?.memoryScope || "ato-only"
  );

  const isEdit = !!ato;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedVoice = ALL_VOICE_OPTIONS.find((v) => v.id === voiceId);
      
      const payload = {
        ...(isEdit ? { id: ato.id } : {}),
        name,
        slashRoute,
        voiceId: voiceId || undefined,
        voiceLabel: selectedVoice?.label || undefined,
        promptInstructions: promptInstructions || undefined,
        memoryScope,
      };

      const response = await fetch("/api/custom-ato", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save custom ATO");
      }

      toast.success(
        isEdit ? "ATO updated successfully" : "ATO created successfully"
      );
      setOpen(false);
      onSuccess?.();
      
      // Reset form if creating new
      if (!isEdit) {
        setName("");
        setSlashRoute("");
        setVoiceId("");
        setPromptInstructions("");
        setMemoryScope("ato-only");
      }
    } catch (error) {
      console.error("Error saving ATO:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save custom ATO"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Custom ATO" : "Make your own ATO"}
            </DialogTitle>
            <DialogDescription>
              Create a custom AI assistant with your own settings and personality.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ATO Name</Label>
              <Input
                id="name"
                placeholder="My Custom Assistant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="slashRoute">Slash Route</Label>
                <Input
                  id="slashRoute"
                  placeholder="MyCustomATO"
                  value={slashRoute}
                  onChange={(e) => setSlashRoute(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Will be used as /{slashRoute}/
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="voice">Default Voice</Label>
              <Select value={voiceId} onValueChange={setVoiceId}>
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
            <div className="grid gap-2">
              <Label htmlFor="promptInstructions">
                Prompt Instructions
                <span className="ml-2 text-xs text-muted-foreground">
                  ({promptInstructions.length} chars)
                </span>
              </Label>
              <Textarea
                id="promptInstructions"
                placeholder="You are a helpful assistant that..."
                value={promptInstructions}
                onChange={(e) => setPromptInstructions(e.target.value)}
                rows={4}
                maxLength={999}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memoryScope">Memory Scope</Label>
              <Select
                value={memoryScope}
                onValueChange={(value: "ato-only" | "hub-wide") =>
                  setMemoryScope(value)
                }
              >
                <SelectTrigger id="memoryScope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ato-only">ATO-only</SelectItem>
                  <SelectItem value="hub-wide">Brooks AI HUB–wide</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose whether memories are specific to this ATO or shared across Brooks AI HUB.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update ATO" : "Create ATO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
