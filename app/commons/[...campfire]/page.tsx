import Link from "next/link";
import { notFound } from "next/navigation";
import { validateCampfirePath } from "@/lib/commons/routing";

export default async function CommonsCampfireFeedPage({
  params,
}: {
  params: Promise<{ campfire: string[] }>;
}) {
  const { campfire } = await params;
  const validation = validateCampfirePath(campfire);

  if (!validation.isValid) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Commons · Campfire Feed
        </p>
        <h1 className="text-3xl font-semibold">/commons/{validation.campfirePath}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Placeholder feed route for Phase 1. Campfire posts will render here.
        </p>
        <Link
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
          href={`/commons/${validation.campfirePath}/submit`}
        >
          Start a post
        </Link>
      </div>
    </main>
  );
}
