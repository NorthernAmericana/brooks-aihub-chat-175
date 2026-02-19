import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { pause } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function PUT() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await pause(userId));
  } catch (error) {
    return toSpotifyErrorResponse(error);
  }
}
