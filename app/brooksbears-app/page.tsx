import { Check, Download, ExternalLink, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { atoAppReviews, atoApps, user, userInstalls } from "@/lib/db/schema";
import { getSafeDisplayName } from "@/lib/ato/reviews";
import { installApp } from "@/lib/store/installApp";
import { uninstallApp } from "@/lib/store/uninstallApp";
import { BackButton } from "./BackButton";
import { ReviewsSection } from "./ReviewsSection";

export const dynamic = "force-dynamic";

const APP_SLUG = "brooksbears";

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

  const [ratingStats] = await db
    .select({
      averageRating: sql<number | null>`avg(${atoAppReviews.rating})`,
      reviewsCount: sql<number>`count(*)`,
    })
    .from(atoAppReviews)
    .where(eq(atoAppReviews.appId, app.id));

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

export default async function BrooksBearsAppPage() {
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
    stats?.avgRating != null
      ? `${formatRating(stats.avgRating)} (${stats.reviewsCount} reviews)`
      : "New";
  const downloadsLabel = stats
    ? `${formatDownloads(stats.downloadsCount)} downloads`
    : "Downloads unavailable";

  const userReview =
    userId && appId
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
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-900">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm">
        <BackButton />
        <h1 className="text-sm font-medium text-slate-700">
          {app?.name ?? "BrooksBears"}
        </h1>
      </div>

      <div className="app-page-content flex-1 space-y-6 overflow-y-auto px-4 py-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <Image
                  alt={`${app?.name ?? "BrooksBears"} icon`}
                  className="h-full w-full object-cover"
                  height={64}
                  src={app?.iconUrl ?? "/icons/brooksbears-appicon.png"}
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {app?.name ?? "BrooksBears"}
                </h2>
                <p className="text-sm text-slate-500">Entertainment • 13+</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span>{ratingLabel}</span>
                  <span>{downloadsLabel}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <div className="font-medium text-slate-700">Live stats</div>
              <div className="mt-1 flex flex-col gap-1">
                <span>{ratingLabel}</span>
                <span>{downloadsLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <form action={installAction} className="w-full md:w-auto">
              <button
                className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 md:w-48 ${
                  isInstalled
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-slate-200 bg-slate-900 text-white hover:bg-slate-800"
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
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:w-40"
                  href="/BrooksBears/"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Link>
                <form action={uninstallAction} className="w-full md:w-auto">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 md:w-40"
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

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Screenshots</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-400"
                key={`placeholder-${index}`}
              >
                Screenshot placeholder
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
              Overview
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1">
              Reviews
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1">
              About
            </span>
          </div>

          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Overview</h4>
              <p className="mt-1">
                {app?.description ??
                  "BrooksBears is a cozy companion experience with Benjamin Bear, blending storytelling, jokes, and friendly check-ins inside Brooks AI HUB."}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Reviews</h4>
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
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">About</h4>
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="font-mono text-xs text-slate-700">
                    /BrooksBears/
                  </span>
                  <span className="text-xs text-slate-500">
                    Main companion space
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="font-mono text-xs text-slate-700">
                    /BrooksBears/BenjaminBear/
                  </span>
                  <span className="text-xs text-slate-500">
                    Benjamin Bear focus
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
