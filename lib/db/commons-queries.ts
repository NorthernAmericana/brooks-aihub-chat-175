import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { commonsCampfire, commonsComment, commonsPost } from "@/lib/db/schema";

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
  const [campfire] = await db
    .select({ id: commonsCampfire.id })
    .from(commonsCampfire)
    .where(and(eq(commonsCampfire.path, options.campfirePath), PUBLIC_ACTIVE_CAMPFIRE_FILTER))
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

  return post;
}

export async function createComment(options: {
  postId: string;
  authorId: string;
  body: string;
  parentCommentId?: string;
}) {
  const [post] = await db
    .select({ id: commonsPost.id })
    .from(commonsPost)
    .innerJoin(commonsCampfire, eq(commonsCampfire.id, commonsPost.campfireId))
    .where(
      and(
        eq(commonsPost.id, options.postId),
        eq(commonsPost.isDeleted, false),
        eq(commonsPost.isVisible, true),
        PUBLIC_ACTIVE_CAMPFIRE_FILTER
      )
    )
    .limit(1);

  if (!post) {
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

  return comment;
}
