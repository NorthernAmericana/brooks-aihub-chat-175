import Link from "next/link";
import { notFound } from "next/navigation";
import { validateCampfirePath } from "@/lib/commons/routing";
import { listPostsByCampfirePath } from "@/lib/db/commons-queries";

const PAGE_SIZE = 20;

type SortOption = "newest" | "oldest";

function asSingleValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function resolvePage(value: string): number {
  const page = Number.parseInt(value, 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
}

function resolveSort(value: string): SortOption {
  if (value === "oldest") {
    return "oldest";
  }

  return "newest";
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function CommonsCampfireFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ campfire: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { campfire } = await params;
  const validation = validateCampfirePath(campfire);

  if (!validation.isValid) {
    notFound();
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const page = resolvePage(asSingleValue(resolvedSearchParams.page));
  const sort = resolveSort(asSingleValue(resolvedSearchParams.sort));

  const result = await listPostsByCampfirePath({
    campfirePath: validation.campfirePath,
    page,
    pageSize: PAGE_SIZE,
    sort,
  });

  if (!result.campfire) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Commons · Campfire Feed
          </p>
          <h1 className="text-3xl font-semibold">{result.campfire.name}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">{result.campfire.description}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">/commons/{validation.campfirePath}</p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Sort</span>
            <Link
              className={`rounded-full px-3 py-1.5 ${
                sort === "newest"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
              href={`/commons/${validation.campfirePath}?sort=newest&page=1`}
            >
              Newest
            </Link>
            <Link
              className={`rounded-full px-3 py-1.5 ${
                sort === "oldest"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
              href={`/commons/${validation.campfirePath}?sort=oldest&page=1`}
            >
              Oldest
            </Link>
          </div>

          <Link
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
            href={`/commons/${validation.campfirePath}/submit`}
          >
            Start a post
          </Link>
        </div>

        {result.posts.length > 0 ? (
          <section className="space-y-3">
            {result.posts.map((post) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                key={post.id}
              >
                <Link
                  className="text-xl font-semibold hover:underline"
                  href={`/commons/${validation.campfirePath}/posts/${post.id}`}
                >
                  {post.title}
                </Link>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                  {post.body}
                </p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Posted {formatDate(post.createdAt)}
                </p>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">No posts yet</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Be the first to start a thread in this campfire.
            </p>
          </section>
        )}

        <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-slate-500 dark:text-slate-400">
            Page {Math.min(page, totalPages)} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {canGoBack ? (
              <Link
                className="rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-700"
                href={`/commons/${validation.campfirePath}?sort=${sort}&page=${page - 1}`}
              >
                Previous
              </Link>
            ) : null}
            {canGoForward ? (
              <Link
                className="rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-700"
                href={`/commons/${validation.campfirePath}?sort=${sort}&page=${page + 1}`}
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </main>
  );
}
