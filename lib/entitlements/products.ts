/**
 * Product IDs for entitlements
 */
export const PRODUCT_IDS = {
  MDD_GAME_BASE: "MDD-GAME_BASE",
  MDD_NOVEL_BASE: "MDD_NOVEL_BASE",
  MDD_SPOILER_PASS: "MDD_SPOILER_PASS",
  FOUNDERS_ACCESS: "FOUNDERS_ACCESS",
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

/**
 * Entitlement rules and logic - placeholders for future implementation
 */
export interface EntitlementRules {
  hasGameAccess: boolean;
  hasNovelAccess: boolean;
  hasSpoilerPass: boolean;
  hasFoundersAccess: boolean;
  progress?: EntitlementProgress;
}

export type SpoilerAccessLevel = "none" | "light" | "full";

export type EntitlementProgress = {
  game?: {
    percent?: number;
    chapter?: number;
    completed?: boolean;
  };
  novel?: {
    percent?: number;
    chapter?: number;
    completed?: boolean;
  };
  spoilerAccess?: SpoilerAccessLevel;
};

export type EntitlementRecord = {
  productId: string;
  metadata?: Record<string, unknown> | null;
};

export type SpoilerAccessSummary = {
  level: SpoilerAccessLevel;
  reasons: string[];
  progress?: EntitlementProgress;
};

const spoilerAccessRank: Record<SpoilerAccessLevel, number> = {
  none: 0,
  light: 1,
  full: 2,
};

function getHigherSpoilerAccess(
  current: SpoilerAccessLevel,
  next: SpoilerAccessLevel
): SpoilerAccessLevel {
  return spoilerAccessRank[next] > spoilerAccessRank[current] ? next : current;
}

function normalizePercent(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, value));
  }
  return undefined;
}

function normalizeChapter(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  return undefined;
}

function normalizeSpoilerAccess(
  value: unknown
): SpoilerAccessLevel | undefined {
  if (value === "none" || value === "light" || value === "full") {
    return value;
  }
  return undefined;
}

function extractProgress(metadata?: Record<string, unknown> | null) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }
  const progress = metadata.progress;
  if (!progress || typeof progress !== "object") {
    return undefined;
  }
  const progressRecord = progress as Record<string, unknown>;
  const game = progressRecord.game as Record<string, unknown> | undefined;
  const novel = progressRecord.novel as Record<string, unknown> | undefined;
  const spoilerAccess = normalizeSpoilerAccess(progressRecord.spoilerAccess);
  return {
    spoilerAccess,
    game: game
      ? {
          percent: normalizePercent(game.percent),
          chapter: normalizeChapter(game.chapter),
          completed: game.completed === true,
        }
      : undefined,
    novel: novel
      ? {
          percent: normalizePercent(novel.percent),
          chapter: normalizeChapter(novel.chapter),
          completed: novel.completed === true,
        }
      : undefined,
  } satisfies EntitlementProgress;
}

function mergeProgress(
  base: EntitlementProgress | undefined,
  incoming: EntitlementProgress | undefined
): EntitlementProgress | undefined {
  if (!base) {
    return incoming;
  }
  if (!incoming) {
    return base;
  }
  return {
    spoilerAccess: incoming.spoilerAccess
      ? getHigherSpoilerAccess(
          base.spoilerAccess ?? "none",
          incoming.spoilerAccess
        )
      : base.spoilerAccess,
    game: {
      percent:
        Math.max(base.game?.percent ?? 0, incoming.game?.percent ?? 0) ||
        undefined,
      chapter:
        Math.max(base.game?.chapter ?? 0, incoming.game?.chapter ?? 0) ||
        undefined,
      completed: base.game?.completed || incoming.game?.completed || undefined,
    },
    novel: {
      percent:
        Math.max(base.novel?.percent ?? 0, incoming.novel?.percent ?? 0) ||
        undefined,
      chapter:
        Math.max(base.novel?.chapter ?? 0, incoming.novel?.chapter ?? 0) ||
        undefined,
      completed:
        base.novel?.completed || incoming.novel?.completed || undefined,
    },
  };
}

export function deriveEntitlementRules(
  entitlements: EntitlementRecord[]
): EntitlementRules {
  let hasGameAccess = false;
  let hasNovelAccess = false;
  let hasSpoilerPass = false;
  let hasFoundersAccess = false;
  let progress: EntitlementProgress | undefined;

  for (const entitlement of entitlements) {
    switch (entitlement.productId) {
      case PRODUCT_IDS.MDD_GAME_BASE:
        hasGameAccess = true;
        break;
      case PRODUCT_IDS.MDD_NOVEL_BASE:
        hasNovelAccess = true;
        break;
      case PRODUCT_IDS.MDD_SPOILER_PASS:
        hasSpoilerPass = true;
        break;
      case PRODUCT_IDS.FOUNDERS_ACCESS:
        hasFoundersAccess = true;
        break;
      default:
        break;
    }
    progress = mergeProgress(progress, extractProgress(entitlement.metadata));
  }

  return {
    hasGameAccess,
    hasNovelAccess,
    hasSpoilerPass,
    hasFoundersAccess,
    progress,
  };
}

