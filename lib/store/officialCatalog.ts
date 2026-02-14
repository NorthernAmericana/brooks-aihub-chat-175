import { NAMC_APP_ICON_PATH } from "@/lib/constants/namc";

export type OfficialCatalogAppSeed = {
  slug: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  storePath: string;
  appPath: string;
  isOfficial: true;
};

export type OfficialCatalogRouteToolPolicy = {
  tools: string[];
};

export type OfficialCatalogRouteSeed = {
  appSlug: string;
  slash: string;
  label: string;
  description: string;
};

export const OFFICIAL_CATALOG_APP_SEEDS: OfficialCatalogAppSeed[] = [
  {
    slug: "brooksbears",
    name: "BrooksBears",
    description: "AI teddy bear companion for ages 13 and up",
    iconUrl: "/icons/brooksbears-appicon.png",
    category: "Entertainment",
    storePath: "/brooksbears/install",
    appPath: "/BrooksBears",
    isOfficial: true,
  },
  {
    slug: "mycarmindato",
    name: "MyCarMindATO",
    description: "Intelligent automotive AI assistant for your vehicle",
    iconUrl: "/icons/mycarmindato-appicon.png",
    category: "Utilities",
    storePath: "/mycarmind/install",
    appPath: "/mycarmind",
    isOfficial: true,
  },
  {
    slug: "myflowerai",
    name: "MyFlowerAI",
    description: "Cannabis tracking and data analysis for harm reduction",
    iconUrl: "/icons/myflowerai-appicon.png",
    category: "Health & Wellness",
    storePath: "/myflowerai/install",
    appPath: "/MyFlowerAI",
    isOfficial: true,
  },
  {
    slug: "namc",
    name: "NAMC",
    description:
      "Northern Americana Media Collection - Your curated media library and lore explorer",
    iconUrl: NAMC_APP_ICON_PATH,
    category: "Media & Entertainment",
    storePath: "/namc/install",
    appPath: "/NAMC",
    isOfficial: true,
  },
  {
    slug: "namc-reader",
    name: "NAMC Reader",
    description: "Placeholder reader experience for NAMC content previews",
    iconUrl: "/icons/namc-reader-placeholder.svg",
    category: "Media & Reading",
    storePath: "/namc-reader/install",
    appPath: "/NAMC/reader",
    isOfficial: true,
  },
  {
    slug: "lore-playground",
    name: "Lore Playground",
    description:
      "Pop-culture headcanon studio for hangout scenes, worldbuilding, and spoiler-aware lore exploration",
    iconUrl: "/icons/lore-playground-appicon.svg",
    category: "Pop Culture / Worldbuilding / Creative Companion",
    storePath: "/lore-playground/install",
    appPath: "/NAMC/lore-playground",
    isOfficial: true,
  },
];

export const OFFICIAL_CATALOG_TOOL_POLICIES: Record<
  string,
  OfficialCatalogRouteToolPolicy
> = {
  BrooksBears: {
    tools: ["createDocument", "updateDocument", "requestSuggestions", "saveMemory"],
  },
  "BrooksBears/BenjaminBear": {
    tools: ["createDocument", "updateDocument", "requestSuggestions", "saveMemory"],
  },
  MyCarMindATO: {
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
  MyFlowerAI: {
    tools: ["requestSuggestions", "saveMemory"],
  },
  NAMC: {
    tools: ["saveMemory"],
  },
  "NAMC/Lore-Playground": {
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
  },
  "NAMC/Lore-Playground/App": {
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
  },
  "NAMC/Reader": {
    tools: ["saveMemory"],
  },
};

export const OFFICIAL_CATALOG_ROUTE_SEEDS: OfficialCatalogRouteSeed[] = [
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
    appSlug: "lore-playground",
    slash: "NAMC/Lore-Playground",
    label: "Lore Playground",
    description: "Lore exploration & headcanon support",
  },
  {
    appSlug: "lore-playground",
    slash: "NAMC/Lore-Playground/App",
    label: "Lore Playground App Mode",
    description: "Standalone app UI route for hangout/workbench workflows",
  },
  {
    appSlug: "namc",
    slash: "NAMC/Reader",
    label: "NAMC Reader",
    description: "Reading mode for curated NAMC stories and excerpts",
  },
];
