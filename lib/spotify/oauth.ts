import { getSpotifyEnv } from "@/lib/spotify/env";

export const SPOTIFY_REQUIRED_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
] as const;

export type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

async function fetchSpotifyToken(
  params: URLSearchParams
): Promise<SpotifyTokenResponse> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    cache: "no-store",
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Spotify token exchange failed (${response.status}): ${bodyText}`
    );
  }

  return response.json();
}

export function exchangeSpotifyAuthCode(input: {
  code: string;
  codeVerifier: string;
}) {
  const { spotifyClientId, spotifyClientSecret, spotifyRedirectUri } =
    getSpotifyEnv();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: spotifyRedirectUri,
    client_id: spotifyClientId,
    code_verifier: input.codeVerifier,
  });

  if (spotifyClientSecret) {
    params.set("client_secret", spotifyClientSecret);
  }

  return fetchSpotifyToken(params);
}

export function refreshSpotifyAccessToken(refreshToken: string) {
  const { spotifyClientId, spotifyClientSecret } = getSpotifyEnv();

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: spotifyClientId,
  });

  if (spotifyClientSecret) {
    params.set("client_secret", spotifyClientSecret);
  }

  return fetchSpotifyToken(params);
}
