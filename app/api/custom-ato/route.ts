import { auth } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { isDevelopmentEnvironment } from "@/lib/constants";
import {
  createCustomAto,
  deleteCustomAto,
  getCustomAtosByUserId,
  getCustomAtoUsageThisMonth,
  updateCustomAto,
} from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customAtos = await getCustomAtosByUserId(session.user.id);
    return NextResponse.json(customAtos);
  } catch (error) {
    console.error("Error fetching custom ATOs:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom ATOs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slashRoute, voiceId, voiceLabel, promptInstructions, memoryScope } = body;

    if (!name || !slashRoute) {
      return NextResponse.json(
        { error: "Name and slash route are required" },
        { status: 400 }
      );
    }

    // Check usage limits (skip in dev mode)
    if (!isDevelopmentEnvironment) {
      const usageThisMonth = await getCustomAtoUsageThisMonth(session.user.id);
      const entitlements = entitlementsByUserType[session.user.type];
      
      if (usageThisMonth >= entitlements.maxCustomAtosPerMonth) {
        return NextResponse.json(
          {
            error: `Monthly limit reached. You can create up to ${entitlements.maxCustomAtosPerMonth} custom ATOs per month.`,
            limit: entitlements.maxCustomAtosPerMonth,
            usage: usageThisMonth,
          },
          { status: 429 }
        );
      }
    }

    // Validate prompt instructions length
    const entitlements = entitlementsByUserType[session.user.type];
    if (
      promptInstructions &&
      promptInstructions.length > entitlements.maxPromptInstructionsLength
    ) {
      return NextResponse.json(
        {
          error: `Prompt instructions exceed maximum length of ${entitlements.maxPromptInstructionsLength} characters`,
        },
        { status: 400 }
      );
    }

    const customAto = await createCustomAto({
      userId: session.user.id,
      name,
      slashRoute,
      voiceId,
      voiceLabel,
      promptInstructions,
      memoryScope: memoryScope || "ato-only",
    });

    return NextResponse.json(customAto, { status: 201 });
  } catch (error) {
    console.error("Error creating custom ATO:", error);
    return NextResponse.json(
      { error: "Failed to create custom ATO" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, voiceId, voiceLabel, promptInstructions, memoryScope } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ATO ID is required" },
        { status: 400 }
      );
    }

    // Validate prompt instructions length if provided
    if (promptInstructions !== undefined) {
      const entitlements = entitlementsByUserType[session.user.type];
      if (promptInstructions.length > entitlements.maxPromptInstructionsLength) {
        return NextResponse.json(
          {
            error: `Prompt instructions exceed maximum length of ${entitlements.maxPromptInstructionsLength} characters`,
          },
          { status: 400 }
        );
      }
    }

    const updatedAto = await updateCustomAto({
      id,
      userId: session.user.id,
      name,
      voiceId,
      voiceLabel,
      promptInstructions,
      memoryScope,
    });

    return NextResponse.json(updatedAto);
  } catch (error) {
    console.error("Error updating custom ATO:", error);
    return NextResponse.json(
      { error: "Failed to update custom ATO" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ATO ID is required" },
        { status: 400 }
      );
    }

    await deleteCustomAto(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom ATO:", error);
    return NextResponse.json(
      { error: "Failed to delete custom ATO" },
      { status: 500 }
    );
  }
}
