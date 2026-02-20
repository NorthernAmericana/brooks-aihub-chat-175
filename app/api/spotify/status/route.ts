import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { spotifyAccounts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ connected: false });
  }

  const [connection] = await db
    .select({ id: spotifyAccounts.id })
    .from(spotifyAccounts)
    .where(
      and(
        eq(spotifyAccounts.userId, session.user.id),
        isNull(spotifyAccounts.revokedAt),
      ),
    )
    .limit(1);

  return NextResponse.json({
    connected: Boolean(connection),
  });
}
