"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DM_RECIPIENT_LIMIT_DEFAULT,
  DM_RECIPIENT_LIMIT_FOUNDER,
} from "@/lib/commons/constants";

type CampfireMode = "community" | "dm";

export function CreateCampfireForm() {
  const router = useRouter();
  const [mode, setMode] = useState<CampfireMode>("community");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const name = String(formData.get("name") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();
        const campfirePath = String(formData.get("campfirePath") ?? "")
          .trim()
          .toLowerCase();
        const recipientEmails = String(formData.get("recipientEmails") ?? "")
          .split(/[\n,]/)
          .map((value) => value.trim().toLowerCase())
          .filter((value) => value.length > 0);

        const payload =
          mode === "community"
            ? {
                mode,
                name,
                description,
                campfirePath,
              }
            : {
                mode,
                recipientEmails,
              };

        if (mode === "community") {
          if (name.length < 3) {
            setError("Campfire name must be at least 3 characters.");
            return;
          }

          if (!campfirePath) {
            setError("Campfire path is required.");
            return;
          }
        }

        if (mode === "dm") {
          if (!recipientEmails.length) {
            setError(
              "At least one recipient email is required for direct campfires."
            );
            return;
          }

          if (recipientEmails.length > DM_RECIPIENT_LIMIT_FOUNDER) {
            setError(
              `Direct campfires support up to ${DM_RECIPIENT_LIMIT_FOUNDER} recipient emails.`
            );
            return;
          }
        }

        startTransition(async () => {
          try {
            const response = await fetch("/api/commons/campfires", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });

            const data = (await response.json().catch(() => null)) as {
              error?: string;
              campfire?: { path?: string };
            } | null;

            if (!response.ok || !data?.campfire?.path) {
              setError(data?.error ?? "Unable to create campfire.");
              return;
            }

            if (mode === "dm") {
              router.push("/commons/dm");
            } else {
              router.push(`/commons/${data.campfire.path}`);
            }
            router.refresh();
          } catch (_error) {
            setError("Unable to create campfire right now.");
          }
        });
      }}
    >
      <div className="inline-flex rounded-full border border-slate-200 p-1 dark:border-slate-700">
        <button
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            mode === "community"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-600 dark:text-slate-300"
          }`}
          onClick={() => setMode("community")}
          type="button"
        >
          Create Campfire
        </button>
        <button
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            mode === "dm"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-600 dark:text-slate-300"
          }`}
          onClick={() => setMode("dm")}
          type="button"
        >
          Direct Campfire DM
        </button>
      </div>

      {mode === "community" ? (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="campfire-name">
              Campfire name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              id="campfire-name"
              name="name"
              placeholder="Builders Circle"
              required
              type="text"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium"
              htmlFor="campfire-description"
            >
              Description
            </label>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              id="campfire-description"
              maxLength={300}
              name="description"
              placeholder="What is this campfire for?"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="campfire-path">
              Campfire path
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              id="campfire-path"
              name="campfirePath"
              pattern="[a-z0-9-]+(/[a-z0-9-]+)?"
              placeholder="community/builders-circle"
              required
              type="text"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lowercase path using letters, numbers, and dashes. Optional
              subcampfire is supported.
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="recipient-emails">
            Recipient emails
          </label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            id="recipient-emails"
            name="recipientEmails"
            placeholder="friend@brooksaihub.app, teammate@brooksaihub.app"
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add emails separated by commas or new lines. Free accounts support
            up to {DM_RECIPIENT_LIMIT_DEFAULT} recipient emails; founders
            support up to {DM_RECIPIENT_LIMIT_FOUNDER}.
          </p>
        </div>
      )}

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
        {isPending
          ? "Working…"
          : mode === "community"
            ? "Create campfire"
            : "Start DM campfire"}
      </button>
    </form>
  );
}
