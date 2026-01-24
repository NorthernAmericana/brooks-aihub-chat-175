"use client";

import { SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { CustomAto } from "@/lib/db/schema";
import { ALL_VOICE_OPTIONS } from "@/lib/voice";

type CustomAtoSettingsDialogProps = {
  atoId: string;
  promptInstructionsLimit?: number;
  onSuccess?: () => void;
};

export function CustomAtoSettingsDialog({
  atoId,
  promptInstructionsLimit = 200,
  onSuccess,
}: CustomAtoSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [ato, setAto] = useState<CustomAto | null>(null);
  const [name, setName] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voiceLabel, setVoiceLabel] = useState("");
  const [promptInstructions, setPromptInstructions] = useState("");
  const [memoryScope, setMemoryScope] = useState<"ato-only" | "hub-wide">(
    "ato-only"
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchAto = useCallback(async () => {
    try {
      const response = await fetch("/api/custom-atos");
      if (!response.ok) {
        throw new Error("Failed to fetch ATO");
      }
      const data = await response.json();
      const foundAto = data.find((a: CustomAto) => a.id === atoId);
      if (foundAto) {
        setAto(foundAto);
        setName(foundAto.name);
        setVoiceId(foundAto.voiceId || ALL_VOICE_OPTIONS[0].id);
        setVoiceLabel(foundAto.voiceLabel || ALL_VOICE_OPTIONS[0].label);
        setPromptInstructions(foundAto.promptInstructions || "");
        setMemoryScope(foundAto.memoryScope);
      }
    } catch (error) {
      console.error("Failed to fetch ATO:", error);
      toast.error("Failed to load ATO settings");
    }
  }, [atoId]);

  useEffect(() => {
    if (open) {
      fetchAto();
    }
  }, [open, fetchAto]);

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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: atoId,
          name,
          voiceId,
          voiceLabel,
          promptInstructions,
          memoryScope,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update custom ATO");
      }

      toast.success("Custom ATO updated successfully!");
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to update custom ATO:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update custom ATO"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/custom-atos?id=${atoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete custom ATO");
      }

      toast.success("Custom ATO deleted successfully!");
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to delete custom ATO:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete custom ATO"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="h-8 px-2 md:h-fit md:px-2" size="sm" variant="ghost">
          <SettingsIcon className="h-4 w-4" />
          <span className="sr-only">ATO Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Custom ATO Settings</DialogTitle>
            <DialogDescription>
              Edit settings for your custom ATO
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ATO Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                required
                value={name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slash">Slash Command</Label>
              <Input disabled id="slash" value={ato?.slash || ""} />
              <p className="text-muted-foreground text-xs">
                Slash command cannot be changed
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
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              className="sm:flex-1"
              disabled={isLoading}
              onClick={() => setShowDeleteDialog(true)}
              type="button"
              variant="destructive"
            >
              Delete ATO
            </Button>
            <div className="flex gap-2 sm:flex-1">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button className="flex-1" disabled={isLoading} type="submit">
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom ATO</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this custom ATO? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
