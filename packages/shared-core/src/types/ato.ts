export type RouteKind = "official" | "custom";

export type RouteSuggestion = {
  id: string;
  label: string;
  slash: string;
  route: string;
  kind: RouteKind;
  atoId?: string;
  foundersOnly?: boolean;
  isFreeRoute?: boolean;
};

export type AtoManifestPermission =
  | "chat"
  | "read:memory"
  | "write:memory"
  | "suggest:actions";

export type AtoManifestMemoryPolicy = "none" | "session" | "persistent";

export type AtoManifestSafetyProfile = "standard" | "strict";

export type AtoManifestEntitlementRequirement = "none" | "founders";

export type AtoManifestStatus = "active" | "beta" | "deprecated";

export type AtoManifest = {
  id: string;
  displayName: string;
  slashPath: string;
  permissions: AtoManifestPermission[];
  memoryPolicy: AtoManifestMemoryPolicy;
  safetyProfile: AtoManifestSafetyProfile;
  entitlementRequirements: AtoManifestEntitlementRequirement;
  status: AtoManifestStatus;
};

export type AtoApp = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  category: string | null;
  storePath: string | null;
  appPath: string | null;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AtoRoute = {
  id: string;
  appId: string;
  slash: string;
  label: string;
  description: string | null;
  agentId: string | null;
  toolPolicy: Record<string, unknown>;
  isFoundersOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomAto = {
  id: string;
  ownerUserId: string;
  name: string;
  route: string | null;
  description: string | null;
  personalityName: string | null;
  instructions: string | null;
  toolPolicy: Record<string, unknown> | null;
  hasAvatar: boolean;
  createdAt: Date;
  updatedAt: Date;
};
