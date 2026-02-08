import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getUserAvatarUrl,
  getUserById,
  getUserMessageColor,
  updateUserAvatarUrl,
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

  const [messageColor, avatarUrl] = await Promise.all([
    getUserMessageColor({ userId: session.user.id }),
    getUserAvatarUrl({ userId: session.user.id }),
  ]);

  return NextResponse.json({ messageColor, avatarUrl });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: { messageColor?: string | null; avatarUrl?: string | null };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const { messageColor, avatarUrl } = payload;

  if (messageColor !== null && messageColor !== undefined) {
    if (typeof messageColor !== "string") {
      return NextResponse.json(
        { error: "messageColor must be a string." },
        { status: 400 }
      );
    }
  }

  if (avatarUrl !== null && avatarUrl !== undefined) {
    if (typeof avatarUrl !== "string") {
      return NextResponse.json(
        { error: "avatarUrl must be a string." },
        { status: 400 }
      );
    }
  }

  const [updatedMessageColor, updatedAvatarUrl] = await Promise.all([
    messageColor !== undefined
      ? updateUserMessageColor({
          userId: session.user.id,
          messageColor: messageColor ?? null,
        })
      : getUserMessageColor({ userId: session.user.id }),
    avatarUrl !== undefined
      ? updateUserAvatarUrl({
          userId: session.user.id,
          avatarUrl: avatarUrl ?? null,
        })
      : getUserAvatarUrl({ userId: session.user.id }),
  ]);

  return NextResponse.json({
    messageColor: updatedMessageColor,
    avatarUrl: updatedAvatarUrl,
  });
}
