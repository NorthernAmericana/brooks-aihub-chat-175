import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { previousTrack } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await previousTrack(userId));
  } catch (error) {
    return toSpotifyErrorResponse(error, "/api/spotify/player/previous");
  }
}
