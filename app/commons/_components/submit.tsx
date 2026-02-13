import { notFound } from "next/navigation";
import { validateCampfirePath } from "@/lib/commons/routing";
import { listCampfires } from "@/lib/db/commons-queries";
import { CommonsSubmitForm } from "@/app/commons/_components/submit-form";

export async function renderCommonsSubmit(campfire: string[]) {
  const validation = validateCampfirePath(campfire);

  if (!validation.isValid) {
    notFound();
  }

  const campfires = await listCampfires();
  const selectedCampfire = campfires.find(
    (campfireItem) => campfireItem.path === validation.campfirePath
  );

  if (!selectedCampfire) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Commons · Submit Post
          </p>
          <h1 className="text-3xl font-semibold">New post in {selectedCampfire.name}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">{selectedCampfire.description}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">/commons/{validation.campfirePath}</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CommonsSubmitForm campfirePath={validation.campfirePath} />
        </section>
      </div>
    </main>
  );
}
