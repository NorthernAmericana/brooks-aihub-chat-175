import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userInstalls } from "@/lib/db/schema";

export async function installApp(userId: string, appId: string) {
  const [existing] = await db
    .select()
    .from(userInstalls)
    .where(and(eq(userInstalls.userId, userId), eq(userInstalls.appId, appId)))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [record] = await db
    .insert(userInstalls)
    .values({ userId, appId })
    .returning();

  return record ?? null;
}
