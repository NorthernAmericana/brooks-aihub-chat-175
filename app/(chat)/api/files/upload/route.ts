import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createAtoFile,
  getUnofficialAtoById,
  getUserById,
  updateUnofficialAtoSettings,
} from "@/lib/db/queries";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const isPdfFile = (file: Blob, filename: string) =>
  file.type === "application/pdf" || filename.toLowerCase().endsWith(".pdf");

const isChatMediaFile = (file: Blob, filename: string) =>
  file.type.startsWith("image/") ||
  file.type.startsWith("video/") ||
  isPdfFile(file, filename);

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const atoId = formData.get("atoId");
    const filename = (formData.get("file") as File)?.name ?? "upload";
    let atoPlanMetadataToUpdate: Record<string, unknown> | null = null;
    let atoIdToUpdate: string | null = null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size should be less than 4MB" },
        { status: 400 }
      );
    }

    if (typeof atoId === "string" && atoId) {
      const ato = await getUnofficialAtoById({
        id: atoId,
        ownerUserId: session.user.id,
      });

      if (!ato) {
        return NextResponse.json({ error: "ATO not found" }, { status: 404 });
      }

      if (!ato.fileSearchEnabled) {
        return NextResponse.json(
          { error: "File uploads are disabled for this ATO." },
          { status: 403 }
        );
      }

      const user = await getUserById({ id: session.user.id });

      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const maxFiles = user.foundersAccess ? 10 : 5;
      const existingMetadata =
        (ato.planMetadata as Record<string, unknown> | null) ?? {};
      const fileSearchMetadata =
        (existingMetadata.fileSearch as Record<string, unknown> | undefined) ??
        {};
      const currentCount =
        typeof fileSearchMetadata.fileCount === "number"
          ? fileSearchMetadata.fileCount
          : 0;

      if (currentCount >= maxFiles) {
        const planLabel = user.foundersAccess ? "Founders" : "Free";
        return NextResponse.json(
          {
            error: `File upload limit reached. ${planLabel} plans allow up to ${maxFiles} files per ATO.`,
          },
          { status: 403 }
        );
      }

      atoPlanMetadataToUpdate = {
        ...existingMetadata,
        fileSearch: {
          ...fileSearchMetadata,
          fileCount: currentCount + 1,
        },
      };
      atoIdToUpdate = ato.id;
    }

    if (atoIdToUpdate) {
      if (!isPdfFile(file, filename)) {
        return NextResponse.json(
          { error: "Only PDF files are accepted for ATO uploads." },
          { status: 400 }
        );
      }
    } else if (!isChatMediaFile(file, filename)) {
      return NextResponse.json(
        { error: "Only images, videos, or PDFs are accepted in chat uploads." },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: "public",
      });

      if (atoIdToUpdate) {
        await createAtoFile({
          atoId: atoIdToUpdate,
          ownerUserId: session.user.id,
          filename,
          blobUrl: data.url,
          blobPathname: data.pathname,
          contentType: data.contentType ?? file.type,
          enabled: true,
        });
      }

      if (atoIdToUpdate && atoPlanMetadataToUpdate) {
        await updateUnofficialAtoSettings({
          id: atoIdToUpdate,
          ownerUserId: session.user.id,
          planMetadata: atoPlanMetadataToUpdate,
        });
      }

      return NextResponse.json(data);
    } catch (_error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
