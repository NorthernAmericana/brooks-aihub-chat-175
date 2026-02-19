import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSpotifyEnv } from "@/lib/spotify/env";
import { SPOTIFY_REQUIRED_SCOPES } from "@/lib/spotify/oauth";

const OAUTH_COOKIE_NAME = "spotify_oauth_state";

function toBase64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spotifyClientId, spotifyRedirectUri, appOrigin } = getSpotifyEnv();

  const state = toBase64Url(randomBytes(32));
  const codeVerifier = toBase64Url(randomBytes(64));
  const codeChallenge = toBase64Url(
    createHash("sha256").update(codeVerifier).digest()
  );

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", spotifyClientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", spotifyRedirectUri);
  authUrl.searchParams.set("scope", SPOTIFY_REQUIRED_SCOPES.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);

  const response = NextResponse.redirect(authUrl);
  const secureCookie = appOrigin.startsWith("https://");
  response.cookies.set({
    name: OAUTH_COOKIE_NAME,
    value: JSON.stringify({
      state,
      codeVerifier,
      userId: session.user.id,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
