import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";

const schema = z.object({ filename: z.string().min(1), contentType: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const uploadToken = randomUUID();
  const uploadUrl = new URL("/api/myflower/upload", request.url).toString();

  return NextResponse.json({
    uploadUrl,
    uploadToken,
    filename: parsed.data.filename,
    contentType: parsed.data.contentType,
  });
}
