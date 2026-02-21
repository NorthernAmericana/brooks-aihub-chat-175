import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createMemoryReminderNotifications,
  listNotificationsForUser,
} from "@/lib/db/notification-queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Number.parseInt(searchParams.get("limit") ?? "6", 10);

  await createMemoryReminderNotifications(session.user.id);

  const result = await listNotificationsForUser({
    userId: session.user.id,
    cursor,
    limit,
  });

  return NextResponse.json(result);
}
