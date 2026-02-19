import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { getRecommendations } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);

    return NextResponse.json(await getRecommendations(userId, searchParams));
  } catch (error) {
    return toSpotifyErrorResponse(error);
  }
}
