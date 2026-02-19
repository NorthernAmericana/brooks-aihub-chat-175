import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { atoApps, spotifyAccounts, userInstalls } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const APP_SLUG = "spotify-music-player";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ installed: false, connected: false });
  }

  const [app] = await db
    .select({ id: atoApps.id })
    .from(atoApps)
    .where(eq(atoApps.slug, APP_SLUG))
    .limit(1);

  const [connection] = await db
    .select({ id: spotifyAccounts.id })
    .from(spotifyAccounts)
    .where(
      and(
        eq(spotifyAccounts.userId, session.user.id),
        isNull(spotifyAccounts.revokedAt)
      )
    )
    .limit(1);

  const [install] = app
    ? await db
        .select({ appId: userInstalls.appId })
        .from(userInstalls)
        .where(
          and(
            eq(userInstalls.userId, session.user.id),
            eq(userInstalls.appId, app.id)
          )
        )
        .limit(1)
    : [null];

  return NextResponse.json({
    installed: Boolean(install),
    connected: Boolean(connection),
  });
}
