import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getCurrentMonthKey,
  getUserCustomAtoLimit,
} from "@/lib/custom-ato-limits";
import {
  createCustomAto,
  deleteCustomAto,
  getCustomAtoById,
  getCustomAtosByUserId,
  getUser,
  updateCustomAto,
} from "@/lib/db/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [dbUser] = await getUser(session.user.email);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const customAtos = await getCustomAtosByUserId(dbUser.id);
    return NextResponse.json(customAtos);
  } catch (error) {
    console.error("Failed to get custom ATOs:", error);
    return NextResponse.json(
      { error: "Failed to get custom ATOs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [dbUser] = await getUser(session.user.email);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      slash,
      voiceId,
      voiceLabel,
      promptInstructions,
      memoryScope,
    } = body;

    // Validate required fields
    if (!name || !slash) {
      return NextResponse.json(
        { error: "Name and slash are required" },
        { status: 400 }
      );
    }

    // Check usage limits
    const limits = getUserCustomAtoLimit(dbUser);
    const currentMonth = getCurrentMonthKey();
    const customAtos = await getCustomAtosByUserId(dbUser.id);

    // Count ATOs used this month
    const currentMonthUsage = customAtos.reduce((acc, ato) => {
      const usageCount = ato.usageCount as { month: string; count: number }[];
      const monthUsage = usageCount.find((u) => u.month === currentMonth);
      return acc + (monthUsage ? monthUsage.count : 0);
    }, 0);

    if (currentMonthUsage >= limits.customAtosPerMonth) {
      return NextResponse.json(
        {
          error: `Custom ATO limit reached. Your plan allows ${limits.customAtosPerMonth} custom ATOs per month.`,
        },
        { status: 403 }
      );
    }

    // Validate prompt instructions length
    if (
      promptInstructions &&
      promptInstructions.length > limits.promptInstructionsLimit
    ) {
      return NextResponse.json(
        {
          error: `Prompt instructions exceed limit of ${limits.promptInstructionsLimit} characters`,
        },
        { status: 400 }
      );
    }

    const newAto = await createCustomAto({
      userId: dbUser.id,
      name,
      slash,
      voiceId,
      voiceLabel,
      promptInstructions,
      memoryScope: memoryScope || "ato-only",
    });

    return NextResponse.json(newAto, { status: 201 });
  } catch (error) {
    console.error("Failed to create custom ATO:", error);
    return NextResponse.json(
      { error: "Failed to create custom ATO" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [dbUser] = await getUser(session.user.email);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, voiceId, voiceLabel, promptInstructions, memoryScope } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "ATO ID is required" },
        { status: 400 }
      );
    }

    // Check if ATO exists and belongs to user
    const existingAto = await getCustomAtoById(id, dbUser.id);
    if (!existingAto) {
      return NextResponse.json({ error: "ATO not found" }, { status: 404 });
    }

    // Validate prompt instructions length
    const limits = getUserCustomAtoLimit(dbUser);
    if (
      promptInstructions &&
      promptInstructions.length > limits.promptInstructionsLimit
    ) {
      return NextResponse.json(
        {
          error: `Prompt instructions exceed limit of ${limits.promptInstructionsLimit} characters`,
        },
        { status: 400 }
      );
    }

    const updatedAto = await updateCustomAto({
      id,
      userId: dbUser.id,
      name,
      voiceId,
      voiceLabel,
      promptInstructions,
      memoryScope,
    });

    return NextResponse.json(updatedAto);
  } catch (error) {
    console.error("Failed to update custom ATO:", error);
    return NextResponse.json(
      { error: "Failed to update custom ATO" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [dbUser] = await getUser(session.user.email);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ATO ID is required" },
        { status: 400 }
      );
    }

    await deleteCustomAto(id, dbUser.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete custom ATO:", error);
    return NextResponse.json(
      { error: "Failed to delete custom ATO" },
      { status: 500 }
    );
  }
}
