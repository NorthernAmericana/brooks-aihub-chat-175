import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { atoApps, atoRoutes } from "@/lib/db/schema";

export type StoreAppRoute = {
  id: string;
  slash: string;
  label: string;
  description: string | null;
  isFoundersOnly: boolean;
};

export type StoreAppDetails = {
  app: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    category: string | null;
    storePath: string | null;
    appPath: string | null;
    isOfficial: boolean;
  };
  routes: StoreAppRoute[];
  requiresFoundersAccess: boolean;
};

export async function getAppDetails(slug: string) {
  const [app] = await db.select().from(atoApps).where(eq(atoApps.slug, slug));

  if (!app) {
    return null;
  }

  const routes = await db
    .select()
    .from(atoRoutes)
    .where(eq(atoRoutes.appId, app.id))
    .orderBy(asc(atoRoutes.slash));

  const formattedRoutes = routes.map((route) => ({
    id: route.id,
    slash: route.slash,
    label: route.label,
    description: route.description,
    isFoundersOnly: route.isFoundersOnly,
  }));

  return {
    app: {
      id: app.id,
      slug: app.slug,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      category: app.category,
      storePath: app.storePath,
      appPath: app.appPath,
      isOfficial: app.isOfficial,
    },
    routes: formattedRoutes,
    requiresFoundersAccess: formattedRoutes.some((route) => route.isFoundersOnly),
  } satisfies StoreAppDetails;
}
