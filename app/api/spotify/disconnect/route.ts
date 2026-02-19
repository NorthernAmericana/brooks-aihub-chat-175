import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { disconnectSpotify } from "@/lib/spotify/disconnect";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await disconnectSpotify(session.user.id);

  return NextResponse.json({ disconnected: true });
}
