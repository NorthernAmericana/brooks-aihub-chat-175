import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";
import { decryptSpotifyToken, encryptSpotifyToken } from "@/lib/spotify/crypto";
import { type SpotifyTokenResponse, refreshSpotifyAccessToken } from "@/lib/spotify/oauth";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

export type SpotifyUiErrorCode =
  | "spotify_unauthorized"
  | "spotify_premium_required"
  | "spotify_no_active_device"
  | "spotify_forbidden"
  | "spotify_request_failed";

export class SpotifyApiError extends Error {
  readonly status: number;
  readonly code: SpotifyUiErrorCode;
  readonly details?: unknown;

  constructor(input: {
    message: string;
    status: number;
    code: SpotifyUiErrorCode;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "SpotifyApiError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
  }

  toResponseBody() {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        details: this.details,
      },
    };
  }
}

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
  const [account] = await db
    .select()
    .from(spotifyAccounts)
    .where(
      and(eq(spotifyAccounts.userId, userId), isNull(spotifyAccounts.revokedAt))
    )
    .limit(1);

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
          isNull(spotifyAccounts.revokedAt)
        )
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
      throw toTokenDecodeError({
        source: "refresh_request",
        message: error instanceof Error ? error.message : String(error),
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
  forceRefresh = false
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
    status,
    code: status === 401 ? "spotify_unauthorized" : "spotify_request_failed",
    message,
    details: payload,
  });
}

export async function spotifyFetch(
  userId: string,
  path: string,
  init: RequestInit = {}
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

    return fetch(requestUrl, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  };

  let response = await run(false);

  if (response.status === 401) {
    response = await run(true);
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
    })
  );
}

export async function pause(userId: string) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player/pause", { method: "PUT" })
  );
}

export async function nextTrack(userId: string) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player/next", { method: "POST" })
  );
}

export async function previousTrack(userId: string) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player/previous", { method: "POST" })
  );
}

export async function seekToPosition(userId: string, positionMs: number) {
  return parseSpotifyBody(
    await spotifyFetch(userId, `/me/player/seek?position_ms=${positionMs}`, {
      method: "PUT",
    })
  );
}

export async function transferPlayback(
  userId: string,
  body: { device_ids: string[]; play?: boolean }
) {
  return parseSpotifyBody(
    await spotifyFetch(userId, "/me/player", {
      method: "PUT",
      body: JSON.stringify(body),
    })
  );
}

export async function getRecommendations(
  userId: string,
  query: URLSearchParams
) {
  return parseSpotifyBody(
    await spotifyFetch(userId, `/recommendations?${query.toString()}`)
  );
}

export async function addToQueue(
  userId: string,
  uri: string,
  deviceId?: string
) {
  const params = new URLSearchParams({ uri });

  if (deviceId) {
    params.set("device_id", deviceId);
  }

  return parseSpotifyBody(
    await spotifyFetch(userId, `/me/player/queue?${params.toString()}`, {
      method: "POST",
    })
  );
}
