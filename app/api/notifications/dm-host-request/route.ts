import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createHostRequestNotification } from "@/lib/db/notification-queries";

const schema = z.object({ dmId: z.string().min(1) });

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const result = await createHostRequestNotification({
    dmId: parsed.data.dmId,
    requesterUserId: session.user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ notification: result.notification }, { status: 201 });
}
