import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl px-4 text-center sm:px-16">
        <h1 className="font-semibold text-2xl dark:text-zinc-50">Reset password</h1>
        <p className="text-gray-500 text-sm dark:text-zinc-400">
          Email-based reset links are not enabled yet. If you&apos;re signed in, go to
          Chat Settings and update your password there.
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <Link className="font-semibold hover:underline" href="/settings">
            Go to Chat Settings
          </Link>
          <Link className="text-muted-foreground hover:underline" href="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
