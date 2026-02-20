import { getSpotifyEnv } from "@/lib/spotify/env";
import {
  SpotifyApiError,
  toSpotifyUpstreamUnavailableError,
} from "@/lib/spotify/errors";

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
  let response: Response;

  try {
    response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      cache: "no-store",
    });
  } catch (error) {
    throw toSpotifyUpstreamUnavailableError({
      source: "spotify_accounts",
      operation: "fetch_token",
      error,
    });
  }

  if (!response.ok) {
    const bodyText = await response.text();

    if (response.status >= 500) {
      throw new SpotifyApiError({
        status: 503,
        code: "spotify_request_failed",
        message:
          "Spotify is temporarily unavailable. Please try again in a moment.",
        details: {
          source: "spotify_accounts",
          operation: "fetch_token",
          upstreamStatus: response.status,
          reason: bodyText,
        },
      });
    }

    throw new SpotifyApiError({
      status: response.status,
      code:
        response.status === 401 ? "spotify_unauthorized" : "spotify_request_failed",
      message: "Spotify authentication failed. Please reconnect and try again.",
      details: {
        source: "spotify_accounts",
        operation: "fetch_token",
        upstreamStatus: response.status,
        reason: bodyText,
      },
    });
  }

  try {
    return await response.json();
  } catch (error) {
    throw new SpotifyApiError({
      status: 502,
      code: "spotify_request_failed",
      message:
        "Spotify returned an invalid authentication response. Please try again.",
      details: {
        source: "spotify_accounts",
        operation: "parse_token_response",
        reason: error instanceof Error ? error.message : String(error),
      },
    });
  }
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
