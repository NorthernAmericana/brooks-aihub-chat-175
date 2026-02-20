import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { SpotifyApiError, seekToPosition } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const positionMsParam = searchParams.get("position_ms");

    if (positionMsParam === null || positionMsParam === "") {
      throw new SpotifyApiError({
        status: 400,
        code: "spotify_request_failed",
        message: "position_ms is required.",
      });
    }

    const positionMs = Number(positionMsParam);

    if (!Number.isFinite(positionMs) || positionMs < 0) {
      throw new SpotifyApiError({
        status: 400,
        code: "spotify_request_failed",
        message: "position_ms must be a non-negative number.",
      });
    }

    return NextResponse.json(await seekToPosition(userId, positionMs));
  } catch (error) {
    return toSpotifyErrorResponse(error, "/api/spotify/player/seek");
  }
}
