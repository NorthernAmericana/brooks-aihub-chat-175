import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { assertSpotifyAccountsTableReady } from "@/lib/db";
import { SpotifyApiError } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function requireUserId() {
  await assertSpotifyAccountsTableReady();

  const session = await auth();

  if (!session?.user?.id) {
    throw new SpotifyApiError({
      status: 401,
      code: "spotify_unauthorized",
      message: "Unauthorized",
    });
  }

  return session.user.id;
}

export function toSpotifyErrorResponse(error: unknown, requestPath: string) {
  if (error instanceof SpotifyApiError) {
    if (error.details !== undefined) {
      process.stderr.write(
        `${JSON.stringify({
          level: "warn",
          source: "spotify.api",
          message: "Spotify API error details",
          requestPath,
          code: error.code,
          status: error.status,
          details: error.details,
        })}\n`
      );
    }

    return NextResponse.json(error.toResponseBody(), { status: error.status });
  }

  const correlationId = randomUUID();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : typeof error;

  process.stderr.write(
    `${JSON.stringify({
      level: "error",
      source: "spotify.api",
      message: "Unhandled Spotify API route error",
      correlationId,
      requestPath,
      errorName,
      errorMessage,
    })}\n`
  );

  return NextResponse.json(
    {
      error: {
        code: "spotify_request_failed",
        message: "Unexpected Spotify proxy error",
        status: 500,
      },
    },
    {
      status: 500,
      headers: {
        "x-correlation-id": correlationId,
      },
    }
  );
}
