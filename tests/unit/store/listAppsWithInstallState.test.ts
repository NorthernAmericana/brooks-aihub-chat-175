import {
  mapAppsWithInstallState,
  type StoreAppListItem,
} from "@/lib/store/mapAppsWithInstallState";
import { OFFICIAL_APP_FALLBACK_CATALOG } from "@/lib/store/officialAppFallback";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function appBySlug(apps: StoreAppListItem[], slug: string) {
  const match = apps.find((app) => app.slug === slug);
  assert(match, `expected app with slug ${slug}`);
  return match;
}

const mappedWithData = mapAppsWithInstallState({
  apps: [
    {
      id: "app-1",
      slug: "custom-app",
      name: "Custom App",
      description: "Custom",
      iconUrl: null,
      category: null,
      storePath: null,
      appPath: "/CustomApp",
      isOfficial: false,
    },
    {
      id: "app-2",
      slug: "namc",
      name: "NAMC",
      description: "NAMC",
      iconUrl: "/icons/namc-appicon.png",
      category: "Media",
      storePath: null,
      appPath: "/NAMC",
      isOfficial: true,
    },
  ],
  routeCounts: [
    { appId: "app-1", count: 3 },
    { appId: "app-2", count: 7 },
  ],
  installs: [{ appId: "app-2" }],
  namcInstallGateState: {
    openedAt: new Date("2026-01-01T00:00:00.000Z"),
    completedAt: null,
  },
});

assert(mappedWithData.length === 2, "expected mapped data to include db apps");
assert(
  appBySlug(mappedWithData, "custom-app").storePath === "/store/ato/custom-app",
  "expected generic storePath fallback"
);
assert(
  appBySlug(mappedWithData, "custom-app").routeCount === 3,
  "expected route count mapping"
);
assert(
  appBySlug(mappedWithData, "custom-app").isInstalled === false,
  "expected non-installed app"
);
assert(
  appBySlug(mappedWithData, "namc").storePath === "/store/namc",
  "expected NAMC storePath fallback"
);
assert(
  appBySlug(mappedWithData, "namc").isInstalled === true,
  "expected NAMC install gate state to mark app as installed"
);

const mappedNamcWithoutInstallGateState = mapAppsWithInstallState({
  apps: [
    {
      id: "app-2",
      slug: "namc",
      name: "NAMC",
      description: "NAMC",
      iconUrl: "/icons/namc-appicon.png",
      category: "Media",
      storePath: null,
      appPath: "/NAMC",
      isOfficial: true,
    },
  ],
  routeCounts: [{ appId: "app-2", count: 7 }],
  installs: [{ appId: "app-2" }],
  namcInstallGateState: null,
});

assert(
  appBySlug(mappedNamcWithoutInstallGateState, "namc").isInstalled === false,
  "expected NAMC app to ignore generic install rows when NAMC gate state is missing"
);

const mappedFallback = mapAppsWithInstallState({
  apps: [],
  routeCounts: [],
  installs: [{ appId: "missing" }],
});

assert(
  mappedFallback.length === OFFICIAL_APP_FALLBACK_CATALOG.length,
  "expected fallback item count to match official fallback catalog"
);

for (const fallbackApp of mappedFallback) {
  assert(
    fallbackApp.id.startsWith("official-fallback:"),
    "expected deterministic fallback ids"
  );
  assert(fallbackApp.routeCount === 0, "expected fallback routeCount to be zero");
  assert(
    fallbackApp.isInstalled === false,
    "expected fallback apps to be uninstalled"
  );
  assert(fallbackApp.isOfficial === true, "expected fallback apps to be official");
}

console.log("✅ listAppsWithInstallState mapper tests passed");
