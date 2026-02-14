"use client";

export default function CommonsError() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900/60 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-rose-600 dark:text-rose-300">
          Unable to load Commons right now
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Please refresh and try again. If the issue persists, check back
          shortly.
        </p>
      </div>
    </main>
  );
}
