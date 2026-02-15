"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [email, setEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  const waitForAuthenticatedSession = async (timeoutMs = 3000) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const session = await getSession();

      if (session) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return false;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "failed") {
      setIsRedirecting(false);
      toast({
        type: "error",
        description: "Invalid credentials!",
      });
    } else if (state.status === "invalid_data") {
      setIsRedirecting(false);
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "success") {
      void (async () => {
        setIsRedirecting(true);

        await updateSession();

        const isAuthenticated = await waitForAuthenticatedSession();

        if (!isAuthenticated) {
          setIsRedirecting(false);
          toast({
            type: "error",
            description: "Sign in succeeded, but session could not be established. Please try again.",
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
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isRedirecting={isRedirecting}>Sign in</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/register"
            >
              Sign up
            </Link>
            {" for free."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
