import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { getPlayerState } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await getPlayerState(userId));
  } catch (error) {
    return toSpotifyErrorResponse(error);
  }
}
