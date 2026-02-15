import { createHash } from "node:crypto";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getCampfireAccess } from "@/lib/commons/access";
import {
  DM_RECIPIENT_LIMIT_DEFAULT,
  DM_RECIPIENT_LIMIT_FOUNDER,
} from "@/lib/commons/constants";
import { pruneCampfireToRollingWindow } from "@/lib/commons/maintenance";
import { db } from "@/lib/db";
import {
  commonsCampfire,
  commonsCampfireMembers,
  commonsCampfireSettings,
  commonsComment,
  commonsPost,
  user,
} from "@/lib/db/schema";

const PUBLIC_ACTIVE_CAMPFIRE_FILTER = and(
  eq(commonsCampfire.isDeleted, false),
  eq(commonsCampfire.isPrivate, false),
  eq(commonsCampfire.isActive, true)
);

export function listCampfires() {
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

export function listCampfireDirectory(options?: {
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

  const orderByClause =
    sort === "alphabetical"
      ? asc(commonsCampfire.name)
      : sort === "newest"
        ? desc(commonsCampfire.createdAt)
        : desc(commonsCampfire.lastActivityAt);

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
    .where(
      queryFilter
        ? and(PUBLIC_ACTIVE_CAMPFIRE_FILTER, queryFilter)
        : PUBLIC_ACTIVE_CAMPFIRE_FILTER
    )
    .groupBy(
      commonsCampfire.id,
      commonsCampfire.slug,
      commonsCampfire.path,
      commonsCampfire.name,
      commonsCampfire.description,
      commonsCampfire.createdAt,
      commonsCampfire.lastActivityAt
    )
    .orderBy(
      orderByClause,
      desc(commonsCampfire.lastActivityAt),
      asc(commonsCampfire.name)
    );
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
    .where(
      and(
        eq(commonsCampfire.path, options.campfirePath),
        PUBLIC_ACTIVE_CAMPFIRE_FILTER
      )
    )
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
    await pruneCampfireToRollingWindow(
      campfire.id,
      campfireSettings.rollingWindowSize
    );
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
    await pruneCampfireToRollingWindow(
      post.campfireId,
      campfireSettings.rollingWindowSize
    );
  }

  return comment;
}

function slugifyCampfireValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function createCampfire(options: {
  creatorId: string;
  mode: "community" | "dm";
  name?: string;
  description?: string;
  campfirePath?: string;
  recipientEmail?: string;
  recipientEmails?: string[];
}) {
  if (options.mode === "dm") {
    const [creator] = await db
      .select({ id: user.id, foundersAccess: user.foundersAccess })
      .from(user)
      .where(eq(user.id, options.creatorId))
      .limit(1);

    if (!creator) {
      return { error: "Creator account not found." as const };
    }

    const recipientEmails = Array.from(
      new Set(
        [
          ...(options.recipientEmails ?? []),
          ...(options.recipientEmail ? [options.recipientEmail] : []),
        ]
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email.length > 0)
      )
    );

    if (!recipientEmails.length) {
      return { error: "At least one recipient email is required." as const };
    }

    const recipientLimit = creator.foundersAccess
      ? DM_RECIPIENT_LIMIT_FOUNDER
      : DM_RECIPIENT_LIMIT_DEFAULT;

    if (recipientEmails.length > recipientLimit) {
      return {
        error: creator.foundersAccess
          ? "Founders can include up to 12 recipient emails in a direct campfire."
          : "Direct campfires are limited to 4 recipient emails. Upgrade to founders for up to 12.",
      } as const;
    }

    const recipients = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(
        or(
          ...recipientEmails.map(
            (email) => sql`lower(${user.email}) = ${email}`
          )
        )
      );

    if (recipients.length !== recipientEmails.length) {
      const matchedEmails = new Set(
        recipients.map((recipient) => recipient.email.toLowerCase())
      );
      const missingEmails = recipientEmails.filter(
        (email) => !matchedEmails.has(email)
      );

      return {
        error:
          missingEmails.length === 1
            ? `Recipient account not found: ${missingEmails[0]}.`
            : `Recipient accounts not found: ${missingEmails.join(", ")}.`,
      } as const;
    }

    const recipientIds = recipients.map((recipient) => recipient.id);
    if (recipientIds.includes(options.creatorId)) {
      return { error: "You cannot DM yourself." as const };
    }

    const participants = [options.creatorId, ...recipientIds].sort();
    const participantsHash = createHash("sha256")
      .update(participants.join("|"))
      .digest("hex")
      .slice(0, 32);
    const dmPath = `dm/${participantsHash}`;
    const dmSlug = `dm-${participantsHash.slice(0, 24)}`;
    const recipientLabel = recipients
      .map((recipient) => recipient.email)
      .join(", ");

    const [existingDm] = await db
      .select({ id: commonsCampfire.id, path: commonsCampfire.path })
      .from(commonsCampfire)
      .where(
        and(
          eq(commonsCampfire.path, dmPath),
          eq(commonsCampfire.isDeleted, false),
          eq(commonsCampfire.isActive, true)
        )
      )
      .limit(1);

    if (existingDm) {
      return {
        campfire: existingDm,
        isExisting: true,
      };
    }

    let campfire: { id: string; path: string };

    try {
      campfire = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(commonsCampfire)
          .values({
            slug: dmSlug,
            path: dmPath,
            name:
              recipients.length === 1
                ? `DM: ${recipients[0].email}`
                : `Group DM (${recipients.length + 1} members)`,
            description: `Direct campfire between you and ${recipientLabel}.`,
            createdById: options.creatorId,
            isPrivate: true,
          })
          .returning({ id: commonsCampfire.id, path: commonsCampfire.path });

        await tx.insert(commonsCampfireSettings).values({
          campfireId: row.id,
          retentionMode: "permanent",
        });

        await tx.insert(commonsCampfireMembers).values([
          {
            campfireId: row.id,
            userId: options.creatorId,
            role: "host",
          },
          ...recipients.map((recipient) => ({
            campfireId: row.id,
            userId: recipient.id,
            role: "member" as const,
            invitedByUserId: options.creatorId,
          })),
        ]);

        return row;
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const [concurrentDm] = await db
        .select({ id: commonsCampfire.id, path: commonsCampfire.path })
        .from(commonsCampfire)
        .where(
          and(
            eq(commonsCampfire.path, dmPath),
            eq(commonsCampfire.isDeleted, false),
            eq(commonsCampfire.isActive, true)
          )
        )
        .limit(1);

      if (!concurrentDm) {
        throw error;
      }

      return {
        campfire: concurrentDm,
        isExisting: true,
      };
    }

    return {
      campfire,
      isExisting: false,
    };
  }

  const name = options.name?.trim();
  const campfirePath = options.campfirePath?.trim().toLowerCase();

  if (!name || !campfirePath) {
    return { error: "Name and path are required." as const };
  }

  const pathSegments = campfirePath.split("/");
  const slugBase = slugifyCampfireValue(pathSegments.join("-") || name);
  const slug = slugBase || `campfire-${crypto.randomUUID().slice(0, 8)}`;

  const [existingPathCampfire] = await db
    .select({ id: commonsCampfire.id, path: commonsCampfire.path })
    .from(commonsCampfire)
    .where(eq(commonsCampfire.path, campfirePath))
    .limit(1);

  if (existingPathCampfire) {
    return { error: "That campfire path is already in use." as const };
  }

  const [existingSlugCampfire] = await db
    .select({ id: commonsCampfire.id })
    .from(commonsCampfire)
    .where(eq(commonsCampfire.slug, slug))
    .limit(1);

  const finalSlug = existingSlugCampfire
    ? `${slug.slice(0, 47)}-${crypto.randomUUID().slice(0, 8)}`
    : slug;

  let campfire: { id: string; path: string };

  try {
    campfire = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(commonsCampfire)
        .values({
          slug: finalSlug,
          path: campfirePath,
          name,
          description: options.description?.trim() ?? "",
          createdById: options.creatorId,
          isPrivate: false,
        })
        .returning({ id: commonsCampfire.id, path: commonsCampfire.path });

      await tx.insert(commonsCampfireSettings).values({
        campfireId: row.id,
        retentionMode: "permanent",
      });

      return row;
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const [concurrentCampfire] = await db
      .select({ id: commonsCampfire.id, path: commonsCampfire.path })
      .from(commonsCampfire)
      .where(eq(commonsCampfire.path, campfirePath))
      .limit(1);

    if (concurrentCampfire) {
      return { error: "That campfire path is already in use." as const };
    }

    throw error;
  }

  return {
    campfire,
    isExisting: false,
  };
}

