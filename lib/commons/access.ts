import { and, count, eq } from "drizzle-orm";
import {
  PRIVATE_MEMBER_LIMIT_DEFAULT,
  PRIVATE_MEMBER_LIMIT_FOUNDER_HOST,
} from "@/lib/commons/constants";
import { db } from "@/lib/db";
import { commonsCampfire, commonsCampfireMembers, user } from "@/lib/db/schema";

export type CampfireAccess = {
  canRead: boolean;
  canWrite: boolean;
  isHost: boolean;
  memberCount: number;
  memberLimit: number | null;
};

export async function getCampfireAccess(options: {
  campfirePath: string;
  viewerId?: string | null;
}): Promise<CampfireAccess> {
  const [campfire] = await db
    .select({
      id: commonsCampfire.id,
      isPrivate: commonsCampfire.isPrivate,
    })
    .from(commonsCampfire)
    .where(
      and(
        eq(commonsCampfire.path, options.campfirePath),
        eq(commonsCampfire.isDeleted, false),
        eq(commonsCampfire.isActive, true)
      )
    )
    .limit(1);

  if (!campfire) {
    return {
      canRead: false,
      canWrite: false,
      isHost: false,
      memberCount: 0,
      memberLimit: null,
    };
  }

  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(commonsCampfireMembers)
    .where(eq(commonsCampfireMembers.campfireId, campfire.id));

  if (!options.viewerId) {
    return {
      canRead: !campfire.isPrivate,
      canWrite: false,
      isHost: false,
      memberCount: Number(memberCount),
      memberLimit: campfire.isPrivate ? PRIVATE_MEMBER_LIMIT_DEFAULT : null,
    };
  }

  const [membership] = await db
    .select({ role: commonsCampfireMembers.role })
    .from(commonsCampfireMembers)
    .where(
      and(
        eq(commonsCampfireMembers.campfireId, campfire.id),
        eq(commonsCampfireMembers.userId, options.viewerId)
      )
    )
    .limit(1);

  const [viewer] = await db
    .select({ foundersAccess: user.foundersAccess })
    .from(user)
    .where(eq(user.id, options.viewerId))
    .limit(1);

  const isHost = membership?.role === "host";
  const isFounderHost =
    campfire.isPrivate && isHost && Boolean(viewer?.foundersAccess);

  return {
    canRead: campfire.isPrivate ? Boolean(membership) : true,
    canWrite: campfire.isPrivate ? Boolean(membership) : true,
    isHost,
    memberCount: Number(memberCount),
    memberLimit: campfire.isPrivate
      ? isFounderHost
        ? PRIVATE_MEMBER_LIMIT_FOUNDER_HOST
        : PRIVATE_MEMBER_LIMIT_DEFAULT
      : null,
  };
}
