import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  atoApps,
  atoRoutes,
  namcInstallGateState,
  userInstalls,
} from "@/lib/db/schema";
import { ensureOfficialCatalogBootstrapped } from "@/lib/store/bootstrapOfficialCatalog";
import {
  NAMC_INSTALL_VERIFICATION_MAX_AGE_MS,
  type NamcInstallVerificationStatus,
  hasNamcGateActivity,
  isNamcVerificationFresh,
} from "@/lib/store/namcInstallVerification";
import {
  mapAppsWithInstallState,
  type StoreAppListItem,
} from "@/lib/store/mapAppsWithInstallState";

export type { StoreAppListItem };

async function reconcileNamcInstallGateState(userId: string) {
  const [record] = await db
    .select({
      openedAt: namcInstallGateState.openedAt,
      completedAt: namcInstallGateState.completedAt,
      verificationStatus: namcInstallGateState.verificationStatus,
      verificationCheckedAt: namcInstallGateState.verificationCheckedAt,
    })
    .from(namcInstallGateState)
    .where(eq(namcInstallGateState.userId, userId))
    .limit(1);

  if (!record || !hasNamcGateActivity(record)) {
    return record ?? null;
  }

  const now = Date.now();
  const shouldDowngrade =
    record.verificationStatus !== "needs-recheck" &&
    !isNamcVerificationFresh(record.verificationCheckedAt, now);

  if (!shouldDowngrade) {
    return record;
  }

  const downgradedCheckedAt = new Date(now - NAMC_INSTALL_VERIFICATION_MAX_AGE_MS - 1);
  const [updatedRecord] = await db
    .update(namcInstallGateState)
    .set({
      verificationStatus: "needs-recheck",
      verificationMethod: "server-reconcile",
      verificationCheckedAt: downgradedCheckedAt,
      verificationDetails: {
        reason: "verification-stale",
        staleMs: now - (record.verificationCheckedAt?.getTime() ?? 0),
      },
      updatedAt: new Date(now),
    })
    .where(eq(namcInstallGateState.userId, userId))
    .returning({
      openedAt: namcInstallGateState.openedAt,
      completedAt: namcInstallGateState.completedAt,
      verificationStatus: namcInstallGateState.verificationStatus,
      verificationCheckedAt: namcInstallGateState.verificationCheckedAt,
    });

  return (
    updatedRecord ?? {
      ...record,
      verificationStatus: "needs-recheck" as NamcInstallVerificationStatus,
      verificationCheckedAt: downgradedCheckedAt,
    }
  );
}

export async function listAppsWithInstallState(userId?: string | null) {
  await ensureOfficialCatalogBootstrapped();

  const reconciledNamcGateState = userId
    ? await reconcileNamcInstallGateState(userId)
    : null;

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

  const mapped = mapAppsWithInstallState({
    apps,
    routeCounts,
    installs,
    namcInstallGateState: reconciledNamcGateState,
  });
  const officialAppsOnly = mapped.filter((app) => app.isOfficial);

  return officialAppsOnly.sort((a, b) => {
    if (a.isInstalled !== b.isInstalled) {
      return a.isInstalled ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
