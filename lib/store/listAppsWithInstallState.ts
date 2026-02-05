import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { atoApps, atoRoutes, userInstalls } from "@/lib/db/schema";
import { ensureOfficialCatalogBootstrapped } from "@/lib/store/bootstrapOfficialCatalog";
import {
  mapAppsWithInstallState,
  type StoreAppListItem,
} from "@/lib/store/mapAppsWithInstallState";

export type { StoreAppListItem };

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

  if (apps.length === 0) {
    console.warn("[store] ato_apps empty; serving official fallback catalog");
  }

  const mapped = mapAppsWithInstallState({ apps, routeCounts, installs });

  return mapped.sort((a, b) => {
    if (a.isInstalled !== b.isInstalled) {
      return a.isInstalled ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
