import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth } from "@/app/(auth)/auth";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/brooks-ai-hub/");
  }

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-10 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">
            Welcome to Brooks AI HUB
          </h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Sign in to continue, or create a new account to get started.
          </p>
        </div>
        <div className="flex flex-col gap-3 px-4 sm:px-16">
          <Button asChild className="w-full">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href="/register">Create Account</Link>
          </Button>
          <p className="text-center text-gray-600 text-sm dark:text-zinc-400">
            Access your saved chats, settings, and more once signed in.
          </p>
        </div>
      </div>
    </div>
  );
}
