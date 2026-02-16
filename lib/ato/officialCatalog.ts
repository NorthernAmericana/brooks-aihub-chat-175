import {
  OFFICIAL_ATO_MANIFESTS,
  REQUIRED_OFFICIAL_ATO_MANIFEST_IDS,
} from "@/packages/shared-core/src/manifests/officialAto";
import type { AtoManifest } from "@/packages/shared-core/src/types/ato";
import { formatRoutePath } from "@/lib/routes/utils";

export type OfficialAtoTreeNode = {
  id: string;
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
  id: string;
  label: string;
  slash: string;
  folder: string;
  foundersOnly: boolean;
  premium?: boolean;
  premiumIcon?: "diamond";
  requiresEntitlement?: "founders";
  badge?: "free";
};


const buildTreeNode = (manifest: AtoManifest): OfficialAtoTreeNode => {
  const segments = manifest.slashPath.split("/").filter(Boolean);
  const segment = segments.at(-1) ?? manifest.slashPath;
  const foundersOnly = manifest.entitlementRequirements === "founders";

  return {
    id: manifest.id,
    segment,
    path: manifest.slashPath,
    label: manifest.displayName,
    route: formatRoutePath(manifest.slashPath),
    premium: foundersOnly || undefined,
    premiumIcon: foundersOnly ? "diamond" : undefined,
    requiresEntitlement: foundersOnly ? "founders" : undefined,
    foundersOnly,
    badge: manifest.badge,
    children: [],
  };
};

const sortTree = (nodes: OfficialAtoTreeNode[]) => {
  nodes.sort((a, b) => a.segment.localeCompare(b.segment));
  for (const node of nodes) {
    sortTree(node.children);
  }
  return nodes;
};

const flattenTree = (
  nodes: OfficialAtoTreeNode[],
  items: OfficialAtoFlatItem[] = []
) => {
  for (const node of nodes) {
    items.push({
      id: node.id,
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
  }
  return items;
};

const buildOfficialTree = (manifests: AtoManifest[]): OfficialAtoTreeNode[] => {
  const nodesByPath = new Map<string, OfficialAtoTreeNode>();
  const roots: OfficialAtoTreeNode[] = [];

  const sortedByDepth = [...manifests].sort((a, b) => {
    const depthA = a.slashPath.split("/").length;
    const depthB = b.slashPath.split("/").length;
    return depthA - depthB;
  });

  for (const manifest of sortedByDepth) {
    const node = buildTreeNode(manifest);
    nodesByPath.set(manifest.slashPath, node);

    const parentPath = manifest.slashPath.includes("/")
      ? manifest.slashPath.split("/").slice(0, -1).join("/")
      : null;

    if (parentPath && nodesByPath.has(parentPath)) {
      nodesByPath.get(parentPath)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return sortTree(roots);
};

export const OFFICIAL_ATO_TREE = buildOfficialTree(OFFICIAL_ATO_MANIFESTS);

export const OFFICIAL_ATO_FLAT_LIST = flattenTree(OFFICIAL_ATO_TREE);

const hasManifestIdInTree = (
  nodes: OfficialAtoTreeNode[],
  manifestId: string
): boolean =>
  nodes.some((node) => {
    if (node.id === manifestId) {
      return true;
    }
    return hasManifestIdInTree(node.children, manifestId);
  });

for (const manifestId of REQUIRED_OFFICIAL_ATO_MANIFEST_IDS) {
  const hasInManifestSource = OFFICIAL_ATO_MANIFESTS.some(
    (manifest) => manifest.id === manifestId
  );
  const hasInTree = hasManifestIdInTree(OFFICIAL_ATO_TREE, manifestId);
  const hasInFlatList = OFFICIAL_ATO_FLAT_LIST.some(
    (item) => item.id === manifestId
  );

  if (!hasInManifestSource || !hasInTree || !hasInFlatList) {
    throw new Error(
      `Required official ATO manifest '${manifestId}' must exist in manifests, tree projection, and flat catalog projection.`
    );
  }
}
