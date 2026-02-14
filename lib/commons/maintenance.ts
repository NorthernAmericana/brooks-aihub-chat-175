import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  commonsCampfire,
  commonsCampfireSettings,
  commonsComment,
  commonsPost,
} from "@/lib/db/schema";

export type ExpireTempCampfiresSummary = {
  scannedCampfires: number;
  expiredCampfires: number;
};

export type PruneCampfireSummary = {
  campfireId: string;
  windowSize: number;
  deletedPosts: number;
  deletedComments: number;
};

export async function expireTempCampfires(): Promise<ExpireTempCampfiresSummary> {
  const candidates = await db
    .select({ id: commonsCampfire.id })
    .from(commonsCampfire)
    .innerJoin(
      commonsCampfireSettings,
      eq(commonsCampfireSettings.campfireId, commonsCampfire.id)
    )
    .where(
      and(
        eq(commonsCampfireSettings.retentionMode, "timeboxed"),
        eq(commonsCampfire.isActive, true),
        eq(commonsCampfire.isDeleted, false),
        sql`now() > ${commonsCampfire.createdAt} + (${commonsCampfireSettings.expiresInHours} * interval '1 hour')`
      )
    );

  if (!candidates.length) {
    return {
      scannedCampfires: 0,
      expiredCampfires: 0,
    };
  }

  const expiredCampfireIds = candidates.map((campfire) => campfire.id);

  await db.transaction(async (tx) => {
    await tx
      .update(commonsCampfire)
      .set({
        isActive: false,
        isDeleted: true,
        updatedAt: sql`now()`,
      })
      .where(inArray(commonsCampfire.id, expiredCampfireIds));

    const deletedAtColumn = await tx.execute<{ exists: boolean }>(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'campfires'
          AND column_name = 'deleted_at'
      ) AS exists;
    `);

    if (deletedAtColumn[0]?.exists) {
      await tx.execute(sql`
        UPDATE campfires
        SET deleted_at = now()
        WHERE id IN (${sql.join(expiredCampfireIds.map((id) => sql`${id}`), sql`, `)})
          AND deleted_at IS NULL;
      `);
    }
  });

  return {
    scannedCampfires: candidates.length,
    expiredCampfires: candidates.length,
  };
}

export async function pruneCampfireToRollingWindow(
  campfireId: string,
  windowSize: number
): Promise<PruneCampfireSummary> {
  if (windowSize <= 0) {
    return {
      campfireId,
      windowSize,
      deletedPosts: 0,
      deletedComments: 0,
    };
  }

  const stalePosts = await db
    .select({ id: commonsPost.id })
    .from(commonsPost)
    .where(
      and(
        eq(commonsPost.campfireId, campfireId),
        eq(commonsPost.isDeleted, false),
        eq(commonsPost.isVisible, true)
      )
    )
    .orderBy(desc(commonsPost.createdAt), desc(commonsPost.id))
    .offset(windowSize);

  if (!stalePosts.length) {
    return {
      campfireId,
      windowSize,
      deletedPosts: 0,
      deletedComments: 0,
    };
  }

  const stalePostIds = stalePosts.map((post) => post.id);

  const summary = await db.transaction(async (tx) => {
    const deletedCommentsResult = await tx
      .update(commonsComment)
      .set({
        isDeleted: true,
        isVisible: false,
        deletedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(inArray(commonsComment.postId, stalePostIds), eq(commonsComment.isDeleted, false)))
      .returning({ id: commonsComment.id });

    const deletedPostsResult = await tx
      .update(commonsPost)
      .set({
        isDeleted: true,
        isVisible: false,
        deletedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(inArray(commonsPost.id, stalePostIds), eq(commonsPost.isDeleted, false)))
      .returning({ id: commonsPost.id });

    return {
      deletedPosts: deletedPostsResult.length,
      deletedComments: deletedCommentsResult.length,
    };
  });

  return {
    campfireId,
    windowSize,
    deletedPosts: summary.deletedPosts,
    deletedComments: summary.deletedComments,
  };
}
