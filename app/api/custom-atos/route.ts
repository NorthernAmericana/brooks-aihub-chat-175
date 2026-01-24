import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  countCustomATOsByUserId,
  createCustomATO,
  getCustomATOsByUserId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

// User tier limits
const TIER_LIMITS = {
  free: 3,
  founders: 10,
  dev: Number.POSITIVE_INFINITY,
};

const INSTRUCTION_LIMITS = {
  free: 500,
  founders: 999,
  dev: 10000,
};

function getUserTier(user: any): "free" | "founders" | "dev" {
  // TODO: Implement actual tier detection from user data or subscription
  // For now, check if email contains "dev" or other indicators
  if (user?.email?.includes("dev") || user?.email?.includes("admin")) {
    return "dev";
  }
  // TODO: Check for founders subscription
  return "free";
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const customATOs = await getCustomATOsByUserId(session.user.id);
    const count = await countCustomATOsByUserId(session.user.id);
    const tier = getUserTier(session.user);
    const limit = TIER_LIMITS[tier];

    return Response.json({
      customATOs,
      count,
      limit,
      tier,
    });
  } catch (error) {
    console.error("Failed to fetch custom ATOs:", error);
    return new ChatSDKError(
      "bad_request:database",
      "Failed to fetch custom ATOs"
    ).toResponse();
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const body = await request.json();
    const { name, slash, voiceId, voiceLabel, instructions, memoryScope } = body;

    // Validation
    if (!name || !slash || !voiceId || !voiceLabel || !instructions) {
      return new ChatSDKError(
        "bad_request:api",
        "Missing required fields"
      ).toResponse();
    }

    // Check tier limits
    const tier = getUserTier(session.user);
    const count = await countCustomATOsByUserId(session.user.id);
    const limit = TIER_LIMITS[tier];

    if (count >= limit) {
      return Response.json(
        {
          error: "limit_reached",
          message: `You have reached the limit of ${limit} custom ATOs for your tier.`,
          tier,
          limit,
          count,
        },
        { status: 403 }
      );
    }

    // Check instruction length limit
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

    // Create custom ATO
    const customATO = await createCustomATO({
      userId: session.user.id,
      name,
      slash,
      voiceId,
      voiceLabel,
      instructions,
      memoryScope: memoryScope || "ato-only",
    });

    return Response.json(customATO, { status: 201 });
  } catch (error) {
    console.error("Failed to create custom ATO:", error);
    return new ChatSDKError(
      "bad_request:database",
      "Failed to create custom ATO"
    ).toResponse();
  }
}
