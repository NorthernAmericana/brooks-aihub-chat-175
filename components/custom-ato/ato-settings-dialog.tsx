"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CustomATO } from "@/lib/db/schema";
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

const VOICE_OPTIONS = [
  { id: "By89qnNqll35EKDmc3Hm", label: "Bruce NAMC" },
  { id: "7fJYplvotvPf1yl7PLLP", label: "Selena NAMC" },
  { id: "QOXGBQZ2d1ykGdEdFlgp", label: "Daniel - Brooks AI HUB" },
];

interface ATOSettingsDialogProps {
  ato: CustomATO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function ATOSettingsDialog({
  ato,
  open,
  onOpenChange,
  onUpdate,
}: ATOSettingsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [name, setName] = useState(ato.name);
  const [voiceId, setVoiceId] = useState(ato.voiceId);
  const [instructions, setInstructions] = useState(ato.instructions);
  const [memoryScope, setMemoryScope] = useState<"ato-only" | "hub-wide">(
    ato.memoryScope || "ato-only"
  );
  const [characterLimit, setCharacterLimit] = useState(500);

  useEffect(() => {
    setName(ato.name);
    setVoiceId(ato.voiceId);
    setInstructions(ato.instructions);
    setMemoryScope(ato.memoryScope || "ato-only");
  }, [ato]);

  useEffect(() => {
    // Fetch user tier to set character limit
    const fetchTier = async () => {
      try {
        const response = await fetch("/api/custom-atos");
        if (response.ok) {
          const data = await response.json();
          if (data.tier === "founders") {
            setCharacterLimit(999);
          } else if (data.tier === "dev") {
            setCharacterLimit(10000);
          } else {
            setCharacterLimit(500);
          }
        }
      } catch (error) {
        console.error("Failed to fetch tier:", error);
      }
    };
    if (open) {
      fetchTier();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !instructions.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (instructions.length > characterLimit) {
      toast.error(`Instructions cannot exceed ${characterLimit} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedVoice = VOICE_OPTIONS.find((v) => v.id === voiceId);

      const response = await fetch(`/api/custom-atos/${ato.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          voiceId,
          voiceLabel: selectedVoice?.label,
          instructions,
          memoryScope,
        }),
      });

      if (response.ok) {
        toast.success("Custom ATO updated successfully!");
        onOpenChange(false);
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update custom ATO");
      }
    } catch (error) {
      toast.error("Failed to update custom ATO");
      console.error("Error updating custom ATO:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/custom-atos/${ato.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Custom ATO deleted successfully!");
        setShowDeleteDialog(false);
        onOpenChange(false);
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to delete custom ATO");
      }
    } catch (error) {
      toast.error("Failed to delete custom ATO");
      console.error("Error deleting custom ATO:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Custom ATO</DialogTitle>
            <DialogDescription>
              Update your custom ATO settings and instructions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                ATO Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., MyPersonalAssistant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Slash command: /{ato.slash}/
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice">
                Default Voice <span className="text-destructive">*</span>
              </Label>
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger id="voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">
                Instructions <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="instructions"
                placeholder="Enter the system prompt/instructions for your ATO..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                {instructions.length}/{characterLimit} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Memory Scope <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={memoryScope}
                onValueChange={(value: any) => setMemoryScope(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ato-only" id="edit-ato-only" />
                  <Label htmlFor="edit-ato-only" className="font-normal">
                    ATO-only (Memories are isolated to this ATO)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hub-wide" id="edit-hub-wide" />
                  <Label htmlFor="edit-hub-wide" className="font-normal">
                    Brooks AI HUB-wide (Memories are shared across all ATOs)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSubmitting}
              >
                Delete ATO
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom ATO?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              custom ATO "{ato.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
