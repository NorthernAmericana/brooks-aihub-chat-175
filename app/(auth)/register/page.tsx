"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type RegisterActionState, register } from "../actions";
import { waitForAuthenticatedSession } from "../session";

export default function Page() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [email, setEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: "idle",
    }
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "user_exists") {
      setIsRedirecting(false);
      toast({ type: "error", description: "Account already exists!" });
    } else if (state.status === "failed") {
      setIsRedirecting(false);
      toast({ type: "error", description: "Failed to create account!" });
    } else if (state.status === "invalid_data") {
      setIsRedirecting(false);
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "password_mismatch") {
      setIsRedirecting(false);
      toast({
        type: "error",
        description: "Passwords do not match. Please try again.",
      });
    } else if (state.status === "success") {
      void (async () => {
        toast({ type: "success", description: "Account created successfully!" });

        setIsRedirecting(true);

        await updateSession();

        const isAuthenticated = await waitForAuthenticatedSession();

        if (!isAuthenticated) {
          setIsRedirecting(false);
          toast({
            type: "error",
            description:
              "Account was created, but session could not be established. Please sign in.",
          });

          return;
        }

        router.replace("/brooks-ai-hub/");
        router.refresh();
      })();
    } else {
      setIsRedirecting(false);
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign Up</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email} mode="register">
          <SubmitButton isRedirecting={isRedirecting}>Sign Up</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/login"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