type DmLobbyCampfire = {
  id: string;
  name: string;
  path: string;
  invitedCount: number;
  invitedLimit: number;
  accessLabel: "Founder’s Access" | "Free Access";
  lastActivityAt: Date;
};

export async function listPrivateDmCampfiresForMember(
  viewerId: string
): Promise<DmLobbyCampfire[]> {
  const viewerMember = alias(commonsCampfireMembers, "viewer_member");
  const allMembers = alias(commonsCampfireMembers, "all_members");
  const hostMember = alias(commonsCampfireMembers, "host_member");
  const hostUser = alias(user, "host_user");

  const rows = await db
    .select({
      id: commonsCampfire.id,
      name: commonsCampfire.name,
      path: commonsCampfire.path,
      lastActivityAt: commonsCampfire.lastActivityAt,
      memberCount: count(allMembers.id),
      hostFoundersAccess: hostUser.foundersAccess,
    })
    .from(commonsCampfire)
    .innerJoin(
      viewerMember,
      and(
        eq(viewerMember.campfireId, commonsCampfire.id),
        eq(viewerMember.userId, viewerId)
      )
    )
    .leftJoin(allMembers, eq(allMembers.campfireId, commonsCampfire.id))
    .leftJoin(
      hostMember,
      and(
        eq(hostMember.campfireId, commonsCampfire.id),
        eq(hostMember.role, "host")
      )
    )
    .leftJoin(hostUser, eq(hostUser.id, hostMember.userId))
    .where(
      and(
        eq(commonsCampfire.isPrivate, true),
        eq(commonsCampfire.isActive, true),
        eq(commonsCampfire.isDeleted, false),
        ilike(commonsCampfire.path, "dm/%")
      )
    )
    .groupBy(
      commonsCampfire.id,
      commonsCampfire.name,
      commonsCampfire.path,
      commonsCampfire.lastActivityAt,
      hostUser.foundersAccess
    )
    .orderBy(desc(commonsCampfire.lastActivityAt));

  return rows.map((row) => {
    const invitedCount = Math.max(0, Number(row.memberCount) - 1);
    const hasFounderAccess = Boolean(row.hostFoundersAccess);
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      invitedCount,
      invitedLimit: hasFounderAccess
        ? DM_RECIPIENT_LIMIT_FOUNDER
        : DM_RECIPIENT_LIMIT_DEFAULT,
      accessLabel: hasFounderAccess ? "Founder’s Access" : "Free Access",
      lastActivityAt: row.lastActivityAt,
    };
  });
}

