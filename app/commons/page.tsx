import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/app/(auth)/auth";
import {
  type CampfireSort,
  getCampfireHref,
  listActiveCampfires,
} from "@/lib/commons/campfires";
import { hasPrivateDmCampfiresForMember } from "@/lib/db/commons-queries";

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
  const session = await auth();
  const hasDmCampfires = session?.user?.id
    ? await hasPrivateDmCampfiresForMember(session.user.id)
    : false;

  return (
    <main className="min-h-dvh bg-transparent px-4 py-8 text-slate-900 dark:text-amber-50 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="overflow-hidden border-[3px] border-[#16224d] bg-[#fef7dc] shadow-[5px_5px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#111c4a] dark:shadow-[5px_5px_0_#f6e8b4]">
          <div className="border-b-[3px] border-[#16224d] bg-[#111c4a] px-4 py-4 text-amber-50 dark:border-[#f6e8b4] dark:bg-[#0a1233]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200/90">
              Commons Directory
            </p>
            <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
              🔥 /NAT: Commons/
            </h1>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start gap-3">
              <Link
                className="inline-flex border-[3px] border-[#16224d] bg-[#1f2d70] px-4 py-2 text-sm font-bold uppercase tracking-wide text-amber-50 shadow-[3px_3px_0_#16224d] transition hover:-translate-y-0.5 hover:bg-[#293a87] dark:border-[#f6e8b4] dark:bg-[#f6e8b4] dark:text-[#111c4a] dark:shadow-[3px_3px_0_#f6e8b4] dark:hover:bg-[#fff2c4]"
                href="/commons/create"
              >
                + Create campfire
              </Link>

              {hasDmCampfires ? (
                <Link
                  className="group flex flex-col items-center text-[#16224d] transition hover:-translate-y-0.5 dark:text-amber-100"
                  href="/commons/dm"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center border-[3px] border-[#16224d] bg-[#1f2d70] text-amber-50 shadow-[3px_3px_0_#16224d] transition hover:bg-[#293a87] dark:border-[#f6e8b4] dark:bg-[#f6e8b4] dark:text-[#111c4a] dark:shadow-[3px_3px_0_#f6e8b4] dark:hover:bg-[#fff2c4]">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <span className="mt-1 text-[10px] font-bold tracking-wide group-active:underline sm:text-xs">
                    Already have a Campfire Chat?
                  </span>
                </Link>
              ) : (
                <div className="flex cursor-not-allowed flex-col items-center text-[#16224d] opacity-50 dark:text-amber-100">
                  <span className="inline-flex h-11 w-11 items-center justify-center border-[3px] border-[#16224d] bg-[#1f2d70] text-amber-50 shadow-[3px_3px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#f6e8b4] dark:text-[#111c4a] dark:shadow-[3px_3px_0_#f6e8b4]">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <span className="mt-1 text-[10px] font-bold tracking-wide sm:text-xs">
                    Already have a Campfire Chat?
                  </span>
                </div>
              )}
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-[#29366a] dark:text-amber-100 sm:text-base">
              NAT: Commons is our shared mission space for founders, builders,
              and stewards. Explore active campfires, catch up on recent posts,
              and discover the conversations shaping the Brooks AI HUB
              community.
            </p>
          </div>
        </header>

        <section className="border-[3px] border-[#16224d] bg-[#fef7dc] p-4 shadow-[5px_5px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#111c4a] dark:shadow-[5px_5px_0_#f6e8b4] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form action="/commons" className="flex-1" method="get">
              <label className="sr-only" htmlFor="commons-filter-input">
                Filter campfires
              </label>
              <input
                className="w-full border-[3px] border-[#16224d] bg-[#fffdf2] px-3 py-2 text-sm text-[#1c2552] placeholder:text-[#6671a4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b4a92] dark:border-[#f6e8b4] dark:bg-[#0b1336] dark:text-amber-50 dark:placeholder:text-amber-200/70 dark:focus-visible:ring-amber-200"
                defaultValue={query}
                id="commons-filter-input"
                name="q"
                placeholder="Search campfires..."
                type="search"
              />
              <input name="sort" type="hidden" value={sort} />
            </form>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-[#29366a] dark:text-amber-100">
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
                      className={`border-[3px] px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                        option.value === sort
                          ? "border-[#16224d] bg-[#1f2d70] text-amber-50 shadow-[2px_2px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#f6e8b4] dark:text-[#111c4a] dark:shadow-[2px_2px_0_#f6e8b4]"
                          : "border-[#253370] bg-[#fffdf2] text-[#1f2d70] hover:bg-[#f7efcf] dark:border-[#f6e8b4] dark:bg-[#0a1233] dark:text-amber-50 dark:hover:bg-[#16224d]"
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
                className="group flex h-full flex-col border-[3px] border-[#16224d] bg-[#fef7dc] p-5 shadow-[5px_5px_0_#16224d] transition hover:-translate-y-0.5 dark:border-[#f6e8b4] dark:bg-[#111c4a] dark:shadow-[5px_5px_0_#f6e8b4]"
                href={getCampfireHref(campfire.pathSegments)}
                key={campfire.id}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="font-mono text-xl font-bold text-[#121f4f] dark:text-amber-50">
                    {campfire.name}
                  </h2>
                  <span className="border-[3px] border-[#16224d] bg-[#1f2d70] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-50 dark:border-[#f6e8b4] dark:bg-[#f6e8b4] dark:text-[#111c4a]">
                    {campfire.postCount} posts
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#2e3b71] dark:text-amber-100">
                  {campfire.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t-2 border-dotted border-[#4f5f99] pt-3 text-xs text-[#344277] dark:border-amber-100/40 dark:text-amber-100/90">
                  <span>/commons/{campfire.pathSegments.join("/")}</span>
                  <span>
                    Last active {formatLastActivity(campfire.lastActivityAt)}
                  </span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="border-[3px] border-dashed border-[#16224d] bg-[#fef7dc] p-10 text-center shadow-[5px_5px_0_#16224d] dark:border-[#f6e8b4] dark:bg-[#111c4a] dark:shadow-[5px_5px_0_#f6e8b4]">
            <h2 className="font-mono text-lg font-bold text-[#121f4f] dark:text-amber-50">
              No campfires found yet
            </h2>
            <p className="mt-2 text-sm text-[#2e3b71] dark:text-amber-100">
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
