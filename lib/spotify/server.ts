import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";
import { decryptSpotifyToken, encryptSpotifyToken } from "@/lib/spotify/crypto";
import {
  SpotifyApiError,
  toSpotifyUpstreamUnavailableError,
} from "@/lib/spotify/errors";
import {
  type SpotifyTokenResponse,
  refreshSpotifyAccessToken,
} from "@/lib/spotify/oauth";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

export { SpotifyApiError };

function toTokenDecodeError(details?: unknown) {
  return new SpotifyApiError({
    status: 401,
    code: "spotify_unauthorized",
    message:
      "Spotify session is invalid. Please reconnect your Spotify account.",
    details,
  });
}

async function getActiveSpotifyAccount(userId: string) {
  let account;

  try {
    [account] = await db
      .select()
      .from(spotifyAccounts)
      .where(
        and(
          eq(spotifyAccounts.userId, userId),
          isNull(spotifyAccounts.revokedAt),
        ),
      )
      .limit(1);
  } catch (error) {
    throw new SpotifyApiError({
      status: 500,
      code: "spotify_request_failed",
      message: "Failed to load Spotify account state.",
      details: {
        source: "spotify_accounts_lookup",
        operation: "select_active_account",
        userIdLength: userId.length,
        reason: error instanceof Error ? error.message : String(error),
      },
    });
  }

  return account ?? null;
}

function refreshAccessTokenWithLock(userId: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);

    const [lockedAccount] = await tx
      .select()
      .from(spotifyAccounts)
      .where(
        and(
          eq(spotifyAccounts.userId, userId),
          isNull(spotifyAccounts.revokedAt),
        ),
      )
      .limit(1);

    if (!lockedAccount) {
      throw new SpotifyApiError({
        status: 404,
        code: "spotify_unauthorized",
        message: "Spotify account is not connected.",
      });
    }

    if (
      lockedAccount.accessTokenEncrypted &&
      lockedAccount.expiresAt &&
      lockedAccount.expiresAt.getTime() >
        Date.now() + ACCESS_TOKEN_EXPIRY_BUFFER_MS
    ) {
      try {
        return decryptSpotifyToken(lockedAccount.accessTokenEncrypted);
      } catch {
        throw toTokenDecodeError({ source: "access_token" });
      }
    }

    let refreshToken: string;

    try {
      refreshToken = decryptSpotifyToken(lockedAccount.refreshTokenEncrypted);
    } catch {
      throw toTokenDecodeError({ source: "refresh_token" });
    }
    let refreshed: SpotifyTokenResponse;

    try {
      refreshed = await refreshSpotifyAccessToken(refreshToken);
    } catch (error) {
      if (error instanceof SpotifyApiError) {
        throw error;
      }

      throw toSpotifyUpstreamUnavailableError({
        source: "spotify_accounts",
        operation: "refresh_access_token",
        error,
      });
    }

    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    await tx
      .update(spotifyAccounts)
      .set({
        refreshTokenEncrypted: refreshed.refresh_token
          ? encryptSpotifyToken(refreshed.refresh_token)
          : lockedAccount.refreshTokenEncrypted,
        accessTokenEncrypted: encryptSpotifyToken(refreshed.access_token),
        expiresAt,
        scope: refreshed.scope || lockedAccount.scope,
        updatedAt: new Date(),
      })
      .where(eq(spotifyAccounts.id, lockedAccount.id));

    return refreshed.access_token;
  });
}

