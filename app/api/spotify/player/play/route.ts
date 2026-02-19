import { NextResponse } from "next/server";
import {
  requireUserId,
  toSpotifyErrorResponse,
} from "@/app/api/spotify/_internal/route-utils";
import { play } from "@/lib/spotify/server";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const bodyText = await request.text();
    const body = bodyText ? JSON.parse(bodyText) : undefined;

    return NextResponse.json(await play(userId, body));
  } catch (error) {
    return toSpotifyErrorResponse(error);
  }
}
