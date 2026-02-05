import { inArray, sql } from "drizzle-orm";
import type { db as storeDb } from "@/lib/db";
import { atoApps, atoRoutes } from "@/lib/db/schema";
import {
  OFFICIAL_CATALOG_APP_SEEDS,
  OFFICIAL_CATALOG_ROUTE_SEEDS,
  OFFICIAL_CATALOG_TOOL_POLICIES,
} from "@/lib/store/officialCatalog";

type DatabaseClient = Pick<typeof storeDb, "insert" | "select">;

export async function bootstrapOfficialCatalog(database: DatabaseClient) {
  const now = new Date();

  await database
    .insert(atoApps)
    .values(
      OFFICIAL_CATALOG_APP_SEEDS.map((app) => ({
        ...app,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .onConflictDoUpdate({
      target: atoApps.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        iconUrl: sql`excluded.icon_url`,
        category: sql`excluded.category`,
        storePath: sql`excluded.store_path`,
        appPath: sql`excluded.app_path`,
        isOfficial: sql`excluded.is_official`,
        updatedAt: sql`excluded.updated_at`,
      },
    });

  const appRows = await database
    .select({ id: atoApps.id, slug: atoApps.slug })
    .from(atoApps)
    .where(
      inArray(
        atoApps.slug,
        OFFICIAL_CATALOG_APP_SEEDS.map((app) => app.slug)
      )
    );

  const appIdBySlug = new Map(appRows.map((row) => [row.slug, row.id]));

  const routeValues = OFFICIAL_CATALOG_ROUTE_SEEDS.map((route) => {
    const appId = appIdBySlug.get(route.appSlug);
    if (!appId) {
      throw new Error(`Missing app for slug ${route.appSlug}`);
    }

    const toolPolicy = OFFICIAL_CATALOG_TOOL_POLICIES[route.slash];
    if (!toolPolicy) {
      throw new Error(`Missing tool policy for ${route.slash}`);
    }

    return {
      appId,
      slash: route.slash,
      label: route.label,
      description: route.description,
      toolPolicy,
      createdAt: now,
      updatedAt: now,
    };
  });

  await database
    .insert(atoRoutes)
    .values(routeValues)
    .onConflictDoUpdate({
      target: [atoRoutes.appId, atoRoutes.slash],
      set: {
        label: sql`excluded.label`,
        description: sql`excluded.description`,
        toolPolicy: sql`excluded.tool_policy`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

let bootstrapPromise: Promise<void> | undefined;

export function ensureOfficialCatalogBootstrapped() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const { db } = await import("@/lib/db");
      await bootstrapOfficialCatalog(db);
    })().catch((error) => {
      bootstrapPromise = undefined;
      throw error;
    });
  }

  return bootstrapPromise;
}
