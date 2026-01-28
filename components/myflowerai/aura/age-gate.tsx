"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AgeGateProps {
  onVerified: () => void;
}

const AGE_GATE_KEY = "myflowerai_age_verified";

/**
 * Age Gate Component
 * 
 * Simple 21+ age verification for cannabis-themed features.
 * This is NOT a legal age verification system - UI-level check only.
 */
export function AgeGate({ onVerified }: AgeGateProps) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    // Check if user has already verified age
    const isVerified = localStorage.getItem(AGE_GATE_KEY) === "true";
    if (!isVerified) {
      setOpen(true);
    } else {
      onVerified();
    }
  }, [onVerified]);

  const handleConfirm = () => {
    if (agreed) {
      localStorage.setItem(AGE_GATE_KEY, "true");
      setOpen(false);
      onVerified();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Age Verification Required</DialogTitle>
          <DialogDescription>
            MyFlowerAI contains cannabis-related content and features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Important Notice:</strong> Cannabis laws vary by jurisdiction.
              By continuing, you confirm that you are of legal age in your location
              and understand local cannabis regulations.
            </AlertDescription>
          </Alert>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="age-confirm"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <Label
              htmlFor="age-confirm"
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              I confirm that I am <strong>21 years of age or older</strong> (or the
              legal age in my jurisdiction) and agree to use MyFlowerAI responsibly.
            </Label>
          </div>

          <p className="text-xs text-muted-foreground">
            This is a UI-level age gate, not a legal verification system.
            MyFlowerAI provides informational content only and is not medical advice.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={!agreed}
            className="w-full"
          >
            Continue to MyFlowerAI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
