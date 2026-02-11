import { notFound } from "next/navigation";
import { validateCampfirePath } from "@/lib/commons/routing";

export function renderCommonsSubmit(campfire: string[]) {
  const validation = validateCampfirePath(campfire);

  if (!validation.isValid) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Commons · Submit Post
        </p>
        <h1 className="text-3xl font-semibold">New post in {validation.campfirePath}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Placeholder submission entry point for campfire post creation.
        </p>
      </div>
    </main>
  );
}
