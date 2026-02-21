"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DM_RECIPIENT_LIMIT_DEFAULT,
  DM_RECIPIENT_LIMIT_FOUNDER,
} from "@/lib/commons/constants";

type CampfireMode = "community" | "dm";
type RetentionMode =
  | "permanent"
  | "rolling_window"
  | "timeboxed"
  | "burn_on_empty";

export function CreateCampfireForm() {
  const router = useRouter();
  const [mode, setMode] = useState<CampfireMode>("community");
  const [retentionMode, setRetentionMode] =
    useState<RetentionMode>("permanent");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
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
        const rollingWindowSizeValue = String(
          formData.get("rollingWindowSize") ?? ""
        ).trim();
        const expiresInHoursValue = String(
          formData.get("expiresInHours") ?? ""
        ).trim();
        const rollingWindowSize = rollingWindowSizeValue
          ? Number.parseInt(rollingWindowSizeValue, 10)
          : undefined;
        const expiresInHours = expiresInHoursValue
          ? Number.parseInt(expiresInHoursValue, 10)
          : undefined;

        const payload =
          mode === "community"
            ? {
                mode,
                name,
                description,
                campfirePath,
                retentionMode,
                rollingWindowSize,
                expiresInHours,
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

          if (retentionMode === "rolling_window" && !rollingWindowSize) {
            setError(
              "Rolling window size is required for rolling window retention."
            );
            return;
          }

          if (retentionMode === "timeboxed" && !expiresInHours) {
            setError("Expiration hours are required for timeboxed retention.");
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
      <div className="inline-flex border-[3px] border-[#16224d] bg-[#fff9e4] p-1.5 shadow-[3px_3px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#0a1233] dark:shadow-[3px_3px_0_#f6e8b4]">
        <button
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            mode === "community"
              ? "border-[2px] border-[#16224d] bg-[#1f2d70] text-amber-50 shadow-[2px_2px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#f6e8b4] dark:text-[#111c4a] dark:shadow-[2px_2px_0_#f6e8b4]"
              : "text-[#3f4f87] hover:text-[#1f2d70] dark:text-amber-100/80 dark:hover:text-amber-50"
          }`}
          onClick={() => setMode("community")}
          type="button"
        >
          Create Campfire
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            mode === "dm"
              ? "border-[2px] border-[#16224d] bg-[#1f2d70] text-amber-50 shadow-[2px_2px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#f6e8b4] dark:text-[#111c4a] dark:shadow-[2px_2px_0_#f6e8b4]"
              : "text-[#3f4f87] hover:text-[#1f2d70] dark:text-amber-100/80 dark:hover:text-amber-50"
          }`}
          onClick={() => setMode("dm")}
          type="button"
        >
          Direct Campfire DM
        </button>
      </div>

      {mode === "community" ? (
        <>
          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#24326b] dark:text-amber-100"
              htmlFor="campfire-name"
            >
              Campfire name
            </label>
            <input
              className="w-full border-[3px] border-[#16224d] bg-[#fffdf2] px-3 py-2 text-sm text-[#16224d] placeholder:text-[#6671a4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b4a92] dark:border-[#f6e8b4] dark:bg-[#0b1336] dark:text-amber-50 dark:placeholder:text-amber-200/70 dark:focus-visible:ring-amber-200"
              id="campfire-name"
              name="name"
              placeholder="Builders Circle"
              required
              type="text"
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#24326b] dark:text-amber-100"
              htmlFor="campfire-description"
            >
              Description
            </label>
            <textarea
              className="min-h-24 w-full border-[3px] border-[#16224d] bg-[#fffdf2] px-3 py-2 text-sm text-[#16224d] placeholder:text-[#6671a4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b4a92] dark:border-[#f6e8b4] dark:bg-[#0b1336] dark:text-amber-50 dark:placeholder:text-amber-200/70 dark:focus-visible:ring-amber-200"
              id="campfire-description"
              maxLength={300}
              name="description"
              placeholder="What is this campfire for?"
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#24326b] dark:text-amber-100"
              htmlFor="campfire-path"
            >
              Campfire path
            </label>
            <input
              className="w-full border-[3px] border-[#16224d] bg-[#fffdf2] px-3 py-2 text-sm text-[#16224d] placeholder:text-[#6671a4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b4a92] dark:border-[#f6e8b4] dark:bg-[#0b1336] dark:text-amber-50 dark:placeholder:text-amber-200/70 dark:focus-visible:ring-amber-200"
              id="campfire-path"
              name="campfirePath"
              pattern="[a-z0-9-]+(/[a-z0-9-]+)?"
              placeholder="community/builders-circle"
              required
              type="text"
            />
            <p className="text-xs text-[#3b4a86] dark:text-amber-100/90">
              Lowercase path using letters, numbers, and dashes. Optional
              subcampfire is supported.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#24326b] dark:text-amber-100"
              htmlFor="campfire-retention-mode"
            >
              Retention mode
            </label>
            <select
              className="w-full border-[3px] border-[#16224d] bg-[#fffdf2] px-3 py-2 text-sm text-[#16224d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b4a92] dark:border-[#f6e8b4] dark:bg-[#0b1336] dark:text-amber-50 dark:focus-visible:ring-amber-200"
              id="campfire-retention-mode"
              name="retentionMode"
              onChange={(event) =>
                setRetentionMode(event.target.value as RetentionMode)
              }
              value={retentionMode}
            >
              <option value="permanent">Permanent</option>
              <option value="rolling_window">Rolling window</option>
              <option value="timeboxed">Timeboxed</option>
              <option value="burn_on_empty">Burn on empty</option>
            </select>
          </div>

          {retentionMode === "rolling_window" ? (
            <div className="space-y-1.5">
              <label
                className="text-xs font-bold uppercase tracking-[0.12em] text-[#24326b] dark:text-amber-100"
                htmlFor="campfire-rolling-window-size"
              >
                Rolling window size (posts)
              </label>
              <input
                className="w-full border-[3px] border-[#16224d] bg-[#fffdf2] px-3 py-2 text-sm text-[#16224d] placeholder:text-[#6671a4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b4a92] dark:border-[#f6e8b4] dark:bg-[#0b1336] dark:text-amber-50 dark:placeholder:text-amber-200/70 dark:focus-visible:ring-amber-200"
                id="campfire-rolling-window-size"
                min={1}
                name="rollingWindowSize"
                required
                type="number"
              />
            </div>
          ) : null}

          {retentionMode === "timeboxed" ? (
            <div className="space-y-1.5">
              <label
                className="text-xs font-bold uppercase tracking-[0.12em] text-[#24326b] dark:text-amber-100"
                htmlFor="campfire-expires-in-hours"
              >
                Expiration (hours)
              </label>
              <input
                className="w-full border-[3px] border-[#16224d] bg-[#fffdf2] px-3 py-2 text-sm text-[#16224d] placeholder:text-[#6671a4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b4a92] dark:border-[#f6e8b4] dark:bg-[#0b1336] dark:text-amber-50 dark:placeholder:text-amber-200/70 dark:focus-visible:ring-amber-200"
                id="campfire-expires-in-hours"
                min={1}
                name="expiresInHours"
                required
                type="number"
              />
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-1.5">
          <label
            className="text-xs font-bold uppercase tracking-[0.12em] text-[#24326b] dark:text-amber-100"
            htmlFor="recipient-emails"
          >
            Recipient emails
          </label>
          <textarea
            className="min-h-24 w-full border-[3px] border-[#16224d] bg-[#fffdf2] px-3 py-2 text-sm text-[#16224d] placeholder:text-[#6671a4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b4a92] dark:border-[#f6e8b4] dark:bg-[#0b1336] dark:text-amber-50 dark:placeholder:text-amber-200/70 dark:focus-visible:ring-amber-200"
            id="recipient-emails"
            name="recipientEmails"
            placeholder="friend@brooksaihub.app, teammate@brooksaihub.app"
            required
          />
          <p className="text-xs text-[#3b4a86] dark:text-amber-100/90">
            Add emails separated by commas or new lines. Free accounts support
            up to {DM_RECIPIENT_LIMIT_DEFAULT} recipient emails; founders
            support up to {DM_RECIPIENT_LIMIT_FOUNDER}.
          </p>
        </div>
      )}

      {error ? (
        <p className="border-[3px] border-[#8a1d2c] bg-[#ffe3e8] px-3 py-2 text-sm font-medium text-[#8a1d2c] dark:border-[#ffb5c0] dark:bg-[#4a1020] dark:text-[#ffd6de]">
          {error}
        </p>
      ) : null}

      <button
        className="inline-flex border-[3px] border-[#16224d] bg-[#1f2d70] px-4 py-2 text-sm font-bold uppercase tracking-wide text-amber-50 shadow-[3px_3px_0_#16224d] transition hover:-translate-y-0.5 hover:bg-[#293a87] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#f6e8b4] dark:bg-[#f6e8b4] dark:text-[#111c4a] dark:shadow-[3px_3px_0_#f6e8b4] dark:hover:bg-[#fff2c4]"
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
