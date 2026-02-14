import { z } from "zod";
import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { purgeChatsByUserIdAndRange } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

const purgeSchema = z.object({
  range: z.enum(["day", "week", "month", "six_months", "all_time"]),
});

type ChatHistoryRange = z.infer<typeof purgeSchema>["range"];

const getCutoffDate = (range: ChatHistoryRange) => {
  const now = new Date();

  switch (range) {
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "six_months": {
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 6);
      return cutoff;
    }
    case "all_time":
      return null;
  }
};

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.warn("Failed to parse chat purge payload", error);
    return new ChatSDKError("bad_request:api", "Invalid JSON body.").toResponse();
  }

  const parsed = purgeSchema.safeParse(body);

  if (!parsed.success) {
    return new ChatSDKError(
      "bad_request:api",
      "Invalid range selection."
    ).toResponse();
  }

  const cutoff = getCutoffDate(parsed.data.range);
  const result = await purgeChatsByUserIdAndRange({
    userId: session.user.id,
    cutoff,
  });

  return Response.json(result, { status: 200 });
}
