import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getChatById, updateChatTtsSettings } from "@/lib/db/queries";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId || typeof chatId !== "string") {
    return NextResponse.json({ error: "chatId is required." }, { status: 400 });
  }

  const chat = await getChatById({ id: chatId });

  if (!chat || chat.userId !== session.user.id) {
    return NextResponse.json({ error: "Chat not found." }, { status: 404 });
  }

  return NextResponse.json({
    ttsEnabled: chat.ttsEnabled ?? true,
    ttsVoiceId: chat.ttsVoiceId,
    ttsVoiceLabel: chat.ttsVoiceLabel,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: {
    chatId?: string;
    ttsEnabled?: boolean;
    ttsVoiceId?: string;
    ttsVoiceLabel?: string;
  };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const { chatId, ttsEnabled, ttsVoiceId, ttsVoiceLabel } = payload;

  if (!chatId || typeof chatId !== "string") {
    return NextResponse.json({ error: "chatId is required." }, { status: 400 });
  }

  const chat = await getChatById({ id: chatId });

  if (!chat || chat.userId !== session.user.id) {
    return NextResponse.json({ error: "Chat not found." }, { status: 404 });
  }

  const updatedChat = await updateChatTtsSettings({
    chatId,
    userId: session.user.id,
    ttsEnabled,
    ttsVoiceId,
    ttsVoiceLabel,
  });

  return NextResponse.json({ chat: updatedChat ?? chat });
}
