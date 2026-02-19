import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";

export async function disconnectSpotify(userId: string) {
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
        eq(spotifyAccounts.userId, userId),
        isNull(spotifyAccounts.revokedAt),
      ),
    );
}
