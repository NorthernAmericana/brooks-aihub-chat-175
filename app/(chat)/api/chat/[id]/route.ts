import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { normalizeRoute } from "@/lib/ai/routing";
import { getChatById, updateChatActiveRoute } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id: params.id });
  if (!chat || chat.userId !== session.user.id) {
    return new ChatSDKError("not_found:chat").toResponse();
  }

  return NextResponse.json({ activeRoute: chat.activeRoute });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id: params.id });
  if (!chat || chat.userId !== session.user.id) {
    return new ChatSDKError("not_found:chat").toResponse();
  }

  const body = (await request.json()) as { activeRoute?: string };
  const activeRoute = normalizeRoute(body.activeRoute ?? chat.activeRoute);
  await updateChatActiveRoute({ chatId: chat.id, activeRoute });

  return NextResponse.json({ activeRoute });
}
