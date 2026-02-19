import { and, eq } from "drizzle-orm";
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  Link2Off,
  Trash2,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { db } from "@/lib/db";
import { atoApps, userInstalls } from "@/lib/db/schema";
import { installApp } from "@/lib/store/installApp";
import { uninstallApp } from "@/lib/store/uninstallApp";
import { disconnectSpotify } from "@/lib/spotify/disconnect";

export const dynamic = "force-dynamic";

const APP_SLUG = "spotify-music-player";

const REQUESTED_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
];

export default async function SpotifyAppDetailPage() {
  const [app, session] = await Promise.all([
    db
      .select()
      .from(atoApps)
      .where(eq(atoApps.slug, APP_SLUG))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    auth(),
  ]);

  const userId = session?.user?.id ?? null;
  const appId = app?.id ?? null;

  const [installRecord] =
    userId && appId
      ? await db
          .select()
          .from(userInstalls)
          .where(
            and(eq(userInstalls.userId, userId), eq(userInstalls.appId, appId)),
          )
          .limit(1)
      : [null];

  const isInstalled = Boolean(installRecord);
  const isInstallDisabled = isInstalled || !appId;

  const installAction = async () => {
    "use server";
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/login");
    }
    if (!appId) {
      return;
    }

    await installApp(session.user.id, appId);
    revalidatePath("/spotify-app");
    revalidatePath("/store");
  };

  const uninstallAction = async () => {
    "use server";
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/login");
    }
    if (!appId) {
      return;
    }

    await uninstallApp(session.user.id, appId);
    revalidatePath("/spotify-app");
    revalidatePath("/store");
  };

  const disconnectAction = async () => {
    "use server";
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/login");
    }

    await disconnectSpotify(session.user.id);

    revalidatePath("/spotify-app");
    revalidatePath("/Spotify");
  };

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-[#08110d] text-white">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-[#0f1f17]/90 px-4 py-3 backdrop-blur-sm">
        <Link
          aria-label="Back to store"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          href="/store"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-medium text-emerald-100">
          Spotify Music Player
        </h1>
      </div>

      <div className="app-page-content flex-1 space-y-6 overflow-y-auto px-4 py-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-black/20">
                <ImageWithFallback
                  alt="Spotify Music Player icon"
                  className="h-full w-full object-contain"
                  containerClassName="size-full"
                  height={64}
                  src={
                    app?.iconUrl ?? "/icons/spotify-music-player-appicon.svg"
                  }
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Spotify Music Player
                </h2>
                <p className="text-sm text-white/70">Music</p>
                <p className="mt-1 text-xs text-emerald-200/80">
                  Store slug: {APP_SLUG}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <form action={installAction} className="w-full md:w-auto">
              <button
                className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 md:w-56 ${
                  isInstalled
                    ? "border border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                    : "bg-emerald-500 text-black hover:bg-emerald-400"
                }`}
                disabled={isInstallDisabled}
                type="submit"
              >
                {isInstalled ? (
                  <>
                    <Check className="h-4 w-4" />
                    Installed
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Install Spotify Player
                  </>
                )}
              </button>
            </form>

            {isInstalled ? (
              <>
                <Link
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:w-56"
                  href="/Spotify"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open App UI
                </Link>
                <form action={disconnectAction} className="w-full md:w-auto">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-300/40 bg-amber-500/20 px-6 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 md:w-56"
                    type="submit"
                  >
                    <Link2Off className="h-4 w-4" />
                    Disconnect Spotify
                  </button>
                </form>
                <form action={uninstallAction} className="w-full md:w-auto">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-300/40 bg-rose-500/20 px-6 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/30 md:w-40"
                    type="submit"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Connection status
          </h3>
          <p className="mt-2 text-sm text-white/75">
            Spotify account connection is required for live playback control.
            After install, use <span className="font-mono">/Spotify/</span> in
            chat or open the app UI to start the OAuth connect flow when
            available.
          </p>
          <div className="mt-3 inline-flex rounded-full border border-amber-300/30 bg-amber-500/20 px-3 py-1 text-xs text-amber-100">
            Not connected (OAuth setup pending)
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Requested scopes
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {REQUESTED_SCOPES.map((scope) => (
              <li
                className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono"
                key={scope}
              >
                {scope}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Privacy note
          </h3>
          <p className="mt-2 text-sm text-white/75">
            This integration accesses your playback state, available devices,
            playback-control permissions, and basic account profile scopes to
            show what is currently playing and send play/pause/skip/transfer
            commands. We never store your Spotify password. OAuth token exchange
            and refresh handling run server-side, and the refresh token is
            stored encrypted at rest.
          </p>
        </section>
      </div>
    </div>
  );
}
