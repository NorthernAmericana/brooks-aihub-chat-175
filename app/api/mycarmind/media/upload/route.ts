import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { verifyUploadToken } from "@/lib/mycarmind/upload-token";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const isImageOrVideoFile = (file: Blob, filename: string) =>
  file.type.startsWith("image/") ||
  file.type.startsWith("video/") ||
  /\.(png|jpg|jpeg|gif|webp|heic|heif|svg|mp4|mov|webm)$/i.test(filename);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (request.body === null) {
    return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
  }

  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const filename = (formData.get("filename") as string | null) ?? (formData.get("file") as File | null)?.name ?? "upload";
    const contentType = (formData.get("contentType") as string | null) ?? file?.type ?? "application/octet-stream";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: "Missing upload token" }, { status: 401 });
    }

    if (!verifyUploadToken({ token, userId: session.user.id, filename, contentType })) {
      return NextResponse.json({ error: "Invalid upload token" }, { status: 401 });
    }

    if (!isImageOrVideoFile(file, filename)) {
      return NextResponse.json({ error: "Only image or video uploads are supported" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size should be less than 10MB" }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const blob = await put(`mycarmind/${session.user.id}/${Date.now()}-${filename}`, fileBuffer, {
      access: "public",
      contentType,
    });

    const [asset] = await db
      .insert(mediaAssets)
      .values({
        userId: session.user.id,
        url: blob.url,
        contentType: blob.contentType ?? contentType,
        bytes: file.size,
        width: null,
        height: null,
      })
      .returning();

    if (!asset) {
      return NextResponse.json({ error: "Failed to create media asset" }, { status: 500 });
    }

    return NextResponse.json({
      asset_id: asset.id,
      url: asset.url,
      metadata: {
        content_type: asset.contentType,
        bytes: asset.bytes,
      },
    });
  } catch (error) {
    console.error("Failed to upload mycarmind asset", error);
    return NextResponse.json({ error: "Failed to upload asset" }, { status: 500 });
  }
}
