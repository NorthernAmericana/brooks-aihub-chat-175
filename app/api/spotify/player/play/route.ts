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
    let body: unknown;

    try {
      body = bodyText ? JSON.parse(bodyText) : undefined;
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "spotify_request_failed",
            message: "Invalid JSON body.",
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(await play(userId, body));
  } catch (error) {
    return toSpotifyErrorResponse(error);
  }
}
