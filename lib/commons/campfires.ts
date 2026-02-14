import { listCampfireDirectory } from "@/lib/db/commons-queries";

export type CampfireSort = "activity" | "newest" | "alphabetical";

export type CampfireDirectoryItem = {
  id: string;
  name: string;
  slug: string;
  pathSegments: string[];
  description: string;
  postCount: number;
  lastActivityAt: string;
  createdAt: string;
};

function normalizeQuery(query: string | undefined): string {
  return query?.trim().toLowerCase() ?? "";
}

export function getCampfireHref(pathSegments: string[]): string {
  const encodedSegments = pathSegments.map((segment) =>
    encodeURIComponent(segment)
  );
  return `/commons/${encodedSegments.join("/")}`;
}

export async function listActiveCampfires(options?: {
  sort?: CampfireSort;
  query?: string;
}): Promise<CampfireDirectoryItem[]> {
  const sort = options?.sort ?? "activity";
  const query = normalizeQuery(options?.query);

  const campfires = await listCampfireDirectory({
    sort,
    query,
  });

  return campfires.map((campfire) => ({
    id: campfire.id,
    slug: campfire.slug,
    name: campfire.name,
    description: campfire.description,
    pathSegments: campfire.path
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean),
    postCount: Number(campfire.postCount),
    lastActivityAt: campfire.lastActivityAt.toISOString(),
    createdAt: campfire.createdAt.toISOString(),
  }));
}
