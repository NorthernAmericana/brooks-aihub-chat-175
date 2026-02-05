import { ArrowLeft, Check, Download, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/(auth)/auth";
import { getEntitlements } from "@/lib/entitlements/getEntitlements";
import { getAppDetails } from "@/lib/store/getAppDetails";
import { installApp } from "@/lib/store/installApp";
import { listAppsWithInstallState } from "@/lib/store/listAppsWithInstallState";

export const dynamic = "force-dynamic";

type AtoStoreDetailsPageProps = {
  params: {
    slug: string;
  };
};

export default async function AtoStoreDetailsPage({
  params,
}: AtoStoreDetailsPageProps) {
  const details = await getAppDetails(params.slug);
  if (!details) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const [entitlements, installedApps] = await Promise.all([
    userId
      ? getEntitlements(userId)
      : Promise.resolve({ foundersAccess: false, products: [] }),
    userId ? listAppsWithInstallState(userId) : Promise.resolve([]),
  ]);

  const installedEntry = installedApps.find((app) => app.id === details.app.id);
  const isInstalled = installedEntry?.isInstalled ?? false;
  const requiresFoundersAccess = details.requiresFoundersAccess;
  const isLocked = requiresFoundersAccess && !entitlements.foundersAccess;

  const installAction = async () => {
    "use server";
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/login");
    }

    if (requiresFoundersAccess) {
      const entitlements = await getEntitlements(session.user.id);
      if (!entitlements.foundersAccess) {
        redirect("/pricing");
      }
    }

    await installApp(session.user.id, details.app.id);
    revalidatePath(`/store/ato/${details.app.slug}`);
    revalidatePath("/store");
  };

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#201018] via-[#1a0f16] to-[#120c16]">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#201018]/90 px-4 py-3 backdrop-blur-sm">
        <Link
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          href="/store"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            {details.app.iconUrl ? (
              <Image
                alt={`${details.app.name} icon`}
                className="h-full w-full object-cover"
                height={36}
                src={details.app.iconUrl}
                width={36}
              />
            ) : (
              <div className="text-[10px] text-white/50">Icon</div>
            )}
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">
              {details.app.name}
            </h1>
            <p className="text-xs text-white/60">
              {details.app.category ?? "ATO"}
            </p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                {details.app.iconUrl ? (
                  <Image
                    alt={`${details.app.name} icon`}
                    className="h-full w-full object-cover"
                    height={64}
                    src={details.app.iconUrl}
                    width={64}
                  />
                ) : (
                  <div className="text-xs text-white/50">No icon</div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {details.app.name}
                </h2>
                <p className="text-sm text-white/60">
                  {details.app.category ?? "ATO"}
                </p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                  <span>{details.routes.length} routes</span>
                  {details.app.isOfficial && <span>Official app</span>}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              <form action={installAction}>
                <button
                  className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition md:w-56 disabled:cursor-not-allowed disabled:opacity-70 ${
                    isInstalled
                      ? "bg-emerald-600/80 text-white"
                      : "bg-pink-500 text-white hover:bg-pink-600"
                  }`}
                  disabled={isInstalled || isLocked}
                  type="submit"
                >
                  {isInstalled ? (
                    <>
                      <Check className="h-4 w-4" />
                      Installed
                    </>
                  ) : isLocked ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Founders required
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Install
                    </>
                  )}
                </button>
              </form>

              {isInstalled && details.app.appPath && (
                <Link
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:w-56"
                  href={details.app.appPath}
                >
                  Go to ATO app
                </Link>
              )}
            </div>
          </div>

          {isLocked && (
            <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <div className="flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4" />
                Founders Access required
              </div>
              <p className="mt-1 text-xs text-amber-100/80">
                This app includes Founders-only routes. Upgrade to unlock the
                full experience.
              </p>
              <Link
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-amber-200/20 px-4 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-200/30"
                href="/pricing"
              >
                View pricing
              </Link>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">About</h3>
          <p className="mt-2 text-sm text-white/70">
            {details.app.description ??
              "Explore this ATO and its routes inside Brooks AI HUB."}
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Agent routes</h3>
          {details.routes.length === 0 ? (
            <p className="mt-2 text-sm text-white/70">
              No routes have been published yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {details.routes.map((route) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  key={route.id}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm text-white">
                        {route.slash}
                      </div>
                      <div className="text-xs text-white/60">{route.label}</div>
                    </div>
                    {route.isFoundersOnly && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                        <Lock className="h-3 w-3" />
                        Founders
                      </span>
                    )}
                  </div>
                  {route.description && (
                    <p className="mt-2 text-xs text-white/60">
                      {route.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
