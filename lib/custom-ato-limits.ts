import type { User } from "@/lib/db/schema";

export type SubscriptionTier = "free" | "founders" | "dev";

export const CUSTOM_ATO_LIMITS: Record<
  SubscriptionTier,
  { customAtosPerMonth: number; promptInstructionsLimit: number }
> = {
  free: {
    customAtosPerMonth: 3,
    promptInstructionsLimit: 200,
  },
  founders: {
    customAtosPerMonth: 10,
    promptInstructionsLimit: 999,
  },
  dev: {
    customAtosPerMonth: Number.POSITIVE_INFINITY,
    promptInstructionsLimit: 999,
  },
};

export function getUserCustomAtoLimit(user: User): {
  customAtosPerMonth: number;
  promptInstructionsLimit: number;
} {
  const tier = user.subscriptionTier || "free";
  return CUSTOM_ATO_LIMITS[tier as SubscriptionTier];
}

export function getPromptInstructionsLimit(user: User): number {
  return getUserCustomAtoLimit(user).promptInstructionsLimit;
}

export function getCustomAtosPerMonthLimit(user: User): number {
  return getUserCustomAtoLimit(user).customAtosPerMonth;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
