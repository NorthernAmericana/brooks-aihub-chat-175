import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { getCurrentUserProfile } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await getCurrentUserProfile(userId));
  } catch (error) {
    return toSpotifyErrorResponse(error);
  }
}
