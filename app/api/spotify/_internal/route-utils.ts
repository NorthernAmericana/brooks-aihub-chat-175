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
    return NextResponse.json(error.toResponseBody(), { status: error.status });
  }

  const correlationId = randomUUID();
  console.error("Unhandled Spotify API route error", {
    correlationId,
    requestPath,
    error,
  });

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
