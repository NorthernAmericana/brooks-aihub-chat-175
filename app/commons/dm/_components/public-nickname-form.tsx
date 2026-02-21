"use client";

import { FormEvent, useState } from "react";
import {
  PUBLIC_NICKNAME_MAX_LENGTH,
  PUBLIC_NICKNAME_MIN_LENGTH,
  normalizePublicNickname,
  validatePublicNickname,
} from "@/lib/validation/public-nickname";

type PublicNicknameFormProps = {
  initialPublicNickname: string | null;
};

export function PublicNicknameForm({
  initialPublicNickname,
}: PublicNicknameFormProps) {
  const [value, setValue] = useState(initialPublicNickname ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const normalized = normalizePublicNickname(value);

    if (normalized) {
      const validationError = validatePublicNickname(normalized);

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publicNickname: normalized || null }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; publicNickname?: string | null }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Could not update nickname.");
        return;
      }

      setValue(data?.publicNickname ?? "");
      setMessage("Nickname saved.");
    } catch (_error) {
      setError("Could not update nickname.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-2" onSubmit={onSubmit}>
      <label
        className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700"
        htmlFor="public-nickname"
      >
        Public nickname
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="w-full border-2 border-sky-950/35 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
          id="public-nickname"
          maxLength={PUBLIC_NICKNAME_MAX_LENGTH}
          minLength={PUBLIC_NICKNAME_MIN_LENGTH}
          onChange={(event) => setValue(event.target.value)}
          pattern="[A-Za-z0-9_]+"
          placeholder="set a nickname"
          value={value}
        />
        <button
          className="border-2 border-sky-950/45 bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
      <p className="text-xs text-slate-600">
        {PUBLIC_NICKNAME_MIN_LENGTH}-{PUBLIC_NICKNAME_MAX_LENGTH} chars, letters/numbers/underscores.
      </p>
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}