export async function getPrivateDmCampfireForViewer(options: {
  viewerId: string;
  dmId: string;
}) {
  const dmPath = `dm/${options.dmId}`;

  const [campfire] = await db
    .select({
      id: commonsCampfire.id,
      name: commonsCampfire.name,
      path: commonsCampfire.path,
      lastActivityAt: commonsCampfire.lastActivityAt,
    })
    .from(commonsCampfire)
    .where(
      and(
        eq(commonsCampfire.path, dmPath),
        eq(commonsCampfire.isPrivate, true),
        eq(commonsCampfire.isActive, true),
        eq(commonsCampfire.isDeleted, false)
      )
    )
    .limit(1);

  if (!campfire) {
    return {
      campfire: null,
      isMember: false,
      members: [],
      posts: [],
    };
  }

  const [membership] = await db
    .select({ id: commonsCampfireMembers.id })
    .from(commonsCampfireMembers)
    .where(
      and(
        eq(commonsCampfireMembers.campfireId, campfire.id),
        eq(commonsCampfireMembers.userId, options.viewerId)
      )
    )
    .limit(1);

  if (!membership) {
    return {
      campfire,
      isMember: false,
      members: [],
      posts: [],
    };
  }

  const members = await db
    .select({
      id: user.id,
      email: user.email,
      role: commonsCampfireMembers.role,
    })
    .from(commonsCampfireMembers)
    .innerJoin(user, eq(user.id, commonsCampfireMembers.userId))
    .where(eq(commonsCampfireMembers.campfireId, campfire.id))
    .orderBy(asc(commonsCampfireMembers.createdAt));

  const posts = await db
    .select({
      id: commonsPost.id,
      title: commonsPost.title,
      body: commonsPost.body,
      createdAt: commonsPost.createdAt,
      authorEmail: user.email,
    })
    .from(commonsPost)
    .innerJoin(user, eq(user.id, commonsPost.authorId))
    .where(
      and(
        eq(commonsPost.campfireId, campfire.id),
        eq(commonsPost.isDeleted, false),
        eq(commonsPost.isVisible, true)
      )
    )
    .orderBy(desc(commonsPost.createdAt))
    .limit(30);

  return {
    campfire,
    isMember: true,
    members,
    posts,
  };
}
