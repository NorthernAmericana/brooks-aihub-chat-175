"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  type ChangePasswordActionState,
  changePassword,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ChangePasswordActionState = {
  status: "idle",
};

export function PasswordSettingsPanel() {
  const [state, formAction, isPending] = useActionState(
    changePassword,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Password updated.");
      return;
    }

    if (state.status === "invalid_current_password") {
      toast.error("Current password is incorrect.");
      return;
    }

    if (state.status === "invalid_data") {
      toast.error(
        "Please use a strong password and ensure both new password fields match."
      );
      return;
    }

    if (state.status === "unauthenticated") {
      toast.error("Please sign in and try again.");
      return;
    }

    if (state.status === "failed") {
      toast.error("Unable to update password.");
    }
  }, [state.status]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div>
        <p className="font-medium">Password</p>
        <p className="text-xs text-muted-foreground">
          Use at least 8 characters with uppercase, lowercase, number, and symbol.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" required type="password" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" required type="password" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmNewPassword">Confirm new password</Label>
        <Input
          id="confirmNewPassword"
          name="confirmNewPassword"
          required
          type="password"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button disabled={isPending} size="sm" type="submit">
          {isPending ? "Updating..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
