import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { disconnectSpotify } from "@/lib/spotify/disconnect";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = await requireUserId();
    await disconnectSpotify(userId);
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    return toSpotifyErrorResponse(error);
  }
}
