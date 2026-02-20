import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { disconnectSpotify } from "@/lib/spotify/disconnect";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    await disconnectSpotify(userId);

    return NextResponse.redirect(
      new URL("/spotify-app?disconnected=1", request.url),
      303
    );
  } catch (error) {
    return toSpotifyErrorResponse(error, "/api/spotify/disconnect");
  }
}
