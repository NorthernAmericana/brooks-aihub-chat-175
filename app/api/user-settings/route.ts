import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  findUserByPublicNickname,
  getUserAvatarUrl,
  getUserById,
  getUserMessageColor,
  getUserPublicNickname,
  updateUserAvatarUrl,
  updateUserMessageColor,
  updateUserPublicNickname,
} from "@/lib/db/queries";
import { getDbErrorDetails } from "@/lib/db/query-error-handling";
import {
  normalizePublicNickname,
  validatePublicNickname,
} from "@/lib/validation/public-nickname";

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

  const [messageColor, avatarUrl, publicNickname] = await Promise.all([
    getUserMessageColor({ userId: session.user.id }),
    getUserAvatarUrl({ userId: session.user.id }),
    getUserPublicNickname({ userId: session.user.id }),
  ]);

  return NextResponse.json({ messageColor, avatarUrl, publicNickname });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: {
    messageColor?: string | null;
    avatarUrl?: string | null;
    publicNickname?: string | null;
  };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const { messageColor, avatarUrl, publicNickname } = payload;

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

  let normalizedPublicNickname: string | null | undefined = undefined;

  if (publicNickname !== null && publicNickname !== undefined) {
    if (typeof publicNickname !== "string") {
      return NextResponse.json(
        { error: "publicNickname must be a string." },
        { status: 400 }
      );
    }

    normalizedPublicNickname = normalizePublicNickname(publicNickname);

    if (!normalizedPublicNickname) {
      normalizedPublicNickname = null;
    } else {
      const validationError = validatePublicNickname(normalizedPublicNickname);

      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const existing = await findUserByPublicNickname({
        publicNickname: normalizedPublicNickname,
      });

      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { error: "That nickname is already in use. Try another one." },
          { status: 409 }
        );
      }
    }
  }

  try {
    const [updatedMessageColor, updatedAvatarUrl, updatedPublicNickname] =
      await Promise.all([
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
        normalizedPublicNickname !== undefined
          ? updateUserPublicNickname({
              userId: session.user.id,
              publicNickname: normalizedPublicNickname,
            })
          : getUserPublicNickname({ userId: session.user.id }),
      ]);

    return NextResponse.json({
      messageColor: updatedMessageColor,
      avatarUrl: updatedAvatarUrl,
      publicNickname: updatedPublicNickname,
    });
  } catch (error) {
    const details = getDbErrorDetails(error);

    if (details.code === "23505") {
      return NextResponse.json(
        { error: "That nickname is already in use. Try another one." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Unable to update user settings." }, { status: 500 });
  }
}
