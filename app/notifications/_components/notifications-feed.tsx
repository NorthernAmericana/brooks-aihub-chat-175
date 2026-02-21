"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

type NotificationResponse = {
  notifications: NotificationItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

async function fetchNotifications(cursor?: string | null): Promise<NotificationResponse> {
  const search = new URLSearchParams({ limit: "6" });
  if (cursor) {
    search.set("cursor", cursor);
  }

  const response = await fetch(`/api/notifications?${search.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load notifications.");
  }

  return response.json();
}

export function NotificationsFeed() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (nextCursor?: string | null) => {
    setIsLoading(true);
    try {
      const data = await fetchNotifications(nextCursor);
      setItems((current) => {
        if (!nextCursor) {
          return data.notifications;
        }

        return [...current, ...data.notifications];
      });
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setError(null);
    } catch (_error) {
      setError("Unable to load notifications right now.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(null);
  }, [load]);

  useEffect(() => {
    if (!hasMore || isLoading) {
      return;
    }

    const target = sentinelRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && cursor) {
          void load(cursor);
        }
      }
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [cursor, hasMore, isLoading, load]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items]
  );

  return (
    <section className="space-y-3">
      <p className="text-sm text-slate-600">
        Unread: <span className="font-semibold">{unreadCount}</span>
      </p>

      <div className="space-y-3">
        {items.map((item) => (
          <article
            className="rounded-xl border border-slate-900/20 bg-white p-3 shadow-sm"
            key={item.id}
          >
            <p className="text-xs text-slate-500">
              {new Date(item.createdAt).toLocaleString()}
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-700">{item.body}</p>
            <button
              className="mt-3 rounded-md border border-slate-900/30 px-3 py-1 text-xs font-medium text-slate-900 disabled:opacity-60"
              disabled={item.isRead}
              onClick={async () => {
                if (item.isRead) {
                  return;
                }

                const response = await fetch(`/api/notifications/${item.id}/read`, {
                  method: "POST",
                });

                if (!response.ok) {
                  return;
                }

                setItems((current) =>
                  current.map((entry) =>
                    entry.id === item.id ? { ...entry, isRead: true, readAt: new Date().toISOString() } : entry
                  )
                );
              }}
              type="button"
            >
              {item.isRead ? "Read" : "Mark as read"}
            </button>
          </article>
        ))}

        {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!hasMore && !isLoading ? (
          <p className="text-xs text-slate-500">You are all caught up.</p>
        ) : null}
        <div ref={sentinelRef} />
      </div>
    </section>
  );
}
