import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getUserById,
  getUserMessageColor,
  updateUserMessageColor,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await getUserById({ id: session.user.id });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const messageColor = await getUserMessageColor({ userId: session.user.id });

  return NextResponse.json({ messageColor });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: { messageColor?: string | null };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const { messageColor } = payload;

  if (messageColor !== null && messageColor !== undefined) {
    if (typeof messageColor !== "string") {
      return NextResponse.json(
        { error: "messageColor must be a string." },
        { status: 400 }
      );
    }
  }

  const updatedMessageColor = await updateUserMessageColor({
    userId: session.user.id,
    messageColor: messageColor ?? null,
  });

  return NextResponse.json({ messageColor: updatedMessageColor });
}
