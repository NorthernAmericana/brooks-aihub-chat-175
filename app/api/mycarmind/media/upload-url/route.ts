import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { issueUploadToken } from "@/lib/mycarmind/upload-token";

const schema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const uploadAuth = issueUploadToken(session.user.id, parsed.data.filename, parsed.data.contentType);

  const uploadUrl = new URL("/api/mycarmind/media/upload", request.url).toString();

  return NextResponse.json({
    uploadUrl,
    method: "POST",
    authorization: {
      type: "bearer-upload-token",
      token: uploadAuth.token,
      expiresInSeconds: uploadAuth.expiresInSeconds,
    },
    expected: {
      filename: parsed.data.filename,
      contentType: parsed.data.contentType,
      multipartFieldName: "file",
      bodyFields: ["filename", "contentType"],
      header: "Authorization: Bearer <token>",
    },
  });
}
