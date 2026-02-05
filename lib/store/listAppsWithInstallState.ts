import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { atoApps, atoRoutes, userInstalls } from "@/lib/db/schema";
import { ensureOfficialCatalogBootstrapped } from "@/lib/store/bootstrapOfficialCatalog";

export type StoreAppListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  category: string | null;
  storePath: string;
  appPath: string | null;
  isOfficial: boolean;
  routeCount: number;
  isInstalled: boolean;
};

function resolveStorePath(slug: string, storePath: string | null) {
  if (storePath) {
    return storePath;
  }
  if (slug.toLowerCase() === "namc") {
    return "/store/namc";
  }
  return `/store/ato/${slug}`;
}

export async function listAppsWithInstallState(userId?: string | null) {
  await ensureOfficialCatalogBootstrapped();

  const [apps, routeCounts, installs] = await Promise.all([
    db.select().from(atoApps).orderBy(asc(atoApps.name)),
    db
      .select({ appId: atoRoutes.appId, count: count() })
      .from(atoRoutes)
      .groupBy(atoRoutes.appId),
    userId
      ? db
          .select({ appId: userInstalls.appId })
          .from(userInstalls)
          .where(eq(userInstalls.userId, userId))
      : Promise.resolve([]),
  ]);

  const routeCountByApp = new Map(
    routeCounts.map((record) => [record.appId, Number(record.count)])
  );
  const installedAppIds = new Set(installs.map((record) => record.appId));

  const mapped = apps.map((app) => {
    const isInstalled = installedAppIds.has(app.id);
    return {
      id: app.id,
      slug: app.slug,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      category: app.category,
      storePath: resolveStorePath(app.slug, app.storePath ?? null),
      appPath: app.appPath,
      isOfficial: app.isOfficial,
      routeCount: routeCountByApp.get(app.id) ?? 0,
      isInstalled,
    } satisfies StoreAppListItem;
  });

  return mapped.sort((a, b) => {
    if (a.isInstalled !== b.isInstalled) {
      return a.isInstalled ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
