import { Check, Download, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { atoAppReviews, atoApps, user, userInstalls } from "@/lib/db/schema";
import { isAtoAppReviewsTableReady } from "@/lib/ato/reviews-table";
import { getSafeDisplayName } from "@/lib/ato/reviews";
import { installApp } from "@/lib/store/installApp";
import { uninstallApp } from "@/lib/store/uninstallApp";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { BackButton } from "../brooksbears-app/BackButton";
import { ReviewsSection } from "../brooksbears-app/ReviewsSection";

export const dynamic = "force-dynamic";

const APP_SLUG = "lore-playground";

const formatDownloads = (downloads: number) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(downloads);

const formatRating = (rating: number) => rating.toFixed(1);

async function getApp() {
  const [app] = await db
    .select()
    .from(atoApps)
    .where(eq(atoApps.slug, APP_SLUG))
    .limit(1);

  return app ?? null;
}

async function getAppStats(appId: string | null) {
  if (!appId) return null;

  const [installStats] = await db
    .select({ downloads: sql<number>`count(*)` })
    .from(userInstalls)
    .where(eq(userInstalls.appId, appId));

  const hasReviewsTable = await isAtoAppReviewsTableReady();
  const [ratingStats] = hasReviewsTable
    ? await db
        .select({
          averageRating: sql<number | null>`avg(${atoAppReviews.rating})`,
          reviewsCount: sql<number>`count(*)`,
        })
        .from(atoAppReviews)
        .where(eq(atoAppReviews.appId, appId))
    : [null];

  return {
    downloadsCount: Number(installStats?.downloads ?? 0),
    avgRating:
      ratingStats?.averageRating == null
        ? null
        : Number(ratingStats.averageRating),
    reviewsCount: Number(ratingStats?.reviewsCount ?? 0),
  };
}

async function getAppReviews(appId: string | null) {
  if (!appId) return { reviews: [], nextCursor: null };

  const hasReviewsTable = await isAtoAppReviewsTableReady();
  if (!hasReviewsTable) return { reviews: [], nextCursor: null };

  const rows = await db
    .select({
      id: atoAppReviews.id,
      rating: atoAppReviews.rating,
      body: atoAppReviews.body,
      createdAt: atoAppReviews.createdAt,
      email: user.email,
    })
    .from(atoAppReviews)
    .innerJoin(user, eq(atoAppReviews.userId, user.id))
    .where(eq(atoAppReviews.appId, appId))
    .orderBy(desc(atoAppReviews.createdAt), desc(atoAppReviews.id))
    .limit(5);

  const limit = 4;
  const hasNextPage = rows.length > limit;
  const trimmedRows = hasNextPage ? rows.slice(0, limit) : rows;
  const last = trimmedRows[trimmedRows.length - 1];

  return {
    reviews: trimmedRows.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      displayName: getSafeDisplayName(review.email),
    })),
    nextCursor: hasNextPage && last ? `${last.createdAt.toISOString()}|${last.id}` : null,
  };
}

export default async function LorePlaygroundAppPage() {
  const [app, session] = await Promise.all([getApp(), auth()]);
  const userId = session?.user?.id ?? null;
  const appId = app?.id ?? null;

  const [stats, reviewsPayload, installRecord, userReview] = await Promise.all([
    getAppStats(appId),
    getAppReviews(appId),
    userId && appId
      ? db
          .select()
          .from(userInstalls)
          .where(and(eq(userInstalls.userId, userId), eq(userInstalls.appId, appId)))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    userId && appId && (await isAtoAppReviewsTableReady())
      ? db
          .select({ rating: atoAppReviews.rating, body: atoAppReviews.body })
          .from(atoAppReviews)
          .where(and(eq(atoAppReviews.userId, userId), eq(atoAppReviews.appId, appId)))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  const isInstalled = Boolean(installRecord);
  const isInstallDisabled = isInstalled || !appId;

  const installAction = async () => {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (!appId) return;

    await installApp(session.user.id, appId);
    revalidatePath("/lore-playground-app");
    revalidatePath("/store");
  };

  const uninstallAction = async () => {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (!appId) return;

    await uninstallApp(session.user.id, appId);
    revalidatePath("/lore-playground-app");
    revalidatePath("/store");
  };

  const ratingLabel =
    stats?.avgRating != null ? `${formatRating(stats.avgRating)} (${stats.reviewsCount} reviews)` : "New";
  const downloadsLabel = stats ? `${formatDownloads(stats.downloadsCount)} downloads` : "Downloads unavailable";

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-900">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm">
        <BackButton />
        <h1 className="text-sm font-medium text-slate-700">{app?.name ?? "Lore Playground"}</h1>
      </div>

      <div className="app-page-content flex-1 space-y-6 overflow-y-auto px-4 py-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <ImageWithFallback alt={`${app?.name ?? "Lore Playground"} icon`} className="h-full w-full object-contain" containerClassName="size-full" height={64} src={app?.iconUrl ?? "/icons/lore-playground-appicon.svg"} width={64} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{app?.name ?? "Lore Playground"}</h2>
                <p className="text-sm text-slate-500">Pop Culture / Worldbuilding / Creative Companion</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span>{ratingLabel}</span>
                  <span>{downloadsLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <form action={installAction} className="w-full md:w-auto">
              <button className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 md:w-56 ${isInstalled ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-900 text-white hover:bg-slate-800"}`} disabled={isInstallDisabled} type="submit">
                {isInstalled ? <><Check className="h-4 w-4" />Installed</> : <><Download className="h-4 w-4" />Install Lore Playground</>}
              </button>
            </form>

            {isInstalled ? (
              <>
                <Link className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:w-56" href="/NAMC/lore-playground">
                  <ExternalLink className="h-4 w-4" />Enter Lore Playground
                </Link>
                <form action={uninstallAction} className="w-full md:w-auto">
                  <button className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 md:w-40" type="submit">
                    <Trash2 className="h-4 w-4" />Remove
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Overview</h3>
          <p className="mt-2 text-sm text-slate-600">Lore Playground is a place to spend time in story worlds you love — games, movies, shows, books, and your own headcanon expansions. It keeps canon, headcanon, and speculation clearly labeled so your ideas stay organized.</p>
          <p className="mt-2 text-sm text-slate-600">Default mode is spoiler-safe. The assistant will ask your spoiler setting first, then support Hangout mode (immersive prompts) or Workbench mode (structured templates and continuity checks).</p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Reviews</h3>
          <div className="mt-3">
            <ReviewsSection appSlug={APP_SLUG} currentUserDisplayName={getSafeDisplayName(session?.user?.email)} initialNextCursor={reviewsPayload.nextCursor} initialReviews={reviewsPayload.reviews} initialStats={{ avgRating: stats?.avgRating ?? null, downloadsCount: stats?.downloadsCount ?? 0, reviewsCount: stats?.reviewsCount ?? 0 }} initialUserReview={userReview} isLoggedIn={Boolean(userId)} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Route command</h3>
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">/NAMC/Lore-Playground/App/</div>
        </section>
      </div>
    </div>
  );
}
