import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { nextTrack } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await nextTrack(userId));
  } catch (error) {
    return toSpotifyErrorResponse(error);
  }
}
