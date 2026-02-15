"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ForgotPasswordActionState,
  submitForgotPassword,
} from "./actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<ForgotPasswordActionState, FormData>(
    submitForgotPassword,
    {
      status: "idle",
    }
  );

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-8 rounded-2xl px-4 sm:px-16">
        <div className="text-center">
          <h1 className="font-semibold text-2xl dark:text-zinc-50">
            Forgot password
          </h1>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Enter your account email and we&apos;ll send a reset link if it
            exists.
          </p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="email"
            >
              Email Address
            </Label>
            <Input
              autoComplete="email"
              autoFocus
              className="bg-muted text-md md:text-sm"
              id="email"
              name="email"
              placeholder="user@acme.com"
              required
              type="email"
            />
          </div>

          <SubmitButton>Send reset link</SubmitButton>
        </form>

        {state.status === "success" && (
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-300">
            If an account exists for that email, a password reset link has been
            sent.
          </p>
        )}

        {state.status === "invalid_data" && (
          <p className="text-center text-red-600 text-sm">
            Enter a valid email.
          </p>
        )}

        {state.status === "failed" && (
          <p className="text-center text-red-600 text-sm">
            We couldn&apos;t process your request. Please try again.
          </p>
        )}

        <div className="text-center text-sm">
          <Link className="text-muted-foreground hover:underline" href="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
