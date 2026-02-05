import { config } from "dotenv";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { atoApps, atoRoutes } from "../lib/db/schema";

config({
  path: ".env.local",
});

const appSeeds = [
  {
    slug: "brooksbears",
    name: "BrooksBears",
    description: "AI teddy bear companion for ages 13 and up",
    iconUrl: "/icons/brooksbears-appicon.png",
    category: "Entertainment",
    storePath: "/brooksbears-app",
    appPath: "/BrooksBears",
    isOfficial: true,
  },
  {
    slug: "mycarmindato",
    name: "MyCarMindATO",
    description: "Intelligent automotive AI assistant for your vehicle",
    iconUrl: "/icons/mycarmindato-appicon.png",
    category: "Utilities",
    storePath: "/mycarmindato-app",
    appPath: "/MyCarMindATO",
    isOfficial: true,
  },
  {
    slug: "myflowerai",
    name: "MyFlowerAI",
    description: "Cannabis tracking and data analysis for harm reduction",
    iconUrl: "/icons/myflowerai-appicon.png",
    category: "Health & Wellness",
    storePath: "/myflowerai-app",
    appPath: "/MyFlowerAI",
    isOfficial: true,
  },
  {
    slug: "namc",
    name: "NAMC",
    description:
      "Northern Americana Media Collection - Your curated media library and lore explorer",
    iconUrl: "/icons/namc-appicon.png",
    category: "Media & Entertainment",
    storePath: "/namc-app",
    appPath: "/NAMC",
    isOfficial: true,
  },
];

const toolPolicies: Record<string, { tools: string[] }> = {
  "BrooksBears": {
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
  },
  "BrooksBears/BenjaminBear": {
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
  },
  "MyCarMindATO": {
    tools: [
      "getDirections",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
      "saveHomeLocation",
    ],
  },
  "MyCarMindATO/Driver": {
    tools: [
      "getDirections",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
      "saveHomeLocation",
    ],
  },
  "MyCarMindATO/Trucker": {
    tools: [
      "getDirections",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
      "saveHomeLocation",
    ],
  },
  "MyCarMindATO/DeliveryDriver": {
    tools: [
      "getDirections",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
      "saveHomeLocation",
    ],
  },
  "MyCarMindATO/Traveler": {
    tools: [
      "getDirections",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
      "saveHomeLocation",
    ],
  },
  "MyFlowerAI": {
    tools: ["requestSuggestions", "saveMemory"],
  },
  NAMC: {
    tools: ["saveMemory"],
  },
  "NAMC/Lore-Playground": {
    tools: ["saveMemory"],
  },
};

const routeSeeds = [
  {
    appSlug: "brooksbears",
    slash: "BrooksBears",
    label: "Brooks Bears",
    description: "Main chat interface",
  },
  {
    appSlug: "brooksbears",
    slash: "BrooksBears/BenjaminBear",
    label: "Benjamin Bear",
    description: "Benjamin Bear persona",
  },
  {
    appSlug: "mycarmindato",
    slash: "MyCarMindATO",
    label: "MyCarMindATO",
    description: "Main interface",
  },
  {
    appSlug: "mycarmindato",
    slash: "MyCarMindATO/Driver",
    label: "MyCarMindATO - Driver",
    description: "Personal car owners",
  },
  {
    appSlug: "mycarmindato",
    slash: "MyCarMindATO/Trucker",
    label: "MyCarMindATO - Trucker",
    description: "Commercial truck drivers",
  },
  {
    appSlug: "mycarmindato",
    slash: "MyCarMindATO/DeliveryDriver",
    label: "MyCarMindATO - Delivery Driver",
    description: "Delivery/gig drivers",
  },
  {
    appSlug: "mycarmindato",
    slash: "MyCarMindATO/Traveler",
    label: "MyCarMindATO - Traveler",
    description: "Road trip enthusiasts",
  },
  {
    appSlug: "myflowerai",
    slash: "MyFlowerAI",
    label: "MyFlowerAI",
    description: "Main interface",
  },
  {
    appSlug: "namc",
    slash: "NAMC",
    label: "NAMC AI Media Curator",
    description: "Main media curator",
  },
  {
    appSlug: "namc",
    slash: "NAMC/Lore-Playground",
    label: "NAMC Lore Playground",
    description: "Lore exploration & headcanon support",
  },
];

const runSeed = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("⏭️  POSTGRES_URL not defined, skipping seed");
    process.exit(0);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  const now = new Date();

  await db
    .insert(atoApps)
    .values(
      appSeeds.map((app) => ({
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

  const appRows = await db
    .select({ id: atoApps.id, slug: atoApps.slug })
    .from(atoApps)
    .where(inArray(atoApps.slug, appSeeds.map((app) => app.slug)));

  const appIdBySlug = new Map(appRows.map((row) => [row.slug, row.id]));

  const routeValues = routeSeeds.map((route) => {
    const appId = appIdBySlug.get(route.appSlug);
    if (!appId) {
      throw new Error(`Missing app for slug ${route.appSlug}`);
    }

    const toolPolicy = toolPolicies[route.slash];
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

  await db
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

  await connection.end();
  console.log("✅ Seeded ATO apps and routes");
};

runSeed().catch((err) => {
  console.error("❌ Seed failed");
  console.error(err);
  process.exit(1);
});
