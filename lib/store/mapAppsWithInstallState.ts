import { OFFICIAL_APP_FALLBACK_CATALOG } from "@/lib/store/officialAppFallback";
import {
  hasNamcGateActivity,
  isNamcInstallVerificationStatus,
  isNamcVerificationFresh,
  type NamcInstallVerificationStatus,
} from "@/lib/store/namcInstallVerification";

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
  namcInstallGateCompleted: boolean;
  namcVerificationStatus: NamcInstallVerificationStatus | null;
};

export type StoreListMapperInput = {
  apps: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    category: string | null;
    storePath: string | null;
    appPath: string | null;
    isOfficial: boolean;
  }>;
  routeCounts: Array<{ appId: string; count: number | string | bigint }>;
  installs: Array<{ appId: string }>;
  namcInstallGateState?: {
    openedAt: Date | null;
    completedAt: Date | null;
    verificationStatus: string | null;
    verificationCheckedAt: Date | null;
  } | null;
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

export function mapAppsWithInstallState({
  apps,
  routeCounts,
  installs,
  namcInstallGateState,
}: StoreListMapperInput): StoreAppListItem[] {
  if (apps.length === 0) {
    return OFFICIAL_APP_FALLBACK_CATALOG.map((app) => ({
      id: `official-fallback:${app.slug}`,
      slug: app.slug,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      category: app.category,
      storePath: app.storePath,
      appPath: app.appPath,
      isOfficial: true,
      routeCount: 0,
      isInstalled: false,
      namcInstallGateCompleted: false,
      namcVerificationStatus: null,
    }));
  }

  const routeCountByApp = new Map(
    routeCounts.map((record) => [record.appId, Number(record.count)])
  );
  const installedAppIds = new Set(installs.map((record) => record.appId));
  const hasNamcInstallGateState = hasNamcGateActivity(namcInstallGateState);
  const namcVerificationStatus = isNamcInstallVerificationStatus(
    namcInstallGateState?.verificationStatus
  )
    ? namcInstallGateState.verificationStatus
    : "unknown";
  const namcVerificationIsFresh = isNamcVerificationFresh(
    namcInstallGateState?.verificationCheckedAt
  );

  return apps.map((app) => ({
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
    isInstalled:
      app.slug.toLowerCase() === "namc"
        ? hasNamcInstallGateState &&
          namcVerificationStatus === "installed" &&
          namcVerificationIsFresh
        : installedAppIds.has(app.id),
    namcInstallGateCompleted:
      app.slug.toLowerCase() === "namc" ? hasNamcInstallGateState : false,
    namcVerificationStatus: app.slug.toLowerCase() === "namc" ? namcVerificationStatus : null,
  }));
}
