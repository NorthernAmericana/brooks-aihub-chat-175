import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(spotifyAccounts)
    .set({
      revokedAt: new Date(),
      refreshTokenEncrypted: "revoked",
      accessTokenEncrypted: null,
      expiresAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(spotifyAccounts.userId, session.user.id),
        isNull(spotifyAccounts.revokedAt)
      )
    );

  return NextResponse.json({ disconnected: true });
}
