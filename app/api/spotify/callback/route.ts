import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";
import { encryptSpotifyToken } from "@/lib/spotify/crypto";
import { getSpotifyEnv } from "@/lib/spotify/env";
import { exchangeSpotifyAuthCode } from "@/lib/spotify/oauth";

const OAUTH_COOKIE_NAME = "spotify_oauth_state";

function buildRedirect(path: string, status = 302) {
  const { appOrigin } = getSpotifyEnv();
  return NextResponse.redirect(new URL(path, appOrigin), status);
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appOrigin } = getSpotifyEnv();
  const secureCookie = appOrigin.startsWith("https://");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const incomingState = url.searchParams.get("state");
  const oauthCookie = request.cookies.get(OAUTH_COOKIE_NAME)?.value;

  if (!code || !incomingState || !oauthCookie) {
    return buildRedirect("/spotify-app?connected=0&error=missing_oauth_data");
  }

  let cookiePayload: { state: string; codeVerifier: string; userId: string };

  try {
    cookiePayload = JSON.parse(oauthCookie);
  } catch {
    return buildRedirect("/spotify-app?connected=0&error=invalid_oauth_cookie");
  }

  if (
    cookiePayload.state !== incomingState ||
    cookiePayload.userId !== session.user.id
  ) {
    return buildRedirect("/spotify-app?connected=0&error=state_mismatch");
  }

  try {
    const tokenResponse = await exchangeSpotifyAuthCode({
      code,
      codeVerifier: cookiePayload.codeVerifier,
    });

    const refreshToken = tokenResponse.refresh_token;

    if (!refreshToken) {
      throw new Error("Spotify did not return refresh_token");
    }

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    await db.transaction(async (tx) => {
      await tx
        .update(spotifyAccounts)
        .set({
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(spotifyAccounts.userId, session.user.id),
            isNull(spotifyAccounts.revokedAt)
          )
        );

      await tx.insert(spotifyAccounts).values({
        userId: session.user.id,
        refreshTokenEncrypted: encryptSpotifyToken(refreshToken),
        accessToken: tokenResponse.access_token,
        expiresAt,
        scope: tokenResponse.scope,
      });
    });

    const response = buildRedirect("/spotify-app?connected=1");
    response.cookies.set(OAUTH_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie,
    });

    return response;
  } catch (error) {
    console.error("Spotify callback error", error);
    const response = buildRedirect(
      "/spotify-app?connected=0&error=token_exchange"
    );
    response.cookies.set(OAUTH_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie,
    });
    return response;
  }
}
