"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const BENJAMIN_TILE_SRC = "/ato/brooksbears/benjamin-card.jpg";

export default function SavedMemoriesCard() {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href="/BrooksBears/memories"
      className="group flex w-full flex-col gap-6 rounded-3xl border border-white/60 bg-white/60 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_26px_60px_rgba(15,23,42,0.18)] md:flex-row md:items-center"
    >
      <div className="relative h-40 w-full overflow-hidden rounded-2xl md:h-44 md:w-44">
        {!imageError ? (
          <Image
            src={BENJAMIN_TILE_SRC}
            alt="Benjamin tile"
            fill
            className="object-cover"
            sizes="(min-width: 768px) 176px, 100vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-amber-200 via-emerald-100 to-sky-200" />
        )}
        <div className="absolute inset-x-3 bottom-3 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 backdrop-blur">
          Benjamin
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Saved Memories</h3>
          <p className="text-sm text-slate-600">Look back on special times</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-slate-800">
          Start Session <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
