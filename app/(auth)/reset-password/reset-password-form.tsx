"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ResetPasswordActionState,
  submitResetPassword,
} from "../forgot-password/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<ResetPasswordActionState, FormData>(
    submitResetPassword,
    {
      status: "idle",
    }
  );

  const tokenMissing = token.length === 0;

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-8 rounded-2xl px-4 sm:px-16">
        <div className="text-center">
          <h1 className="font-semibold text-2xl dark:text-zinc-50">
            Reset password
          </h1>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Choose a new password for your account.
          </p>
        </div>

        {tokenMissing ? (
          <p className="text-center text-red-600 text-sm">
            This reset link is missing a token. Request a new one.
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <input name="token" type="hidden" value={token} />
            <div className="flex flex-col gap-2">
              <Label
                className="font-normal text-zinc-600 dark:text-zinc-400"
                htmlFor="newPassword"
              >
                New password
              </Label>
              <Input
                className="bg-muted text-md md:text-sm"
                id="newPassword"
                name="newPassword"
                required
                type="password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label
                className="font-normal text-zinc-600 dark:text-zinc-400"
                htmlFor="confirmPassword"
              >
                Confirm new password
              </Label>
              <Input
                className="bg-muted text-md md:text-sm"
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
              />
            </div>
            <SubmitButton>Update password</SubmitButton>
          </form>
        )}

        {state.status === "success" && (
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-300">
            Password updated successfully. You can now sign in.
          </p>
        )}

        {state.status === "invalid_token" && (
          <p className="text-center text-red-600 text-sm">
            This reset link is invalid or expired. Request a new one.
          </p>
        )}

        {state.status === "invalid_data" && (
          <p className="text-center text-red-600 text-sm">
            Check your password entries and try again.
          </p>
        )}

        {state.status === "failed" && (
          <p className="text-center text-red-600 text-sm">
            We couldn&apos;t reset your password. Please try again.
          </p>
        )}

        <div className="text-center text-sm">
          <Link
            className="text-muted-foreground hover:underline"
            href="/forgot-password"
          >
            Request another reset link
          </Link>
        </div>
      </div>
    </div>
  );
}
