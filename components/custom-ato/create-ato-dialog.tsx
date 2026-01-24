"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const VOICE_OPTIONS = [
  { id: "By89qnNqll35EKDmc3Hm", label: "Bruce NAMC" },
  { id: "7fJYplvotvPf1yl7PLLP", label: "Selena NAMC" },
  { id: "QOXGBQZ2d1ykGdEdFlgp", label: "Daniel - Brooks AI HUB" },
];

const OFFICIAL_ATO_SLASHES = [
  "Brooks AI HUB",
  "BrooksAIHUB",
  "NAMC",
  "BrooksBears",
  "MyCarMindATO",
  "MyFlowerAI",
  "NAT",
  "default",
].map((s) => s.toLowerCase().replace(/\s+/g, ""));

interface CreateATODialogProps {
  onSuccess?: () => void;
}

export function CreateATODialog({ onSuccess }: CreateATODialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [voiceId, setVoiceId] = useState(VOICE_OPTIONS[2].id);
  const [instructions, setInstructions] = useState("");
  const [memoryScope, setMemoryScope] = useState<"ato-only" | "hub-wide">("ato-only");
  const [characterLimit, setCharacterLimit] = useState(500);
  const [usageInfo, setUsageInfo] = useState<{
    count: number;
    limit: number;
    tier: string;
  } | null>(null);

  // Fetch usage info when dialog opens
  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      try {
        const response = await fetch("/api/custom-atos");
        if (response.ok) {
          const data = await response.json();
          setUsageInfo({
            count: data.count,
            limit: data.limit,
            tier: data.tier,
          });
          // Set character limit based on tier
          if (data.tier === "founders") {
            setCharacterLimit(999);
          } else if (data.tier === "dev") {
            setCharacterLimit(10000);
          } else {
            setCharacterLimit(500);
          }
        }
      } catch (error) {
        console.error("Failed to fetch usage info:", error);
      }
    }
  };

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

    const slash = name.replace(/\s+/g, "");
    const normalizedSlash = slash.toLowerCase();

    // Check against official ATOs
    if (OFFICIAL_ATO_SLASHES.includes(normalizedSlash)) {
      toast.error(`"${slash}" conflicts with an official ATO. Please choose a different name.`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const selectedVoice = VOICE_OPTIONS.find((v) => v.id === voiceId);
      
      const response = await fetch("/api/custom-atos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slash,
          voiceId,
          voiceLabel: selectedVoice?.label,
          instructions,
          memoryScope,
        }),
      });

      if (response.ok) {
        toast.success("Custom ATO created successfully!");
        setOpen(false);
        setName("");
        setInstructions("");
        setMemoryScope("ato-only");
        if (onSuccess) onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create custom ATO");
      }
    } catch (error) {
      toast.error("Failed to create custom ATO");
      console.error("Error creating custom ATO:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="justify-start w-full"
          size="sm"
          variant="outline"
        >
          Make Your Own ATO /../
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom ATO</DialogTitle>
          <DialogDescription>
            Create your own unofficial ATO slash command with custom voice and instructions.
            {usageInfo && (
              <div className="mt-2 text-sm">
                <span className="font-semibold">
                  Usage: {usageInfo.count}/{usageInfo.limit === Number.POSITIVE_INFINITY ? "∞" : usageInfo.limit}
                </span>
                {" "}({usageInfo.tier} tier)
              </div>
            )}
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
              Will be used as /{name.replace(/\s+/g, "")}/
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
            <RadioGroup value={memoryScope} onValueChange={(value: "ato-only" | "hub-wide") => setMemoryScope(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ato-only" id="ato-only" />
                <Label htmlFor="ato-only" className="font-normal">
                  ATO-only (Memories are isolated to this ATO)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hub-wide" id="hub-wide" />
                <Label htmlFor="hub-wide" className="font-normal">
                  Brooks AI HUB-wide (Memories are shared across all ATOs)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create ATO"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
