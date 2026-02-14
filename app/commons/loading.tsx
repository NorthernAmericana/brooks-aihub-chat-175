export default function CommonsLoading() {
  return (
    <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="h-6 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </main>
  );
}
