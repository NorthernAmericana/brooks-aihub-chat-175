import { ArrowLeft, Check, Download, ExternalLink, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { atoApps, userInstalls } from "@/lib/db/schema";
import { installApp } from "@/lib/store/installApp";
import { uninstallApp } from "@/lib/store/uninstallApp";

export const dynamic = "force-dynamic";

const APP_SLUG = "brooksbears";

type AppStats = {
  rating: number | null;
  ratingCount: number;
  downloads: number;
};

const formatDownloads = (downloads: number) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(downloads);

const formatRating = (rating: number) => rating.toFixed(1);

const getAppStats = async (): Promise<AppStats | null> => {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000";
  const response = await fetch(
    `${baseUrl}/api/reviews/stats?appSlug=${APP_SLUG}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { stats?: AppStats };
  return data.stats ?? null;
};

export default async function BrooksBearsAppPage() {
  const [app, session, stats] = await Promise.all([
    db
      .select()
      .from(atoApps)
      .where(eq(atoApps.slug, APP_SLUG))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    auth(),
    getAppStats(),
  ]);

  const userId = session?.user?.id ?? null;
  const appId = app?.id ?? null;

  const [installRecord] =
    userId && appId
      ? await db
          .select()
          .from(userInstalls)
          .where(and(eq(userInstalls.userId, userId), eq(userInstalls.appId, appId)))
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
    revalidatePath("/brooksbears-app");
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
    revalidatePath("/brooksbears-app");
  };

  const ratingLabel =
    stats?.rating != null ? `Rating ${formatRating(stats.rating)}` : "New";
  const downloadsLabel = stats
    ? `${formatDownloads(stats.downloads)} downloads`
    : "Downloads unavailable";

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#1b1118] via-[#160e14] to-[#120c16] text-white">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#1b1118]/90 px-4 py-3 backdrop-blur-sm">
        <Link
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          href="/brooks-ai-hub"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <Image
              alt={`${app?.name ?? "BrooksBears"} icon`}
              className="h-full w-full object-cover"
              height={36}
              src={app?.iconUrl ?? "/icons/brooksbears-appicon.png"}
              width={36}
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {app?.name ?? "BrooksBears"}
            </h1>
            <p className="text-xs text-white/60">Companion chats & stories</p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 space-y-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                <Image
                  alt={`${app?.name ?? "BrooksBears"} icon`}
                  className="h-full w-full object-cover"
                  height={64}
                  src={app?.iconUrl ?? "/icons/brooksbears-appicon.png"}
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {app?.name ?? "BrooksBears"}
                </h2>
                <p className="text-sm text-white/60">Entertainment • 13+</p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                  <span>{ratingLabel}</span>
                  <span>{downloadsLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              <form action={installAction}>
                <button
                  className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition md:w-56 disabled:cursor-not-allowed disabled:opacity-70 ${
                    isInstalled
                      ? "bg-emerald-600/80 text-white"
                      : "bg-rose-500 hover:bg-rose-600 text-white"
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
                      Install
                    </>
                  )}
                </button>
              </form>

              {isInstalled ? (
                <>
                  <Link
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:w-56"
                    href="/BrooksBears/"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </Link>
                  <form action={uninstallAction}>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200/30 bg-rose-500/10 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 md:w-56"
                      type="submit"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">About</h3>
          <p className="mt-2 text-sm text-white/70">
            {app?.description ??
              "BrooksBears is a cozy companion experience with Benjamin Bear, blending storytelling, jokes, and friendly check-ins inside Brooks AI HUB."}
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">
            Routes in Brooks AI HUB
          </h3>
          <div className="mt-3 space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="font-mono">/BrooksBears/</span>
              <span className="text-xs text-white/50">
                Main companion space
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-mono">/BrooksBears/BenjaminBear/</span>
              <span className="text-xs text-white/50">
                Benjamin Bear focus
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <p className="mt-2 text-sm text-white/70">
            Voice-first conversations, quick stories, and gentle check-ins
            await inside the BrooksBears app view.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#1f1218]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,150,180,0.35),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,8,12,0.2),rgba(13,8,12,0.85))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                Storytelling preview
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1016]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(142,255,226,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,8,12,0.2),rgba(13,8,12,0.85))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                Friendly chat preview
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
