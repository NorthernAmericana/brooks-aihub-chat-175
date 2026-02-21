import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { markNotificationRead } from "@/lib/db/notification-queries";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { notificationId } = await context.params;

  const updated = await markNotificationRead({
    notificationId,
    userId: session.user.id,
  });

  if (!updated) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  return NextResponse.json({ notification: updated });
}
