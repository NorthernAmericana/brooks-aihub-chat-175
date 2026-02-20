import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { requireAuthUserId, requireRoomMembership } from "@/lib/dm/http";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;

  const authResult = await requireAuthUserId();
  if (authResult.response) {
    return authResult.response;
  }

  const memberResult = await requireRoomMembership(roomId, authResult.userId);
  if (memberResult.response) {
    return memberResult.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "image/png") {
      return NextResponse.json({ error: "Only PNG files are supported" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size should be less than 10MB" }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const blob = await put(`dm/${authResult.userId}/${Date.now()}-${file.name}`, fileBuffer, {
      access: "public",
      contentType: file.type,
    });

    const [asset] = await db
      .insert(mediaAssets)
      .values({
        userId: authResult.userId,
        url: blob.url,
        contentType: blob.contentType ?? file.type,
        bytes: file.size,
        width: null,
        height: null,
      })
      .returning();

    if (!asset) {
      return NextResponse.json({ error: "Failed to store media asset" }, { status: 500 });
    }

    return NextResponse.json({
      url: asset.url,
      metadata: {
        content_type: asset.contentType,
        bytes: asset.bytes,
        width: asset.width,
        height: asset.height,
      },
    });
  } catch (error) {
    console.error("Failed to upload drawpad image", error);
    return NextResponse.json({ error: "Failed to upload drawpad image" }, { status: 500 });
  }
}
