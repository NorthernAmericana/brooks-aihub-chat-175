"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";

const PAGE_SIZE = 4;

type AppStats = {
  avgRating: number | null;
  reviewsCount: number;
  downloadsCount: number;
};

type Review = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  displayName: string;
};

type UserReview = {
  rating: number;
  body: string | null;
} | null;

type ReviewsSectionProps = {
  appSlug: string;
  initialStats: AppStats;
  initialReviews: Review[];
  initialNextCursor: string | null;
  initialUserReview: UserReview;
  isLoggedIn: boolean;
  currentUserDisplayName: string;
};

const formatRating = (rating: number) => rating.toFixed(1);

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const StarRow = ({
  value,
  size = "h-4 w-4",
  activeClass = "text-amber-400",
  inactiveClass = "text-slate-200",
}: {
  value: number;
  size?: string;
  activeClass?: string;
  inactiveClass?: string;
}) =>
  Array.from({ length: 5 }).map((_, index) => {
    const isActive = index < value;
    return (
      <Star
        className={`${size} ${isActive ? activeClass : inactiveClass}`}
        fill={isActive ? "currentColor" : "none"}
        key={`star-${index}`}
      />
    );
  });

export const ReviewsSection = ({
  appSlug,
  initialStats,
  initialReviews,
  initialNextCursor,
  initialUserReview,
  isLoggedIn,
  currentUserDisplayName,
}: ReviewsSectionProps) => {
  const [stats, setStats] = useState<AppStats>(initialStats);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [rating, setRating] = useState<number>(initialUserReview?.rating ?? 5);
  const [body, setBody] = useState<string>(initialUserReview?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ratingLabel = useMemo(() => {
    if (stats.avgRating == null) {
      return "New";
    }

    return `${formatRating(stats.avgRating)} average`;
  }, [stats.avgRating]);

  const refreshStats = async () => {
    const response = await fetch(`/api/ato/apps/${appSlug}/stats`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as {
      downloads_count?: number;
      avg_rating?: number | null;
      reviews_count?: number;
    };

    setStats({
      avgRating: data.avg_rating == null ? null : Number(data.avg_rating),
      downloadsCount: Number(data.downloads_count ?? 0),
      reviewsCount: Number(data.reviews_count ?? 0),
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/ato/apps/${appSlug}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        body: body.trim().length > 0 ? body.trim() : null,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Unable to save review.");
      setSubmitting(false);
      return;
    }

    const data = (await response.json()) as {
      review?: {
        id: string;
        rating: number;
        body: string | null;
        createdAt: string;
        created_at?: string;
      };
    };

    if (data.review) {
      const createdAt =
        data.review.createdAt ??
        data.review.created_at ??
        new Date().toISOString();
      const newReview: Review = {
        id: data.review.id,
        rating: data.review.rating,
        body: data.review.body,
        createdAt,
        displayName: currentUserDisplayName || "Anonymous",
      };

      setReviews((prev) => {
        const existingIndex = prev.findIndex(
          (review) => review.id === newReview.id
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newReview;
          return updated;
        }
        return [newReview, ...prev];
      });
    }

    setSuccess("Review saved.");
    setSubmitting(false);
    await refreshStats();
  };

  const loadMore = async () => {
    if (!nextCursor) {
      return;
    }

    setLoadingMore(true);

    const response = await fetch(
      `/api/ato/apps/${appSlug}/reviews?limit=${PAGE_SIZE}&cursor=${encodeURIComponent(
        nextCursor
      )}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      setLoadingMore(false);
      return;
    }

    const data = (await response.json()) as {
      reviews?: Array<{
        id: string;
        rating: number;
        body: string | null;
        created_at: string;
        display_name: string;
      }>;
      next_cursor?: string | null;
    };

    const newReviews: Review[] = (data.reviews ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.created_at,
      displayName: review.display_name,
    }));

    setReviews((prev) => [...prev, ...newReviews]);
    setNextCursor(data.next_cursor ?? null);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-800">
              {ratingLabel}
            </div>
            <div className="text-xs text-slate-500">
              {stats.reviewsCount} reviews • {stats.downloadsCount} installs
            </div>
          </div>
          <div className="flex items-center gap-1">
            {StarRow({
              value: Math.round(stats.avgRating ?? 0),
              size: "h-4 w-4",
              activeClass: "text-amber-400",
              inactiveClass: "text-slate-200",
            })}
          </div>
        </div>
      </div>

      {isLoggedIn ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-800">
                Leave a review
              </div>
              <div className="text-xs text-slate-500">
                Rate BrooksBears and share optional feedback.
              </div>
            </div>
            <div className="flex items-center gap-1">
              {StarRow({
                value: rating,
                size: "h-4 w-4",
                activeClass: "text-amber-400",
                inactiveClass: "text-slate-200",
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const isActive = value <= rating;
              return (
                <button
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition ${
                    isActive
                      ? "border-amber-200 bg-amber-50 text-amber-500"
                      : "border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                  key={`rating-${value}`}
                  onClick={() => setRating(value)}
                  type="button"
                >
                  <Star
                    className="h-4 w-4"
                    fill={isActive ? "currentColor" : "none"}
                  />
                </button>
              );
            })}
          </div>

          <textarea
            className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share what stood out (optional)."
            rows={4}
            value={body}
          />

          {error ? (
            <p className="mt-2 text-xs text-rose-500">{error}</p>
          ) : null}
          {success ? (
            <p className="mt-2 text-xs text-emerald-600">{success}</p>
          ) : null}

          <button
            className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
            onClick={handleSubmit}
            type="button"
          >
            {submitting ? "Saving..." : "Submit review"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Sign in to leave a review.
        </div>
      )}

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
            No reviews yet. Be the first to share feedback.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-4"
              key={review.id}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {review.displayName || "Anonymous"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatDate(review.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {StarRow({
                    value: review.rating,
                    size: "h-3 w-3",
                    activeClass: "text-amber-400",
                    inactiveClass: "text-slate-200",
                  })}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {review.body?.trim().length
                  ? review.body
                  : "No written review."}
              </p>
            </div>
          ))
        )}
      </div>

      {nextCursor ? (
        <button
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loadingMore}
          onClick={loadMore}
          type="button"
        >
          {loadingMore ? "Loading..." : "Load more reviews"}
        </button>
      ) : null}
    </div>
  );
};
