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
    <main className="min-h-dvh bg-transparent px-4 py-8 text-slate-900 dark:text-amber-50 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="overflow-hidden border-[3px] border-[#16224d] bg-[#fef7dc] shadow-[5px_5px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#111c4a] dark:shadow-[5px_5px_0_#f6e8b4]">
          <div className="border-b-[3px] border-[#16224d] bg-[#111c4a] px-4 py-4 text-amber-50 dark:border-[#f6e8b4] dark:bg-[#0a1233]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200/90">
              Commons · New Campfire
            </p>
            <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
              🔥 Forge a New Campfire
            </h1>
          </div>
          <div className="space-y-2 px-4 py-4 sm:px-5">
            <p className="text-sm text-[#29366a] dark:text-amber-100 sm:text-base">
              Launch a public Commons campfire for your community, or start a
              private DM campfire with one person.
            </p>
          </div>
        </header>

        <section className="border-[3px] border-[#16224d] bg-[#fef7dc] p-5 shadow-[5px_5px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#111c4a] dark:shadow-[5px_5px_0_#f6e8b4] sm:p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#2d3b73] dark:text-amber-200/90">
            Commons · New Campfire
          </p>
          <CreateCampfireForm />
        </section>
      </div>
    </main>
  );
}
