"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      aria-label="Go back"
      className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
      onClick={() => router.back()}
      type="button"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
