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
import { BackButton } from "./BackButton";
import { ReviewsSection } from "../brooksbears-app/ReviewsSection";

export const dynamic = "force-dynamic";

const APP_SLUG = "mycarmindato";

type AppStats = {
  avgRating: number | null;
  reviewsCount: number;
  downloadsCount: number;
};

type ReviewsPayload = {
  reviews: Array<{
    id: string;
    rating: number;
    body: string | null;
    createdAt: string;
    displayName: string;
  }>;
  nextCursor: string | null;
};

const formatDownloads = (downloads: number) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(downloads);

const formatRating = (rating: number) => rating.toFixed(1);

const getAppStats = async (): Promise<AppStats | null> => {
  const [app] = await db
    .select({ id: atoApps.id })
    .from(atoApps)
    .where(eq(atoApps.slug, APP_SLUG))
    .limit(1);

  if (!app) {
    return null;
  }

  const [installStats] = await db
    .select({ downloads: sql<number>`count(*)` })
    .from(userInstalls)
    .where(eq(userInstalls.appId, app.id));

  const hasReviewsTable = await isAtoAppReviewsTableReady();
  const [ratingStats] = hasReviewsTable
    ? await db
        .select({
          averageRating: sql<number | null>`avg(${atoAppReviews.rating})`,
          reviewsCount: sql<number>`count(*)`,
        })
        .from(atoAppReviews)
        .where(eq(atoAppReviews.appId, app.id))
    : [null];

  return {
    downloadsCount: Number(installStats?.downloads ?? 0),
    avgRating:
      ratingStats?.averageRating == null
        ? null
        : Number(ratingStats.averageRating),
    reviewsCount: Number(ratingStats?.reviewsCount ?? 0),
  };
};

const getAppReviews = async (): Promise<ReviewsPayload | null> => {
  const [app] = await db
    .select({ id: atoApps.id })
    .from(atoApps)
    .where(eq(atoApps.slug, APP_SLUG))
    .limit(1);

  if (!app) {
    return null;
  }

  const hasReviewsTable = await isAtoAppReviewsTableReady();

  if (!hasReviewsTable) {
    return {
      reviews: [],
      nextCursor: null,
    };
  }

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
    .where(eq(atoAppReviews.appId, app.id))
    .orderBy(desc(atoAppReviews.createdAt), desc(atoAppReviews.id))
    .limit(5);

  const limit = 4;
  const hasNextPage = rows.length > limit;
  const trimmedRows = hasNextPage ? rows.slice(0, limit) : rows;
  const nextCursor = hasNextPage
    ? `${trimmedRows[trimmedRows.length - 1]?.createdAt.toISOString()}|${
        trimmedRows[trimmedRows.length - 1]?.id
      }`
    : null;

  return {
    reviews: trimmedRows.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      displayName: getSafeDisplayName(review.email),
    })),
    nextCursor,
  };
};

export default async function MyCarMindATOAppPage() {
  const [app, session, stats, reviewsPayload] = await Promise.all([
    db
      .select()
      .from(atoApps)
      .where(eq(atoApps.slug, APP_SLUG))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    auth(),
    getAppStats(),
    getAppReviews(),
  ]);

  const userId = session?.user?.id ?? null;
  const appId = app?.id ?? null;

  const [installRecord] =
    userId && appId
      ? await db
          .select()
          .from(userInstalls)
          .where(
            and(eq(userInstalls.userId, userId), eq(userInstalls.appId, appId))
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
    revalidatePath("/mycarmindato-app");
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
    revalidatePath("/mycarmindato-app");
  };

  const ratingLabel =
    stats?.avgRating != null
      ? `${formatRating(stats.avgRating)} (${stats.reviewsCount} reviews)`
      : "New";
  const downloadsLabel = stats
    ? `${formatDownloads(stats.downloadsCount)} downloads`
    : "Downloads unavailable";

  const userReview =
    userId && appId && (await isAtoAppReviewsTableReady())
      ? await db
          .select({
            rating: atoAppReviews.rating,
            body: atoAppReviews.body,
          })
          .from(atoAppReviews)
          .where(
            and(
              eq(atoAppReviews.userId, userId),
              eq(atoAppReviews.appId, appId)
            )
          )
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : null;

  const currentUserDisplayName = getSafeDisplayName(session?.user?.email);

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#0d1620] via-[#0f1c27] to-[#0b151d]">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#0b151d]/90 px-4 py-3 backdrop-blur-sm">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <ImageWithFallback
              alt={`${app?.name ?? "MyCarMindATO"} icon`}
              className="h-full w-full object-cover"
              containerClassName="size-full"
              height={36}
              src={app?.iconUrl ?? "/icons/mycarmindato-appicon.png"}
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">
              {app?.name ?? "MyCarMindATO"}
            </h1>
            <p className="text-xs text-white/60">Destination intelligence</p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 space-y-6 overflow-y-auto px-4 py-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                <ImageWithFallback
                  alt={`${app?.name ?? "MyCarMindATO"} icon`}
                  className="h-full w-full object-cover"
                  containerClassName="size-full"
                  height={64}
                  src={app?.iconUrl ?? "/icons/mycarmindato-appicon.png"}
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {app?.name ?? "MyCarMindATO"}
                </h2>
                <p className="text-sm text-white/60">Utilities - 13+</p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                  <span>{ratingLabel}</span>
                  <span>{downloadsLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              <form action={installAction}>
                <button
                  className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 md:w-56 ${
                    isInstalled
                      ? "bg-emerald-600/80 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
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
                    href="/MyCarMindATO"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Go to ATO app
                  </Link>
                  <form action={uninstallAction}>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:w-56"
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
              "MyCarMindATO is your travel companion for discovering towns, logging missions, and navigating routes across the Brooks AI HUB. It keeps your destination mastery, local tips, and travel stats synced with the MyCarMindATO agent."}
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white p-5 text-slate-900 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Reviews</h3>
          <div className="mt-3">
            <ReviewsSection
              appSlug={APP_SLUG}
              currentUserDisplayName={currentUserDisplayName}
              initialNextCursor={reviewsPayload?.nextCursor ?? null}
              initialReviews={reviewsPayload?.reviews ?? []}
              initialStats={{
                avgRating: stats?.avgRating ?? null,
                downloadsCount: stats?.downloadsCount ?? 0,
                reviewsCount: stats?.reviewsCount ?? 0,
              }}
              initialUserReview={userReview}
              isLoggedIn={Boolean(userId)}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">
            Routes in Brooks AI HUB
          </h3>
          <div className="mt-3 space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono">/MyCarMindATO/</span>
              <span className="text-xs text-white/50">
                Main travel intelligence route
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="font-mono">/MyCarMindATO/Driver/</span>
              <span className="text-xs text-white/50">Personal car owners</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="font-mono">/MyCarMindATO/Trucker/</span>
              <span className="text-xs text-white/50">Commercial truckers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-mono">/MyCarMindATO/DeliveryDriver/</span>
              <span className="text-xs text-white/50">
                Delivery and gig drivers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span className="font-mono">/MyCarMindATO/Traveler/</span>
              <span className="text-xs text-white/50">Road trip explorers</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <p className="mt-2 text-sm text-white/70">
            Map-first layouts, mission tracking, and town mastery live in the
            ATO app view.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1f2a]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,140,220,0.35),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,15,24,0.2),rgba(5,15,24,0.85))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                Map discovery preview
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#121c24]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(74,191,159,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,15,24,0.2),rgba(5,15,24,0.85))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                Mission dashboard preview
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
