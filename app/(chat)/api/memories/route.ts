import { auth } from "@/app/(auth)/auth";
import { createMemory, markMemoriesReadByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:memories").toResponse();
  }

  let payload: { content?: string };

  try {
    payload = await request.json();
  } catch {
    return new ChatSDKError(
      "bad_request:api",
      "Invalid JSON payload for memory creation."
    ).toResponse();
  }

  if (!payload.content || typeof payload.content !== "string") {
    return new ChatSDKError(
      "bad_request:api",
      "Memory content is required."
    ).toResponse();
  }

  const [memory] = await createMemory({
    userId: session.user.id,
    content: payload.content,
  });

  return Response.json(memory, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:memories").toResponse();
  }

  let payload: { ids?: string[] };

  try {
    payload = await request.json();
  } catch {
    return new ChatSDKError(
      "bad_request:api",
      "Invalid JSON payload for marking memories read."
    ).toResponse();
  }

  if (payload.ids && !Array.isArray(payload.ids)) {
    return new ChatSDKError(
      "bad_request:api",
      "Memory ids must be an array."
    ).toResponse();
  }

  await markMemoriesReadByUserId({
    userId: session.user.id,
    memoryIds: payload.ids,
  });

  return Response.json({ ok: true }, { status: 200 });
}
