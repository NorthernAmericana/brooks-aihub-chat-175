import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteCustomATO,
  getCustomATOById,
  updateCustomATO,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

const INSTRUCTION_LIMITS = {
  free: 500,
  founders: 999,
  dev: 10000,
};

function getUserTier(user: any): "free" | "founders" | "dev" {
  if (user?.email?.includes("dev") || user?.email?.includes("admin")) {
    return "dev";
  }
  return "free";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const customATO = await getCustomATOById({
      id: params.id,
      userId: session.user.id,
    });

    if (!customATO) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(customATO);
  } catch (error) {
    console.error("Failed to fetch custom ATO:", error);
    return new ChatSDKError(
      "bad_request:database",
      "Failed to fetch custom ATO"
    ).toResponse();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const body = await request.json();
    const { name, voiceId, voiceLabel, instructions, memoryScope } = body;

    // Check if ATO exists and belongs to user
    const existing = await getCustomATOById({
      id: params.id,
      userId: session.user.id,
    });

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Check instruction length limit if instructions are being updated
    if (instructions !== undefined) {
      const tier = getUserTier(session.user);
      const instructionLimit = INSTRUCTION_LIMITS[tier];
      if (instructions.length > instructionLimit) {
        return Response.json(
          {
            error: "instructions_too_long",
            message: `Instructions cannot exceed ${instructionLimit} characters for your tier.`,
            tier,
            limit: instructionLimit,
            length: instructions.length,
          },
          { status: 400 }
        );
      }
    }

    const updatedATO = await updateCustomATO({
      id: params.id,
      userId: session.user.id,
      name,
      voiceId,
      voiceLabel,
      instructions,
      memoryScope,
    });

    return Response.json(updatedATO);
  } catch (error) {
    console.error("Failed to update custom ATO:", error);
    return new ChatSDKError(
      "bad_request:database",
      "Failed to update custom ATO"
    ).toResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    // Check if ATO exists and belongs to user
    const existing = await getCustomATOById({
      id: params.id,
      userId: session.user.id,
    });

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await deleteCustomATO({
      id: params.id,
      userId: session.user.id,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete custom ATO:", error);
    return new ChatSDKError(
      "bad_request:database",
      "Failed to delete custom ATO"
    ).toResponse();
  }
}