export function getSpoilerAccessSummary(
  rules: EntitlementRules
): SpoilerAccessSummary {
  const reasons: string[] = [];
  let level: SpoilerAccessLevel = "none";

  if (rules.hasSpoilerPass) {
    level = "full";
    reasons.push("spoiler pass entitlement");
  }

  const progress = rules.progress;
  if (progress?.spoilerAccess) {
    level = getHigherSpoilerAccess(level, progress.spoilerAccess);
    reasons.push(`progress unlock: ${progress.spoilerAccess}`);
  }

  if (progress?.game?.completed || progress?.novel?.completed) {
    level = getHigherSpoilerAccess(level, "full");
    reasons.push("completed story progress");
  }

  if ((rules.hasGameAccess || rules.hasNovelAccess) && level === "none") {
    level = "light";
    reasons.push("base entitlement access");
  }

  if (
    level === "light" &&
    (progress?.game?.percent || progress?.novel?.percent)
  ) {
    reasons.push("active story progress");
  }

  if (reasons.length === 0) {
    reasons.push("no spoiler entitlements");
  }

  return {
    level,
    reasons,
    progress,
  };
}

export function formatSpoilerAccessContext(
  summary: SpoilerAccessSummary
): string {
  const lines = [
    "SPOILER ACCESS",
    `Level: ${summary.level}`,
    `Sources: ${summary.reasons.join(", ")}`,
  ];

  const gameProgress = summary.progress?.game;
  const novelProgress = summary.progress?.novel;
  if (gameProgress) {
    const details = [
      gameProgress.completed ? "completed" : null,
      typeof gameProgress.percent === "number"
        ? `${gameProgress.percent}%`
        : null,
      typeof gameProgress.chapter === "number"
        ? `chapter ${gameProgress.chapter}`
        : null,
    ].filter(Boolean);
    if (details.length > 0) {
      lines.push(`Game progress: ${details.join(", ")}`);
    }
  }
  if (novelProgress) {
    const details = [
      novelProgress.completed ? "completed" : null,
      typeof novelProgress.percent === "number"
        ? `${novelProgress.percent}%`
        : null,
      typeof novelProgress.chapter === "number"
        ? `chapter ${novelProgress.chapter}`
        : null,
    ].filter(Boolean);
    if (details.length > 0) {
      lines.push(`Novel progress: ${details.join(", ")}`);
    }
  }

  return lines.join("\n");
}

/**
 * Check if user has access to a specific feature based on their entitlements.
 */
export function checkFeatureAccess(
  rules: EntitlementRules,
  feature: string
): boolean {
  const spoilerSummary = getSpoilerAccessSummary(rules);
  const foundersPerks = getFoundersAccessPerks(rules);
  const foundersPerkMap = new Map(
    foundersPerks.map((perk) => [perk.featureKey, perk.isUnlocked])
  );

  if (foundersPerkMap.has(feature)) {
    return foundersPerkMap.get(feature) ?? false;
  }

  switch (feature) {
    case "game_base":
      return rules.hasGameAccess;
    case "novel_base":
      return rules.hasNovelAccess;
    case "spoiler_content":
      return spoilerSummary.level !== "none";
    case "spoiler_content_full":
      return spoilerSummary.level === "full";
    case "spoiler_content_light":
      return (
        spoilerSummary.level === "light" || spoilerSummary.level === "full"
      );
    case "founders_perks":
      return foundersPerks.some((perk) => perk.isUnlocked);
    default:
      return false;
  }
}

/**
 * Founders Access perks
 */
export type FoundersAccessPerkId =
  | "premium_routes"
  | "ato_quota"
  | "file_uploads"
  | "instruction_limit"
  | "avatar_pairing";

export type FoundersAccessPerkDefinition = {
  id: FoundersAccessPerkId;
  featureKey:
    | "founders_routes"
    | "founders_ato_quota"
    | "founders_file_uploads"
    | "founders_instruction_limit"
    | "founders_avatar_pairing";
  title: string;
  description: string;
};

export type FoundersAccessPerk = FoundersAccessPerkDefinition & {
  isUnlocked: boolean;
};

export const FOUNDERS_ACCESS_PERKS: FoundersAccessPerkDefinition[] = [
  {
    id: "premium_routes",
    featureKey: "founders_routes",
    title: "Premium ATO routes",
    description:
      "Unlock Founders-only ATO routes and premium apps in the store.",
  },
  {
    id: "ato_quota",
    featureKey: "founders_ato_quota",
    title: "Higher ATO creation quota",
    description: "Create up to 10 unofficial ATOs each month.",
  },
  {
    id: "file_uploads",
    featureKey: "founders_file_uploads",
    title: "More file and image uploads",
    description: "Upload up to 10 files per ATO and 10 images per chat.",
  },
  {
    id: "instruction_limit",
    featureKey: "founders_instruction_limit",
    title: "Longer instruction limits",
    description: "Draft up to 999 instruction characters per ATO.",
  },
  {
    id: "avatar_pairing",
    featureKey: "founders_avatar_pairing",
    title: "Avatar pairing at setup",
    description: "Pair custom ATOs with avatars when you create them.",
  },
];

/**
 * Get Founders Access perks for a user
 */
export function getFoundersAccessPerks(
  rules: EntitlementRules
): FoundersAccessPerk[] {
  return FOUNDERS_ACCESS_PERKS.map((perk) => ({
    ...perk,
    isUnlocked: rules.hasFoundersAccess,
  }));
}
