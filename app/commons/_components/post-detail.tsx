import { notFound } from "next/navigation";
import { isValidPostId, validateCampfirePath } from "@/lib/commons/routing";
import { getPostWithComments, listCampfires } from "@/lib/db/commons-queries";

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export async function renderCommonsPostDetail(campfire: string[], postId: string) {
  const validation = validateCampfirePath(campfire);

  if (!validation.isValid || !isValidPostId(postId)) {
    notFound();
  }

  const [postWithComments, campfires] = await Promise.all([
    getPostWithComments(postId),
    listCampfires(),
  ]);

  if (!postWithComments) {
    notFound();
  }

  const postCampfire = campfires.find(
    (campfireItem) => campfireItem.id === postWithComments.post.campfireId
  );

  if (!postCampfire || postCampfire.path !== validation.campfirePath) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Commons · Post Detail
          </p>
          <h1 className="text-3xl font-semibold">{postWithComments.post.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            /commons/{validation.campfirePath} · Posted {formatDate(postWithComments.post.createdAt)}
          </p>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {postWithComments.post.body}
          </p>
        </article>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Comments ({postWithComments.comments.length})</h2>
          {postWithComments.comments.length > 0 ? (
            postWithComments.comments.map((comment) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                key={comment.id}
              >
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                  {comment.body}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(comment.createdAt)}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              No comments yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
