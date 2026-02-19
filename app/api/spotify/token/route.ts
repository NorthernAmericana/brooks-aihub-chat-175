import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";
import { decryptSpotifyToken, encryptSpotifyToken } from "@/lib/spotify/crypto";
import { refreshSpotifyAccessToken } from "@/lib/spotify/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [account] = await db
    .select()
    .from(spotifyAccounts)
    .where(
      and(
        eq(spotifyAccounts.userId, session.user.id),
        isNull(spotifyAccounts.revokedAt)
      )
    )
    .limit(1);

  if (!account) {
    return NextResponse.json(
      { error: "Spotify not connected" },
      { status: 404 }
    );
  }

  const nowBuffer = Date.now() + 60 * 1000;

  if (
    account.accessToken &&
    account.expiresAt &&
    account.expiresAt.getTime() > nowBuffer
  ) {
    return NextResponse.json({
      accessToken: account.accessToken,
      expiresAt: account.expiresAt.toISOString(),
      scope: account.scope,
    });
  }

  try {
    const refreshToken = decryptSpotifyToken(account.refreshTokenEncrypted);
    const refreshed = await refreshSpotifyAccessToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    const nextEncryptedRefreshToken = refreshed.refresh_token
      ? encryptSpotifyToken(refreshed.refresh_token)
      : account.refreshTokenEncrypted;

    await db
      .update(spotifyAccounts)
      .set({
        refreshTokenEncrypted: nextEncryptedRefreshToken,
        accessToken: refreshed.access_token,
        expiresAt,
        scope: refreshed.scope || account.scope,
        updatedAt: new Date(),
      })
      .where(eq(spotifyAccounts.id, account.id));

    return NextResponse.json({
      accessToken: refreshed.access_token,
      expiresAt: expiresAt.toISOString(),
      scope: refreshed.scope || account.scope,
    });
  } catch (error) {
    console.error("Spotify token refresh failed", error);
    return NextResponse.json(
      { error: "Failed to issue Spotify access token" },
      { status: 502 }
    );
  }
}
