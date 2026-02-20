import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { SpotifyApiError, transferPlayback } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    if (!Array.isArray(body?.device_ids) || body.device_ids.length === 0) {
      throw new SpotifyApiError({
        status: 400,
        code: "spotify_request_failed",
        message: "device_ids is required.",
      });
    }

    return NextResponse.json(await transferPlayback(userId, body));
  } catch (error) {
    return toSpotifyErrorResponse(error, "/api/spotify/player/transfer");
  }
}
