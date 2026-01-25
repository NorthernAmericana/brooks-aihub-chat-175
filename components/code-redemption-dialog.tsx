"use client";

import { useState } from "react";
import { toast } from "@/components/toast";
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

interface CodeRedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CodeRedemptionDialog({
  open,
  onOpenChange,
}: CodeRedemptionDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast({
        type: "error",
        description: "Please enter a code",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/redeem-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to redeem code");
      }

      toast({
        type: "success",
        description: data.message || "Code redeemed successfully!",
      });

      setCode("");
      onOpenChange(false);
    } catch (error) {
      console.error("Redemption error:", error);
      toast({
        type: "error",
        description:
          error instanceof Error ? error.message : "Failed to redeem code",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redeem Code</DialogTitle>
          <DialogDescription>
            Enter a redemption code to unlock content or features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                autoComplete="off"
                disabled={loading}
                id="code"
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your code"
                value={code}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={loading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={loading} type="submit">
              {loading ? "Redeeming..." : "Redeem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
