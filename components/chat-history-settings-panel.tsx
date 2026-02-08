"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type ChatHistoryRange = "day" | "week" | "month" | "six_months" | "all_time";

const RANGE_OPTIONS: Array<{ value: ChatHistoryRange; label: string }> = [
  { value: "day", label: "Last 24 hours" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "six_months", label: "Last 6 months" },
  { value: "all_time", label: "All time" },
];

const CONFIRM_TEXT = "DELETE";

export const ChatHistorySettingsPanel = () => {
  const router = useRouter();
  const [range, setRange] = useState<ChatHistoryRange>("week");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmReady = confirmInput.trim().toUpperCase() === CONFIRM_TEXT;

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setConfirmInput("");
    }
  };

  const handleDeleteChats = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/chats/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range }),
      });

      const data = (await response.json().catch(() => null)) as
        | { deletedSessions?: number; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "Unable to delete chats.");
      }

      const deletedSessions = data?.deletedSessions ?? 0;
      toast.success(`Deleted ${deletedSessions} chats.`);
      setDialogOpen(false);
      setConfirmInput("");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Unable to delete chats."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Chat History</p>
          <p className="text-xs text-muted-foreground">
            Delete chat threads only. This will not delete Memories.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="chat-history-range">Time range</Label>
          <Select
            onValueChange={(value) => setRange(value as ChatHistoryRange)}
            value={range}
          >
            <SelectTrigger id="chat-history-range">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="sm:self-end"
          onClick={() => setDialogOpen(true)}
          type="button"
          variant="destructive"
        >
          Delete chats
        </Button>
      </div>

      <Dialog onOpenChange={handleDialogChange} open={dialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete chat history?</DialogTitle>
            <DialogDescription>
              This deletes chat threads and messages. Memories are kept.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="delete-chat-confirm">
                Type {CONFIRM_TEXT} to confirm
              </Label>
              <Input
                autoComplete="off"
                id="delete-chat-confirm"
                onChange={(event) => setConfirmInput(event.target.value)}
                value={confirmInput}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;re about to delete{" "}
              {RANGE_OPTIONS.find((option) => option.value === range)?.label ??
                "selected"}{" "}
              of your chat history.
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              disabled={isDeleting}
              onClick={() => handleDialogChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!confirmReady || isDeleting}
              onClick={handleDeleteChats}
              type="button"
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Confirm delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
