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

type CampfireRecord = CampfireDirectoryItem & {
  isActive: boolean;
};

const CAMPFIRE_DIRECTORY: CampfireRecord[] = [
  {
    id: "campfire-roadmap",
    name: "Roadmap Campfire",
    slug: "roadmap",
    pathSegments: ["roadmap"],
    description: "Discuss release priorities, milestones, and roadmap updates.",
    postCount: 12,
    lastActivityAt: "2026-01-30T15:05:00.000Z",
    createdAt: "2025-12-10T09:00:00.000Z",
    isActive: true,
  },
  {
    id: "campfire-builders-circle",
    name: "Builders Circle",
    slug: "builders-circle",
    pathSegments: ["community", "builders-circle"],
    description:
      "A shared circle for build logs, launches, and founder support.",
    postCount: 26,
    lastActivityAt: "2026-02-04T11:30:00.000Z",
    createdAt: "2026-01-05T08:15:00.000Z",
    isActive: true,
  },
  {
    id: "campfire-archive",
    name: "Archive",
    slug: "archive",
    pathSegments: ["archive"],
    description: "Read-only archive for earlier Commons conversations.",
    postCount: 0,
    lastActivityAt: "2025-10-11T18:00:00.000Z",
    createdAt: "2025-09-15T14:00:00.000Z",
    isActive: false,
  },
];

function normalizeQuery(query: string | undefined): string {
  return query?.trim().toLowerCase() ?? "";
}

function sortCampfires(
  items: CampfireDirectoryItem[],
  sort: CampfireSort
): CampfireDirectoryItem[] {
  return [...items].sort((a, b) => {
    if (sort === "alphabetical") {
      return a.name.localeCompare(b.name);
    }

    if (sort === "newest") {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }

    return Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);
  });
}

export function getCampfireHref(pathSegments: string[]): string {
  const encodedSegments = pathSegments.map((segment) =>
    encodeURIComponent(segment)
  );
  return `/commons/${encodedSegments.join("/")}`;
}

export function listActiveCampfires(options?: {
  sort?: CampfireSort;
  query?: string;
}): CampfireDirectoryItem[] {
  const sort = options?.sort ?? "activity";
  const query = normalizeQuery(options?.query);

  const activeCampfires = CAMPFIRE_DIRECTORY.filter(
    (campfire) => campfire.isActive
  ).map(({ isActive: _isActive, ...campfire }) => campfire);

  const filteredCampfires = query
    ? activeCampfires.filter(
        (campfire) =>
          campfire.name.toLowerCase().includes(query) ||
          campfire.description.toLowerCase().includes(query)
      )
    : activeCampfires;

  return sortCampfires(filteredCampfires, sort);
}
