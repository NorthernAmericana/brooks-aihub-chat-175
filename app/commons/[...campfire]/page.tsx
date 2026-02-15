import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
  const clampedPage = Math.min(page, totalPages);

  if (page !== clampedPage) {
    redirect(
      `/commons/${validation.campfirePath}?sort=${sort}&page=${clampedPage}`
    );
  }

  const canGoBack = clampedPage > 1;
  const canGoForward = clampedPage < totalPages;

  return (
    <main className="min-h-dvh bg-transparent px-4 py-8 text-[#121f4f] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3f4f88]">
            Commons · Campfire Feed
          </p>
          <h1 className="font-mono text-3xl font-bold text-amber-50 [text-shadow:0_3px_18px_rgba(8,12,34,0.95)]">
            {result.campfire.name}
          </h1>
          <p className="max-w-3xl text-sm text-[#25366f] [text-shadow:0_1px_8px_rgba(255,248,228,0.85)] sm:text-base">
            {result.campfire.description}
          </p>
          <p className="text-xs text-[#33457f] [text-shadow:0_1px_8px_rgba(255,248,228,0.85)]">
            /commons/{validation.campfirePath}
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-[#16224d] bg-[#fef7dc] p-4 shadow-[5px_5px_0_#16224d] sm:p-5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-[#2d3c74]">
              Sort
            </span>
            <Link
              className={`border-[3px] px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                sort === "newest"
                  ? "border-[#16224d] bg-[#1f2d70] text-amber-50 shadow-[2px_2px_0_#16224d]"
                  : "border-[#253370] bg-[#fffdf2] text-[#1f2d70] hover:bg-[#f7efcf]"
              }`}
              href={`/commons/${validation.campfirePath}?sort=newest&page=1`}
            >
              Newest
            </Link>
            <Link
              className={`border-[3px] px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                sort === "oldest"
                  ? "border-[#16224d] bg-[#1f2d70] text-amber-50 shadow-[2px_2px_0_#16224d]"
                  : "border-[#253370] bg-[#fffdf2] text-[#1f2d70] hover:bg-[#f7efcf]"
              }`}
              href={`/commons/${validation.campfirePath}?sort=oldest&page=1`}
            >
              Oldest
            </Link>
          </div>

          <Link
            className="inline-flex border-[3px] border-[#16224d] bg-[#1f2d70] px-4 py-2 text-sm font-bold uppercase tracking-wide text-amber-50 shadow-[3px_3px_0_#16224d] transition hover:-translate-y-0.5 hover:bg-[#293a87]"
            href={`/commons/${validation.campfirePath}/submit`}
          >
            Start a post
          </Link>
        </div>

        {result.posts.length > 0 ? (
          <section className="space-y-3">
            {result.posts.map((post) => (
              <article
                className="border-[3px] border-[#16224d] bg-[#fef7dc] p-5 shadow-[5px_5px_0_#16224d]"
                key={post.id}
              >
                <Link
                  className="font-mono text-xl font-bold text-[#121f4f] hover:underline"
                  href={`/commons/${validation.campfirePath}/posts/${post.id}`}
                >
                  {post.title}
                </Link>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-[#2e3b71]">
                  {post.body}
                </p>
                <p className="mt-3 text-xs text-[#344277]">
                  Posted {formatDate(post.createdAt)}
                </p>
              </article>
            ))}
          </section>
        ) : (
          <section className="border-[3px] border-dashed border-[#16224d] bg-[#fef7dc] p-8 text-center shadow-[5px_5px_0_#16224d]">
            <h2 className="font-mono text-lg font-bold text-[#121f4f]">
              No posts yet
            </h2>
            <p className="mt-2 text-sm text-[#2e3b71]">
              Be the first to start a thread in this campfire.
            </p>
          </section>
        )}

        <nav className="flex items-center justify-between border-[3px] border-[#16224d] bg-[#fef7dc] px-4 py-3 text-sm shadow-[5px_5px_0_#16224d]">
          <span className="font-semibold text-[#344277]">
            Page {clampedPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {canGoBack ? (
              <Link
                className="border-[3px] border-[#253370] bg-[#fffdf2] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#1f2d70] transition hover:bg-[#f7efcf]"
                href={`/commons/${validation.campfirePath}?sort=${sort}&page=${clampedPage - 1}`}
              >
                Previous
              </Link>
            ) : null}
            {canGoForward ? (
              <Link
                className="border-[3px] border-[#253370] bg-[#fffdf2] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#1f2d70] transition hover:bg-[#f7efcf]"
                href={`/commons/${validation.campfirePath}?sort=${sort}&page=${clampedPage + 1}`}
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
