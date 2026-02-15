import Link from "next/link";
import { auth } from "@/app/(auth)/auth";
import { getPrivateDmCampfireForViewer } from "@/lib/db/commons-queries";

export default async function PrivateDmCampfirePage({
  params,
}: {
  params: Promise<{ dmId: string }>;
}) {
  const { dmId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <h1 className="text-3xl font-semibold">Private DM Campfire</h1>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Sign in to view private campfires
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              You need an account to open this DM campfire.
            </p>
            <Link
              className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              href={`/api/auth/guest?redirectUrl=${encodeURIComponent(`/commons/dm/${dmId}`)}`}
            >
              Continue to sign in
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const dmCampfire = await getPrivateDmCampfireForViewer({
    viewerId: session.user.id,
    dmId,
  });

  if (!dmCampfire.campfire) {
    return (
      <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Campfire not found
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This DM campfire may have been removed.
          </p>
          <Link className="mt-4 inline-flex text-sm font-medium underline" href="/commons/dm">
            Back to DM lobby
          </Link>
        </div>
      </main>
    );
  }

  if (!dmCampfire.isMember) {
    return (
      <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            This campfire is private
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            You are not a member of this DM campfire.
          </p>
          <Link className="mt-4 inline-flex text-sm font-medium underline" href="/commons/dm">
            Back to DM lobby
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            NAT: Commons · Private DM Campfire
          </p>
          <h1 className="text-3xl font-semibold">{dmCampfire.campfire.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">/commons/{dmCampfire.campfire.path}</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Members</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {dmCampfire.members.map((member) => (
              <li className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700" key={member.id}>
                <span>{member.email}</span>
                <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Messages
          </h2>
          {dmCampfire.posts.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {dmCampfire.posts.map((post) => (
                <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-700" key={post.id}>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{post.authorEmail}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                    {post.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Chat UI coming next. This route now resolves for valid DM members.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
