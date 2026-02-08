import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userInstalls } from "@/lib/db/schema";

export async function uninstallApp(userId: string, appId: string) {
  const [record] = await db
    .delete(userInstalls)
    .where(and(eq(userInstalls.userId, userId), eq(userInstalls.appId, appId)))
    .returning();

  return record ?? null;
}
