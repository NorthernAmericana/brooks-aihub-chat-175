"use client";

import { SettingsIcon, Trash2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import type { CustomAgent } from "@/lib/db/schema";
import { ALL_VOICE_OPTIONS } from "@/lib/voice";

interface CustomAtoSettingsPanelProps {
  userId: string;
}

export function CustomAtoSettingsPanel({
  userId: _userId,
}: CustomAtoSettingsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<CustomAgent | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [limits, setLimits] = useState<{
    limit: number;
    current: number;
    isFounder: boolean;
    isDev: boolean;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    systemPrompt: "",
    defaultVoiceId: "",
    defaultVoiceLabel: "",
    memoryScope: "ato-only" as "ato-only" | "hub-wide",
  });

  const maxPromptLength = limits?.isFounder ? 999 : 500;

  const loadCustomAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/custom-agents");
      const data = await response.json();
      if (data.agents) {
        setCustomAgents(data.agents);
      }
      if (data.limits) {
        setLimits(data.limits);
      }
    } catch (error) {
      console.error("Failed to load custom agents:", error);
      toast.error("Failed to load custom ATOs");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditAgent = useCallback((agent: CustomAgent) => {
    setEditingAgent(agent);
    setEditForm({
      name: agent.name,
      systemPrompt: agent.systemPrompt ?? "",
      defaultVoiceId: agent.defaultVoiceId ?? ALL_VOICE_OPTIONS[0].id,
      defaultVoiceLabel: agent.defaultVoiceLabel ?? ALL_VOICE_OPTIONS[0].label,
      memoryScope: agent.memoryScope,
    });
    setShowEditDialog(true);
  }, []);

  useEffect(() => {
    loadCustomAgents();
  }, [loadCustomAgents]);

  useEffect(() => {
    // Check if we should open settings for a specific agent
    const agentId = searchParams.get("agentId");
    if (agentId && customAgents.length > 0) {
      const agent = customAgents.find((a) => a.id === agentId);
      if (agent) {
        handleEditAgent(agent);
      }
    }
  }, [searchParams, customAgents, handleEditAgent]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) {
      return;
    }

    try {
      const selectedVoice = ALL_VOICE_OPTIONS.find(
        (v) => v.id === editForm.defaultVoiceId
      );

      const response = await fetch("/api/custom-agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAgent.id,
          name: editForm.name,
          systemPrompt: editForm.systemPrompt,
          defaultVoiceId: editForm.defaultVoiceId,
          defaultVoiceLabel: selectedVoice?.label,
          memoryScope: editForm.memoryScope,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update custom ATO");
      }

      toast.success("Custom ATO updated successfully");
      setShowEditDialog(false);
      setEditingAgent(null);
      loadCustomAgents();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update custom ATO"
      );
    }
  };

  const handleDeleteAgent = async (agent: CustomAgent) => {
    // Use a custom confirmation dialog instead of browser confirm
    const confirmed = window.confirm(
      `Are you sure you want to delete "/${agent.slash}/"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-agents?id=${agent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete custom ATO");
      }

      toast.success("Custom ATO deleted successfully");
      loadCustomAgents();
      router.refresh();
    } catch (_error) {
      toast.error("Failed to delete custom ATO");
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Loading custom ATOs...
      </div>
    );
  }

  if (customAgents.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No custom ATOs yet. Create one from the sidebar to get started.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {limits && (
          <div className="rounded-md border border-border bg-muted/50 p-4">
            <p className="text-sm">
              <strong>Usage this month:</strong> {limits.current}/{limits.limit}{" "}
              custom ATOs
              {limits.isFounder && " (Founder Edition)"}
              {limits.isDev && " (Dev Mode: Unlimited)"}
            </p>
          </div>
        )}

        {customAgents.map((agent) => (
          <div
            className="flex flex-col gap-3 rounded-lg border border-border p-4"
            key={agent.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">{agent.name}</p>
                <p className="font-mono text-sm text-primary">
                  /{agent.slash}/
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Voice: {agent.defaultVoiceLabel || "Default"} • Memory:{" "}
                  {agent.memoryScope === "ato-only"
                    ? "ATO-only"
                    : "Brooks AI HUB-wide"}
                </p>
                {agent.systemPrompt && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {agent.systemPrompt}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEditAgent(agent)}
                  size="sm"
                  variant="outline"
                >
                  <SettingsIcon className="size-4" />
                </Button>
                <Button
                  onClick={() => handleDeleteAgent(agent)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog onOpenChange={setShowEditDialog} open={showEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Custom ATO</DialogTitle>
            <DialogDescription>
              Update settings for /{editingAgent?.slash}/
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-name">ATO Name *</Label>
                <Input
                  id="edit-name"
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                  value={editForm.name}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-voice">Default Voice</Label>
                <Select
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, defaultVoiceId: value })
                  }
                  value={editForm.defaultVoiceId}
                >
                  <SelectTrigger id="edit-voice">
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
                <Label htmlFor="edit-prompt">
                  Prompt Instructions ({editForm.systemPrompt.length}/
                  {maxPromptLength})
                </Label>
                <Textarea
                  className="min-h-[120px]"
                  id="edit-prompt"
                  maxLength={maxPromptLength}
                  onChange={(e) =>
                    setEditForm({ ...editForm, systemPrompt: e.target.value })
                  }
                  value={editForm.systemPrompt}
                />
                <p className="text-xs text-muted-foreground">
                  {limits?.isFounder
                    ? "Founder Edition: Up to 999 characters"
                    : "Default: Up to 500 characters"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-memoryScope">Memory Scope</Label>
                <Select
                  onValueChange={(value) =>
                    setEditForm({
                      ...editForm,
                      memoryScope: value as "ato-only" | "hub-wide",
                    })
                  }
                  value={editForm.memoryScope}
                >
                  <SelectTrigger id="edit-memoryScope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ato-only">ATO-only</SelectItem>
                    <SelectItem value="hub-wide">Brooks AI HUB-wide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowEditDialog(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
