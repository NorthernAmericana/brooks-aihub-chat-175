import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUnreadNotificationCount } from "@/lib/db/notification-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const unreadCount = await getUnreadNotificationCount(session.user.id);
  return NextResponse.json({ unreadCount });
}
