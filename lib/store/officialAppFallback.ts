export type OfficialAppFallbackItem = {
  slug: string;
  name: string;
  iconUrl: string;
  appPath: string;
  storePath: string;
  category: string;
  description: string;
};

export const OFFICIAL_APP_FALLBACK_CATALOG: OfficialAppFallbackItem[] = [
  {
    slug: "brooksbears",
    name: "BrooksBears",
    iconUrl: "/icons/brooksbears-appicon.png",
    appPath: "/BrooksBears",
    storePath: "/brooksbears-app",
    category: "Entertainment",
    description: "AI teddy bear companion for ages 13 and up",
  },
  {
    slug: "mycarmindato",
    name: "MyCarMindATO",
    iconUrl: "/icons/mycarmindato-appicon.png",
    appPath: "/MyCarMindATO",
    storePath: "/mycarmindato-app",
    category: "Utilities",
    description: "Intelligent automotive AI assistant for your vehicle",
  },
  {
    slug: "myflowerai",
    name: "MyFlowerAI",
    iconUrl: "/icons/myflowerai-appicon.png",
    appPath: "/MyFlowerAI",
    storePath: "/myflowerai-app",
    category: "Health & Wellness",
    description: "Cannabis tracking and data analysis for harm reduction",
  },
  {
    slug: "namc",
    name: "NAMC",
    iconUrl: "/icons/namc-appicon.png",
    appPath: "/NAMC",
    storePath: "/namc-app",
    category: "Media & Entertainment",
    description:
      "Northern Americana Media Collection - Your curated media library and lore explorer",
  },
];
