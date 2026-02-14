"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SubmitFormProps = {
  campfirePath: string;
};

export function CommonsSubmitForm({ campfirePath }: SubmitFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title") ?? "").trim();
        const body = String(formData.get("body") ?? "").trim();

        if (title.length < 5) {
          setError("Title must be at least 5 non-space characters.");
          return;
        }

        if (body.length < 1) {
          setError("Body must not be empty.");
          return;
        }

        startTransition(async () => {
          try {
            const response = await fetch("/api/commons/posts", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                campfirePath,
                title,
                body,
              }),
            });

            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as
                | { error?: string }
                | null;

              setError(payload?.error ?? "Unable to create post.");
              return;
            }

            const payload = (await response.json().catch(() => null)) as
              | { post?: { id?: string } }
              | null;

            if (!payload?.post?.id) {
              setError("Unable to create post.");
              return;
            }

            router.push(`/commons/${campfirePath}/posts/${payload.post.id}`);
            router.refresh();
          } catch (_error) {
            setError("Unable to create post. Please check your connection and try again.");
          }
        });
      }}
    >
      <input name="campfirePath" type="hidden" value={campfirePath} />

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="commons-submit-title">
          Title
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700 dark:bg-slate-950"
          id="commons-submit-title"
          maxLength={160}
          minLength={5}
          name="title"
          placeholder="Give your post a clear headline"
          required
          type="text"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="commons-submit-body">
          Body
        </label>
        <textarea
          className="min-h-56 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700 dark:bg-slate-950"
          id="commons-submit-body"
          maxLength={20000}
          minLength={1}
          name="body"
          placeholder="Share your update, question, or idea..."
          required
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <button
        className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Publishing…" : "Publish post"}
      </button>
    </form>
  );
}
