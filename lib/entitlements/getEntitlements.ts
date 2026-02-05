import "server-only";

import { getUserById, getUserEntitlements } from "@/lib/db/queries";

export type UserEntitlements = {
  foundersAccess: boolean;
  products: string[];
};

export async function getEntitlements(userId: string): Promise<UserEntitlements> {
  const [user, entitlements] = await Promise.all([
    getUserById({ id: userId }),
    getUserEntitlements({ userId }),
  ]);

  if (!user) {
    return { foundersAccess: false, products: [] };
  }

  return {
    foundersAccess: user.foundersAccess || false,
    products: entitlements.map((entitlement) => entitlement.productId),
  };
}
