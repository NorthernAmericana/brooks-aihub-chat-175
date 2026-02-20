import { and, eq, isNull } from "drizzle-orm";
import { ArrowLeft, ExternalLink, Link2, Link2Off } from "lucide-react";
import Link from "next/link";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const REQUESTED_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
];

export default async function SpotifyIntegrationSettingsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [connectionRecord] = userId
    ? await db
        .select({ id: spotifyAccounts.id })
        .from(spotifyAccounts)
        .where(
          and(
            eq(spotifyAccounts.userId, userId),
            isNull(spotifyAccounts.revokedAt),
          ),
        )
        .limit(1)
    : [null];

  const isConnected = Boolean(connectionRecord);

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-[#08110d] text-white">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-[#0f1f17]/90 px-4 py-3 backdrop-blur-sm">
        <Link
          aria-label="Back to home"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          href="/"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-medium text-emerald-100/90">
          Spotify Integration Settings
        </h1>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-3xl border border-emerald-300/20 bg-[#10251a]/80 p-5 shadow-[0_24px_80px_-32px_rgba(16,185,129,0.45)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                Status
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-emerald-50">
                {isConnected ? "Connected" : "Not connected"}
              </h2>
              <p className="mt-2 text-sm text-emerald-100/75">
                Manage OAuth access for Spotify playback controls in Brooks AI HUB.
              </p>
            </div>
            <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-emerald-100/85">
              Route: /Spotify
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {isConnected ? (
              <form action="/api/spotify/disconnect" method="post">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition hover:bg-amber-500/30"
                  type="submit"
                >
                  <Link2Off className="h-3.5 w-3.5" />
                  Disconnect Spotify
                </button>
              </form>
            ) : (
              <a
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-500/30"
                href="/api/spotify/login"
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect Spotify
              </a>
            )}

            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 transition hover:bg-white/10"
              href="/Spotify"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Player
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/75 sm:p-5">
          <p className="font-semibold uppercase tracking-[0.18em] text-white/70">
            Requested Spotify scopes
          </p>
          <ul className="mt-3 space-y-2">
            {REQUESTED_SCOPES.map((scope) => (
              <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" key={scope}>
                {scope}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
