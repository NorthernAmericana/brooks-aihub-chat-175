"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      aria-label="Go back"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
      onClick={() => router.back()}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
