import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCampfireAccess } from "@/lib/commons/access";
import {
  commonsCampfire,
  commonsCampfireSettings,
  commonsComment,
  commonsPost,
} from "@/lib/db/schema";

const PUBLIC_ACTIVE_CAMPFIRE_FILTER = and(
  eq(commonsCampfire.isDeleted, false),
  eq(commonsCampfire.isPrivate, false),
  eq(commonsCampfire.isActive, true)
);

export async function listCampfires() {
  return db
    .select({
      id: commonsCampfire.id,
      slug: commonsCampfire.slug,
      path: commonsCampfire.path,
      name: commonsCampfire.name,
      description: commonsCampfire.description,
      lastActivityAt: commonsCampfire.lastActivityAt,
      createdAt: commonsCampfire.createdAt,
      isActive: commonsCampfire.isActive,
      isPrivate: commonsCampfire.isPrivate,
    })
    .from(commonsCampfire)
    .where(PUBLIC_ACTIVE_CAMPFIRE_FILTER)
    .orderBy(desc(commonsCampfire.lastActivityAt));
}

export async function listCampfireDirectory(options?: {
  sort?: "activity" | "newest" | "alphabetical";
  query?: string;
}) {
  const sort = options?.sort ?? "activity";
  const query = options?.query?.trim();
  const queryFilter = query
    ? or(
        ilike(commonsCampfire.name, `%${query}%`),
        ilike(commonsCampfire.description, `%${query}%`)
      )
    : undefined;

  let orderByClause;
  if (sort === "alphabetical") {
    orderByClause = asc(commonsCampfire.name);
  } else if (sort === "newest") {
    orderByClause = desc(commonsCampfire.createdAt);
  } else {
    orderByClause = desc(commonsCampfire.lastActivityAt);
  }

  return db
    .select({
      id: commonsCampfire.id,
      slug: commonsCampfire.slug,
      path: commonsCampfire.path,
      name: commonsCampfire.name,
      description: commonsCampfire.description,
      createdAt: commonsCampfire.createdAt,
      lastActivityAt: commonsCampfire.lastActivityAt,
      postCount: count(commonsPost.id),
    })
    .from(commonsCampfire)
    .leftJoin(
      commonsPost,
      and(
        eq(commonsPost.campfireId, commonsCampfire.id),
        eq(commonsPost.isDeleted, false),
        eq(commonsPost.isVisible, true)
      )
    )
    .where(queryFilter ? and(PUBLIC_ACTIVE_CAMPFIRE_FILTER, queryFilter) : PUBLIC_ACTIVE_CAMPFIRE_FILTER)
    .groupBy(
      commonsCampfire.id,
      commonsCampfire.slug,
      commonsCampfire.path,
      commonsCampfire.name,
      commonsCampfire.description,
      commonsCampfire.createdAt,
      commonsCampfire.lastActivityAt
    )
    .orderBy(orderByClause, desc(commonsCampfire.lastActivityAt), asc(commonsCampfire.name));
}

export async function listPostsByCampfirePath(options: {
  campfirePath: string;
  page: number;
  pageSize: number;
  sort: "newest" | "oldest";
}) {
  const [campfire] = await db
    .select({
      id: commonsCampfire.id,
      slug: commonsCampfire.slug,
      path: commonsCampfire.path,
      name: commonsCampfire.name,
      description: commonsCampfire.description,
      createdAt: commonsCampfire.createdAt,
      lastActivityAt: commonsCampfire.lastActivityAt,
    })
    .from(commonsCampfire)
    .where(and(eq(commonsCampfire.path, options.campfirePath), PUBLIC_ACTIVE_CAMPFIRE_FILTER))
    .limit(1);

  if (!campfire) {
    return { campfire: null, posts: [], total: 0 };
  }

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(commonsPost)
    .where(
      and(
        eq(commonsPost.campfireId, campfire.id),
        eq(commonsPost.isDeleted, false),
        eq(commonsPost.isVisible, true)
      )
    );

  const posts = await db
    .select({
      id: commonsPost.id,
      title: commonsPost.title,
      body: commonsPost.body,
      createdAt: commonsPost.createdAt,
      updatedAt: commonsPost.updatedAt,
      authorId: commonsPost.authorId,
    })
    .from(commonsPost)
    .where(
      and(
        eq(commonsPost.campfireId, campfire.id),
        eq(commonsPost.isDeleted, false),
        eq(commonsPost.isVisible, true)
      )
    )
    .orderBy(
      options.sort === "newest"
        ? desc(commonsPost.createdAt)
        : asc(commonsPost.createdAt)
    )
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);

  return { campfire, posts, total };
}

