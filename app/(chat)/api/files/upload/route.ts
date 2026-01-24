import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import {
  getUnofficialAtoById,
  getUserById,
  updateUnofficialAtoSettings,
} from "@/lib/db/queries";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "text/plain",
  "text/markdown",
] as const;

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), {
      message: "File type should be JPEG, PNG, PDF, or plain text",
    }),
});

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
    let atoPlanMetadataToUpdate: Record<string, unknown> | null = null;
    let atoIdToUpdate: string | null = null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
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
      const maxFiles = user?.foundersAccess ? 10 : 5;
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
        return NextResponse.json(
          {
            error: `File upload limit reached. Max ${maxFiles} files per ATO.`,
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

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: "public",
      });

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
