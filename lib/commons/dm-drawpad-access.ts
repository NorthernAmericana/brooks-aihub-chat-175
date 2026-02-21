import { and, eq } from "drizzle-orm";
import { getCampfireAccess } from "@/lib/commons/access";
import {
  resolveCommonsDmDrawpadAccessWithDeps,
  type CommonsDmAccessResult,
} from "@/lib/commons/dm-drawpad-access-core";
import { db } from "@/lib/db";
import { commonsCampfire, commonsCampfireMembers } from "@/lib/db/schema";

export type { CommonsDmAccessResult };

export async function resolveCommonsDmDrawpadAccess(options: {
  dmId: string;
  userId: string;
}): Promise<CommonsDmAccessResult> {
  return resolveCommonsDmDrawpadAccessWithDeps(options, {
    async findCampfireByPath(campfirePath) {
      const [campfire] = await db
        .select({
          id: commonsCampfire.id,
          isActive: commonsCampfire.isActive,
          isDeleted: commonsCampfire.isDeleted,
        })
        .from(commonsCampfire)
        .where(eq(commonsCampfire.path, campfirePath))
        .limit(1);

      return campfire ?? null;
    },
    async getAccess(accessOptions) {
      return getCampfireAccess(accessOptions);
    },
    async hasMembership({ campfireId, userId }) {
      const [membership] = await db
        .select({ userId: commonsCampfireMembers.userId })
        .from(commonsCampfireMembers)
        .where(
          and(
            eq(commonsCampfireMembers.campfireId, campfireId),
            eq(commonsCampfireMembers.userId, userId)
          )
        )
        .limit(1);

      return Boolean(membership);
    },
  });
}
