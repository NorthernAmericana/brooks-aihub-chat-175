import { NAMC_APP_ICON_PATH } from "@/lib/constants/namc";

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
    storePath: "/brooksbears/install",
    category: "Entertainment",
    description: "AI teddy bear companion for ages 13 and up",
  },
  {
    slug: "mycarmindato",
    name: "MyCarMindATO",
    iconUrl: "/icons/mycarmindato-appicon.png",
    appPath: "/mycarmind",
    storePath: "/mycarmind/install",
    category: "Utilities",
    description: "Intelligent automotive AI assistant for your vehicle",
  },
  {
    slug: "myflowerai",
    name: "MyFlowerAI",
    iconUrl: "/icons/myflowerai-appicon.png",
    appPath: "/MyFlowerAI",
    storePath: "/myflowerai/install",
    category: "Health & Wellness",
    description: "Cannabis tracking and data analysis for harm reduction",
  },
  {
    slug: "namc",
    name: "NAMC",
    iconUrl: NAMC_APP_ICON_PATH,
    appPath: "/NAMC",
    storePath: "/namc/install",
    category: "Media & Entertainment",
    description:
      "Northern Americana Media Collection - Your curated media library and lore explorer",
  },
  {
    slug: "namc-reader",
    name: "NAMC Reader",
    iconUrl: "/icons/namc-reader-placeholder.svg",
    appPath: "/NAMC/reader",
    storePath: "/namc-reader/install",
    category: "Media & Reading",
    description: "Placeholder reader experience for NAMC content previews",
  },
  {
    slug: "namc-lore-playground",
    name: "NAMC Lore Playground",
    iconUrl: NAMC_APP_ICON_PATH,
    appPath: "/NAMC/lore-playground",
    storePath: "/namc-lore-playground/install",
    category: "Media & Entertainment",
    description:
      "Dedicated lore sandbox for NAMC worlds, external media canon, and headcanon building",
  },
];
