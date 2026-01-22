import { auth } from "@/app/(auth)/auth";
import { getUnreadMemoriesCountByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:memories").toResponse();
  }

  const count = await getUnreadMemoriesCountByUserId({
    id: session.user.id,
  });

  return Response.json({ count }, { status: 200 });
}
