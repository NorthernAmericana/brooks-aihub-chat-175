import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { addToQueue, SpotifyApiError } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const uri = searchParams.get("uri");
    const deviceId = searchParams.get("device_id") ?? undefined;

    if (!uri) {
      throw new SpotifyApiError({
        status: 400,
        code: "spotify_request_failed",
        message: "uri query param is required.",
      });
    }

    return NextResponse.json(await addToQueue(userId, uri, deviceId));
  } catch (error) {
    return toSpotifyErrorResponse(error, "/api/spotify/queue");
  }
}