export async function getPostWithComments(postId: string) {
  const [post] = await db
    .select({
      id: commonsPost.id,
      title: commonsPost.title,
      body: commonsPost.body,
      createdAt: commonsPost.createdAt,
      updatedAt: commonsPost.updatedAt,
      campfireId: commonsPost.campfireId,
      authorId: commonsPost.authorId,
    })
    .from(commonsPost)
    .innerJoin(commonsCampfire, eq(commonsCampfire.id, commonsPost.campfireId))
    .where(
      and(
        eq(commonsPost.id, postId),
        eq(commonsPost.isDeleted, false),
        eq(commonsPost.isVisible, true),
        PUBLIC_ACTIVE_CAMPFIRE_FILTER
      )
    )
    .limit(1);

  if (!post) {
    return null;
  }

  const comments = await db
    .select({
      id: commonsComment.id,
      body: commonsComment.body,
      createdAt: commonsComment.createdAt,
      updatedAt: commonsComment.updatedAt,
      parentCommentId: commonsComment.parentCommentId,
      authorId: commonsComment.authorId,
    })
    .from(commonsComment)
    .where(
      and(
        eq(commonsComment.postId, post.id),
        eq(commonsComment.isDeleted, false),
        eq(commonsComment.isVisible, true)
      )
    )
    .orderBy(asc(commonsComment.createdAt));

  return { post, comments };
}

export async function createPost(options: {
  campfirePath: string;
  authorId: string;
  title: string;
  body: string;
}) {
  const access = await getCampfireAccess({
    campfirePath: options.campfirePath,
    viewerId: options.authorId,
  });

  if (!access.canWrite) {
    return null;
  }

  const [campfire] = await db
    .select({ id: commonsCampfire.id })
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
    return null;
  }

  const [post] = await db
    .insert(commonsPost)
    .values({
      campfireId: campfire.id,
      authorId: options.authorId,
      title: options.title,
      body: options.body,
    })
    .returning();

  await db
    .update(commonsCampfire)
    .set({ lastActivityAt: sql`now()` })
    .where(eq(commonsCampfire.id, campfire.id));

  const [campfireSettings] = await db
    .select({
      retentionMode: commonsCampfireSettings.retentionMode,
      rollingWindowSize: commonsCampfireSettings.rollingWindowSize,
    })
    .from(commonsCampfireSettings)
    .where(eq(commonsCampfireSettings.campfireId, campfire.id))
    .limit(1);

  if (
    campfireSettings?.retentionMode === "rolling_window" &&
    campfireSettings.rollingWindowSize
  ) {
    await pruneCampfireToRollingWindow(campfire.id, campfireSettings.rollingWindowSize);
  }

  return post;
}

export async function createComment(options: {
  postId: string;
  authorId: string;
  body: string;
  parentCommentId?: string;
}) {
  const [post] = await db
    .select({
      id: commonsPost.id,
      campfireId: commonsPost.campfireId,
      campfirePath: commonsCampfire.path,
    })
    .from(commonsPost)
    .innerJoin(commonsCampfire, eq(commonsCampfire.id, commonsPost.campfireId))
    .where(
      and(
        eq(commonsPost.id, options.postId),
        eq(commonsPost.isDeleted, false),
        eq(commonsPost.isVisible, true),
        eq(commonsCampfire.isDeleted, false),
        eq(commonsCampfire.isActive, true)
      )
    )
    .limit(1);

  if (!post) {
    return null;
  }

  const access = await getCampfireAccess({
    campfirePath: post.campfirePath,
    viewerId: options.authorId,
  });

  if (!access.canWrite) {
    return null;
  }

  if (options.parentCommentId) {
    const [parent] = await db
      .select({ id: commonsComment.id })
      .from(commonsComment)
      .where(
        and(
          eq(commonsComment.id, options.parentCommentId),
          eq(commonsComment.postId, post.id),
          eq(commonsComment.isDeleted, false),
          eq(commonsComment.isVisible, true),
          isNull(commonsComment.deletedAt)
        )
      )
      .limit(1);

    if (!parent) {
      return null;
    }
  }

  const [comment] = await db
    .insert(commonsComment)
    .values({
      postId: post.id,
      authorId: options.authorId,
      body: options.body,
      parentCommentId: options.parentCommentId,
    })
    .returning();

  await db
    .update(commonsCampfire)
    .set({ lastActivityAt: sql`now()` })
    .where(eq(commonsCampfire.id, post.campfireId));

  const [campfireSettings] = await db
    .select({
      retentionMode: commonsCampfireSettings.retentionMode,
      rollingWindowSize: commonsCampfireSettings.rollingWindowSize,
    })
    .from(commonsCampfireSettings)
    .where(eq(commonsCampfireSettings.campfireId, post.campfireId))
    .limit(1);

  if (
    campfireSettings?.retentionMode === "rolling_window" &&
    campfireSettings.rollingWindowSize
  ) {
    await pruneCampfireToRollingWindow(post.campfireId, campfireSettings.rollingWindowSize);
  }

  return comment;
}

export async function pruneCampfireToRollingWindow(campfireId: string, rollingWindowSize: number) {
  if (rollingWindowSize <= 0) {
    return;
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
    .offset(rollingWindowSize);

  if (!stalePosts.length) {
    return;
  }

  const stalePostIds = stalePosts.map((post) => post.id);

  await db
    .update(commonsComment)
    .set({
      isDeleted: true,
      isVisible: false,
      deletedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(and(inArray(commonsComment.postId, stalePostIds), eq(commonsComment.isDeleted, false)));

  await db
    .update(commonsPost)
    .set({
      isDeleted: true,
      isVisible: false,
      deletedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(and(inArray(commonsPost.id, stalePostIds), eq(commonsPost.isDeleted, false)));
}
