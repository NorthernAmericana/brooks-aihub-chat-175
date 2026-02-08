import { formatRoutePath, normalizeRouteKey } from "@/lib/routes/utils";

export type OfficialAtoCatalogNode = {
  title: string;
  slash: string;
  children?: OfficialAtoCatalogNode[];
  premium?: boolean;
  premiumIcon?: "diamond";
  requiresEntitlement?: "founders";
  badge?: "free";
};

export type OfficialAtoTreeNode = {
  segment: string;
  path: string;
  label: string;
  route: string;
  premium?: boolean;
  premiumIcon?: "diamond";
  requiresEntitlement?: "founders";
  foundersOnly: boolean;
  badge?: "free";
  children: OfficialAtoTreeNode[];
};

export type OfficialAtoFlatItem = {
  label: string;
  slash: string;
  folder: string;
  foundersOnly: boolean;
  premium?: boolean;
  premiumIcon?: "diamond";
  requiresEntitlement?: "founders";
  badge?: "free";
};

const OFFICIAL_ATO_CATALOG: OfficialAtoCatalogNode[] = [
  {
    title: "Brooks AI HUB",
    slash: "Brooks AI HUB",
  },
  {
    title: "BrooksBears",
    slash: "BrooksBears",
    children: [
      {
        title: "Benjamin Bear",
        slash: "BrooksBears/BenjaminBear",
        premium: true,
        premiumIcon: "diamond",
        requiresEntitlement: "founders",
      },
    ],
  },
  {
    title: "MyCarMindATO",
    slash: "MyCarMindATO",
    children: [
      {
        title: "MyCarMindATO - Driver",
        slash: "MyCarMindATO/Driver",
        badge: "free",
      },
      {
        title: "MyCarMindATO - Trucker",
        slash: "MyCarMindATO/Trucker",
        premium: true,
        premiumIcon: "diamond",
        requiresEntitlement: "founders",
      },
      {
        title: "MyCarMindATO - Delivery Driver",
        slash: "MyCarMindATO/DeliveryDriver",
        badge: "free",
      },
      {
        title: "MyCarMindATO - Traveler",
        slash: "MyCarMindATO/Traveler",
        badge: "free",
      },
    ],
  },
  {
    title: "MyFlowerAI",
    slash: "MyFlowerAI",
  },
  {
    title: "Brooks AI HUB Summaries",
    slash: "Brooks AI HUB/Summaries",
    premium: true,
    premiumIcon: "diamond",
    requiresEntitlement: "founders",
  },
  {
    title: "Northern Americana Tech Agent",
    slash: "NAT",
  },
  {
    title: "NAMC AI Media Curator",
    slash: "NAMC",
    children: [
      {
        title: "NAMC Reader",
        slash: "NAMC/Reader",
        premium: true,
        premiumIcon: "diamond",
        requiresEntitlement: "founders",
      },
      {
        title: "Lore Playground",
        slash: "NAMC/Lore-Playground",
        badge: "free",
      },
    ],
  },
];

const buildTreeNode = (node: OfficialAtoCatalogNode): OfficialAtoTreeNode => {
  const segments = node.slash.split("/").filter(Boolean);
  const segment = segments.at(-1) ?? node.slash;
  return {
    segment,
    path: node.slash,
    label: node.title,
    route: formatRoutePath(node.slash),
    premium: node.premium,
    premiumIcon: node.premiumIcon,
    requiresEntitlement: node.requiresEntitlement,
    foundersOnly: node.requiresEntitlement === "founders",
    badge: node.badge,
    children: node.children?.map(buildTreeNode) ?? [],
  };
};

const sortTree = (nodes: OfficialAtoTreeNode[]) => {
  nodes.sort((a, b) => a.segment.localeCompare(b.segment));
  nodes.forEach((node) => sortTree(node.children));
  return nodes;
};

const flattenTree = (
  nodes: OfficialAtoTreeNode[],
  items: OfficialAtoFlatItem[] = []
) => {
  nodes.forEach((node) => {
    items.push({
      label: node.label,
      slash: node.path,
      folder: node.route,
      foundersOnly: node.foundersOnly,
      premium: node.premium,
      premiumIcon: node.premiumIcon,
      requiresEntitlement: node.requiresEntitlement,
      badge: node.badge,
    });
    if (node.children.length > 0) {
      flattenTree(node.children, items);
    }
  });
  return items;
};

export const OFFICIAL_ATO_TREE = sortTree(
  OFFICIAL_ATO_CATALOG.map(buildTreeNode)
);

export const OFFICIAL_ATO_FLAT_LIST = flattenTree(OFFICIAL_ATO_TREE);

const NAMC_READER_KEY = normalizeRouteKey("NAMC/Reader");

const hasNamcReaderInTree = (nodes: OfficialAtoTreeNode[]): boolean =>
  nodes.some((node) => {
    if (normalizeRouteKey(node.path) === NAMC_READER_KEY) {
      return true;
    }
    return hasNamcReaderInTree(node.children);
  });

const hasNamcReaderInFlatList = OFFICIAL_ATO_FLAT_LIST.some(
  (item) => normalizeRouteKey(item.slash) === NAMC_READER_KEY
);

if (!hasNamcReaderInTree(OFFICIAL_ATO_TREE) || !hasNamcReaderInFlatList) {
  throw new Error(
    "NAMC Reader must exist in both the official ATO tree and the flat catalog list."
  );
}
