import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { SpotifyApiError } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function requireUserId() {
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

export function toSpotifyErrorResponse(error: unknown) {
  if (error instanceof SpotifyApiError) {
    return NextResponse.json(error.toResponseBody(), { status: error.status });
  }

  console.error("Unexpected Spotify proxy error", error);
  return NextResponse.json(
    {
      error: {
        code: "spotify_request_failed",
        message: "Unexpected Spotify proxy error",
        status: 500,
      },
    },
    { status: 500 }
  );
}
