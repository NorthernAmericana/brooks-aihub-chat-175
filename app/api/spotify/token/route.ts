import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";
import { decryptSpotifyToken, encryptSpotifyToken } from "@/lib/spotify/crypto";
import { refreshSpotifyAccessToken } from "@/lib/spotify/oauth";

export const dynamic = "force-dynamic";

const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

async function getActiveSpotifyAccount(userId: string) {
  const [account] = await db
    .select()
    .from(spotifyAccounts)
    .where(
      and(eq(spotifyAccounts.userId, userId), isNull(spotifyAccounts.revokedAt))
    )
    .limit(1);

  return account ?? null;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getActiveSpotifyAccount(session.user.id);

  if (!account) {
    return NextResponse.json(
      { error: "Spotify not connected" },
      { status: 404 }
    );
  }

  const nowBuffer = Date.now() + ACCESS_TOKEN_EXPIRY_BUFFER_MS;

  if (
    account.accessTokenEncrypted &&
    account.expiresAt &&
    account.expiresAt.getTime() > nowBuffer
  ) {
    return NextResponse.json({
      accessToken: decryptSpotifyToken(account.accessTokenEncrypted),
      expiresAt: account.expiresAt.toISOString(),
      scope: account.scope,
    });
  }

  try {
    const tokenPayload = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${session.user.id}))`
      );

      const [lockedAccount] = await tx
        .select()
        .from(spotifyAccounts)
        .where(
          and(
            eq(spotifyAccounts.userId, session.user.id),
            isNull(spotifyAccounts.revokedAt)
          )
        )
        .limit(1);

      if (!lockedAccount) {
        throw new Error("Spotify account not found during refresh");
      }

      if (
        lockedAccount.accessTokenEncrypted &&
        lockedAccount.expiresAt &&
        lockedAccount.expiresAt.getTime() >
          Date.now() + ACCESS_TOKEN_EXPIRY_BUFFER_MS
      ) {
        return {
          accessToken: decryptSpotifyToken(lockedAccount.accessTokenEncrypted),
          expiresAt: lockedAccount.expiresAt,
          scope: lockedAccount.scope,
        };
      }

      const refreshToken = decryptSpotifyToken(
        lockedAccount.refreshTokenEncrypted
      );
      const refreshed = await refreshSpotifyAccessToken(refreshToken);
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

      const nextEncryptedRefreshToken = refreshed.refresh_token
        ? encryptSpotifyToken(refreshed.refresh_token)
        : lockedAccount.refreshTokenEncrypted;

      const encryptedAccessToken = encryptSpotifyToken(refreshed.access_token);
      const nextScope = refreshed.scope || lockedAccount.scope;

      await tx
        .update(spotifyAccounts)
        .set({
          refreshTokenEncrypted: nextEncryptedRefreshToken,
          accessTokenEncrypted: encryptedAccessToken,
          expiresAt,
          scope: nextScope,
          updatedAt: new Date(),
        })
        .where(eq(spotifyAccounts.id, lockedAccount.id));

      return {
        accessToken: refreshed.access_token,
        expiresAt,
        scope: nextScope,
      };
    });

    return NextResponse.json({
      accessToken: tokenPayload.accessToken,
      expiresAt: tokenPayload.expiresAt.toISOString(),
      scope: tokenPayload.scope,
    });
  } catch (error) {
    console.error("Spotify token refresh failed", error);
    return NextResponse.json(
      { error: "Failed to issue Spotify access token" },
      { status: 502 }
    );
  }
}
