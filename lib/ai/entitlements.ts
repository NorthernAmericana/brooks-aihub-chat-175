import type { UserType } from "@/app/(auth)/auth";

type Entitlements = {
  maxMessagesPerDay: number;
  maxCustomAtosPerMonth: number;
  maxPromptInstructionsLength: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    maxCustomAtosPerMonth: 3,
    maxPromptInstructionsLength: 500,
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 50,
    maxCustomAtosPerMonth: 3,
    maxPromptInstructionsLength: 500,
  },

  /*
   * For users with Founders Edition
   */
  founder: {
    maxMessagesPerDay: 200,
    maxCustomAtosPerMonth: 10,
    maxPromptInstructionsLength: 999,
  },
};
