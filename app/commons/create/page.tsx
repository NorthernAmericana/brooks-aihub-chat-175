import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { CreateCampfireForm } from "@/app/commons/_components/create-campfire-form";

export default async function CommonsCreateCampfirePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      `/api/auth/guest?redirectUrl=${encodeURIComponent("/commons/create")}`
    );
  }

  return (
    <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Commons · New Campfire
          </p>
          <h1 className="text-3xl font-semibold">Create a campfire</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Launch a public Commons campfire for the community, or start a
            private DM campfire with one person.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CreateCampfireForm />
        </section>
      </div>
    </main>
  );
}
