import Link from "next/link";
import {
  type CampfireSort,
  getCampfireHref,
  listActiveCampfires,
} from "@/lib/commons/campfires";

const SORT_OPTIONS: Array<{ label: string; value: CampfireSort }> = [
  { label: "Recent activity", value: "activity" },
  { label: "Newest", value: "newest" },
  { label: "A → Z", value: "alphabetical" },
];

function asSingleValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function resolveSort(sortValue: string): CampfireSort {
  if (SORT_OPTIONS.some((option) => option.value === sortValue)) {
    return sortValue as CampfireSort;
  }
  return "activity";
}

function formatLastActivity(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

export default async function CommonsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const sort = resolveSort(asSingleValue(resolvedSearchParams.sort));
  const query = asSingleValue(resolvedSearchParams.q).trim();

  const campfires = await listActiveCampfires({
    sort,
    query,
  });

  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Commons Directory
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">NAT: Commons</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            NAT: Commons is our shared mission space for founders, builders, and
            stewards. Explore active campfires, catch up on recent posts, and
            discover the conversations shaping the Brooks AI HUB community.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form action="/commons" className="flex-1" method="get">
              <label className="sr-only" htmlFor="commons-filter-input">
                Filter campfires
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                defaultValue={query}
                id="commons-filter-input"
                name="q"
                placeholder="Filter by name or description"
                type="search"
              />
              <input name="sort" type="hidden" value={sort} />
            </form>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Sort
              </span>
              <div className="flex items-center gap-2">
                {SORT_OPTIONS.map((option) => {
                  const href =
                    query.length > 0
                      ? `/commons?sort=${option.value}&q=${encodeURIComponent(query)}`
                      : `/commons?sort=${option.value}`;

                  return (
                    <Link
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        option.value === sort
                          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                      }`}
                      href={href}
                      key={option.value}
                    >
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {campfires.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campfires.map((campfire) => (
              <Link
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                href={getCampfireHref(campfire.pathSegments)}
                key={campfire.id}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {campfire.name}
                  </h2>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {campfire.postCount} posts
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {campfire.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>/commons/{campfire.pathSegments.join("/")}</span>
                  <span>
                    Last active {formatLastActivity(campfire.lastActivityAt)}
                  </span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No campfires found yet
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {query
                ? "Try adjusting your filter or switching sort options."
                : "The Commons directory will populate as new campfires go live."}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