export async function getAccessTokenForUser(
  userId: string,
  forceRefresh = false,
) {
  const account = await getActiveSpotifyAccount(userId);

  if (!account) {
    throw new SpotifyApiError({
      status: 404,
      code: "spotify_unauthorized",
      message: "Spotify account is not connected.",
    });
  }

  if (
    !forceRefresh &&
    account.accessTokenEncrypted &&
    account.expiresAt &&
    account.expiresAt.getTime() > Date.now() + ACCESS_TOKEN_EXPIRY_BUFFER_MS
  ) {
    try {
      return decryptSpotifyToken(account.accessTokenEncrypted);
    } catch {
      throw toTokenDecodeError({ source: "access_token" });
    }
  }

  return refreshAccessTokenWithLock(userId);
}

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeSpotifyError(status: number, payload: unknown) {
  const parsedPayload =
    typeof payload === "object" && payload !== null
      ? (payload as { error?: { reason?: string; message?: string } })
      : null;
  const reason = parsedPayload?.error?.reason;
  const message = parsedPayload?.error?.message ?? "Spotify request failed.";

  if (status === 403) {
    if (
      reason === "PREMIUM_REQUIRED" ||
      (typeof message === "string" &&
        (message.includes("Premium") || message.includes("restricted")))
    ) {
      return new SpotifyApiError({
        status,
        code: "spotify_premium_required",
        message:
          "Spotify Premium is required, or Spotify Connect is restricted for this action.",
        details: payload,
      });
    }

    return new SpotifyApiError({
      status,
      code: "spotify_forbidden",
      message: "Spotify denied this action.",
      details: payload,
    });
  }

  if (status === 404) {
    return new SpotifyApiError({
      status,
      code: "spotify_no_active_device",
      message:
        "No active Spotify device found. Start playback on a device and try again.",
      details: payload,
    });
  }

  return new SpotifyApiError({
    status: status >= 500 ? 503 : status,
    code:
      status === 401 ? "spotify_unauthorized" : "spotify_request_failed",
    message:
      status >= 500
        ? "Spotify is temporarily unavailable. Please try again in a moment."
        : message,
    details: payload,
  });
}

export async function spotifyFetch(
  userId: string,
  path: string,
  init: RequestInit = {},
) {
  const requestUrl = path.startsWith("http")
    ? (() => {
        const url = new URL(path);

        if (url.hostname !== "api.spotify.com") {
          throw new SpotifyApiError({
            status: 400,
            code: "spotify_request_failed",
            message: `spotifyFetch: unexpected host ${url.hostname}`,
          });
        }

        return path;
      })()
    : `${SPOTIFY_API_BASE}${path}`;

  const run = async (forceRefresh = false) => {
    const accessToken = await getAccessTokenForUser(userId, forceRefresh);

    try {
      return await fetch(requestUrl, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
    } catch (error) {
      throw toSpotifyUpstreamUnavailableError({
        source: "spotify_api",
        operation: "fetch",
        error,
      });
    }
  };

  let response: Response;

  try {
    response = await run(false);
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      throw error;
    }

    throw toSpotifyUpstreamUnavailableError({
      source: "spotify_api",
      operation: "initial_fetch",
      error,
    });
  }

  if (response.status === 401) {
    try {
      response = await run(true);
    } catch (error) {
      throw toSpotifyUpstreamUnavailableError({
        source: "spotify_api",
        operation: "refresh_fetch",
        error,
        message:
          "Spotify is temporarily unavailable while refreshing your session. Please try again.",
      });
    }
  }

  if (!response.ok) {
    throw normalizeSpotifyError(response.status, await parseJsonSafe(response));
  }

  return response;
}

function parseSpotifyBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  return parseJsonSafe(response);
}

export async function getCurrentUserProfile(userId: string) {
  return parseSpotifyBody(await spotifyFetch(userId, "/me"));
}

export async function getPlayerState(userId: string) {
  return parseSpotifyBody(await spotifyFetch(userId, "/me/player"));
}

export async function play(userId: string, body?: unknown) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player/play", {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

export async function pause(userId: string) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player/pause", { method: "PUT" }),
  );
}

export async function nextTrack(userId: string) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player/next", { method: "POST" }),
  );
}

export async function previousTrack(userId: string) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player/previous", { method: "POST" }),
  );
}

export async function seekToPosition(userId: string, positionMs: number) {
  return parseSpotifyBody(
    await spotifyFetch(userId, `/me/player/seek?position_ms=${positionMs}`, {
      method: "PUT",
    }),
  );
}

export async function transferPlayback(
  userId: string,
  body: { device_ids: string[]; play?: boolean },
) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  );
}

export async function getRecommendations(
  userId: string,
  query: URLSearchParams,
) {
  return parseSpotifyBody(
    await spotifyFetch(userId, `/recommendations?${query.toString()}`),
  );
}

export async function addToQueue(
  userId: string,
  uri: string,
  deviceId?: string,
) {
  const params = new URLSearchParams({ uri });

  if (deviceId) {
    params.set("device_id", deviceId);
  }

  return parseSpotifyBody(
    await spotifyFetch(userId, `/me/player/queue?${params.toString()}`, {
      method: "POST",
    }),
  );
}
