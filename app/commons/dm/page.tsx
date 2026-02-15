import Link from "next/link";
import { MessageCircle, User } from "lucide-react";
import { auth } from "@/app/(auth)/auth";
import { listPrivateDmCampfiresForMember } from "@/lib/db/commons-queries";

function getDmIdFromPath(path: string): string {
  if (!path.startsWith("dm/")) {
    return path;
  }

  return path.slice(3);
}

export default async function PrivateDmLobbyPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              NAT: Commons · Private DM Campfires
            </p>
            <h1 className="text-4xl font-semibold">Choose a Campfire to join.</h1>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Sign in to view private campfires
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Your DM campfires are only visible to invited members.
            </p>
            <Link
              className="mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              href={`/api/auth/guest?redirectUrl=${encodeURIComponent("/commons/dm")}`}
            >
              Continue to sign in
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const campfires = await listPrivateDmCampfiresForMember(session.user.id);

  return (
    <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            NAT: Commons · Private DM Campfires
          </p>
          <h1 className="text-4xl font-semibold">Choose a Campfire to join.</h1>
        </header>

        {campfires.length > 0 ? (
          <section className="space-y-4">
            {campfires.map((campfire) => (
              <Link
                className="group flex items-center gap-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm transition hover:border-slate-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                href={`/commons/dm/${encodeURIComponent(getDmIdFromPath(campfire.path))}`}
                key={campfire.id}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  <MessageCircle className="h-7 w-7" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {campfire.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Last active {new Date(campfire.lastActivityAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-2xl font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    <User className="h-5 w-5" />
                    <span>
                      {campfire.invitedCount}/{campfire.invitedLimit}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {campfire.accessLabel}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No DM campfires yet
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Create a direct campfire to start private conversations.
            </p>
            <Link
              className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              href="/commons/create"
            >
              Create campfire
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
