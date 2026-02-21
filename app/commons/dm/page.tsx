import Link from "next/link";
import { MessageCircle, User } from "lucide-react";
import { auth } from "@/app/(auth)/auth";
import { listPrivateDmCampfiresForMember } from "@/lib/db/commons-queries";
import { getUserPublicNickname } from "@/lib/db/queries";
import { CampfireMembershipAction } from "./_components/CampfireMembershipAction";
import { PublicNicknameForm } from "./_components/public-nickname-form";

function getDmIdFromPath(path: string): string {
  if (!path.startsWith("dm/")) {
    return path;
  }

  return path.slice(3);
}

export default async function PrivateDmLobbyPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-900">
        <div className="mx-auto w-full max-w-4xl space-y-8 rounded-2xl border border-sky-950/30 bg-sky-100/65 p-6 shadow-[0_15px_45px_rgba(10,36,64,0.28)] backdrop-blur-[1px] sm:p-10">
          <header className="space-y-3 border-b border-sky-950/25 pb-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
              /NAT: Commons/
            </p>
            <h1 className="text-4xl font-semibold text-slate-900">Choose a Campfire to join.</h1>
          </header>

          <section className="rounded-xl border border-sky-900/30 bg-white/80 p-8 text-center shadow-[0_8px_24px_rgba(20,57,90,0.2)]">
            <h2 className="text-xl font-semibold text-slate-900">
              Sign in to view private campfires
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Your DM campfires are only visible to invited members.
            </p>
            <Link
              className="mt-5 inline-flex rounded-md border border-sky-950/35 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href={`/api/auth/guest?redirectUrl=${encodeURIComponent("/commons/dm")}`}
            >
              Continue to sign in
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const [campfires, publicNickname] = await Promise.all([
    listPrivateDmCampfiresForMember(session.user.id),
    getUserPublicNickname({ userId: session.user.id }),
  ]);

  return (
    <main className="min-h-dvh bg-transparent px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-7 rounded-2xl border border-sky-950/30 bg-sky-100/65 p-4 shadow-[0_15px_45px_rgba(10,36,64,0.28)] backdrop-blur-[1px] sm:p-8">
        <header className="space-y-4 border-b border-sky-950/25 pb-6 text-center">
          <div className="mx-auto inline-flex items-center gap-4 rounded-3xl border-4 border-emerald-400/80 bg-[#09243a] px-7 py-5 shadow-[0_0_20px_rgba(20,133,255,0.45)]">
            <MessageCircle className="h-11 w-11 text-orange-400" />
            <span className="text-3xl font-bold tracking-wide text-slate-100">/NAT: Commons/</span>
          </div>
          <h1 className="text-3xl font-semibold sm:text-5xl">Choose a Campfire to join.</h1>
        </header>


        <section className="rounded-xl border border-sky-950/25 bg-white/85 p-4 sm:p-5">
          <PublicNicknameForm initialPublicNickname={publicNickname} />
        </section>

        {campfires.length > 0 ? (
          <section className="space-y-4">
            {campfires.map((campfire) => (
              <article
                className="group space-y-3 border-2 border-sky-950/35 bg-white/90 p-3 shadow-[0_7px_16px_rgba(23,53,79,0.2)] transition hover:border-sky-900/60 hover:bg-white sm:space-y-4 sm:p-4"
                key={campfire.id}
              >
                <Link
                  className="flex items-center gap-3 sm:gap-4"
                  href={`/commons/dm/${encodeURIComponent(getDmIdFromPath(campfire.path))}`}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-sky-900/30 bg-sky-50 text-sky-900 sm:h-20 sm:w-20">
                    <MessageCircle className="h-8 w-8" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-2xl font-medium text-slate-900 sm:text-5xl">
                      {campfire.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Last active {new Date(campfire.lastActivityAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 border-2 border-slate-500/60 bg-slate-100 px-3 py-1 text-2xl font-semibold text-slate-900 sm:min-w-[140px] sm:justify-center sm:px-5 sm:py-2 sm:text-4xl">
                      <User className="h-5 w-5" />
                      <span>
                        {campfire.invitedCount}/{campfire.invitedLimit}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700 sm:text-2xl">
                      {campfire.accessLabel}
                    </p>
                  </div>
                </Link>
                <CampfireMembershipAction
                  campfirePath={campfire.path}
                  className="rounded-md border border-slate-900/30 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
                  viewerRole={campfire.viewerRole}
                />
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-xl border-2 border-dashed border-sky-900/30 bg-white/75 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No DM campfires yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Create a direct campfire to start private conversations.
            </p>
            <Link
              className="mt-4 inline-flex rounded-md border border-sky-900/35 bg-white px-4 py-2 text-sm font-medium text-slate-800"
              href="/commons/create"
            >
              Create campfire
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
