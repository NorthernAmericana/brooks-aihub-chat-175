import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";
import {
  createCustomAgent,
  deleteCustomAgent,
  getCustomAgentsByUserId,
  getUserById,
  updateCustomAgent,
  updateUserCustomAtoCount,
} from "@/lib/db/queries";

const MAX_PROMPT_LENGTH_DEFAULT = 500;
const MAX_PROMPT_LENGTH_FOUNDER = 999;
const MAX_CUSTOM_ATOS_DEFAULT = 3;
const MAX_CUSTOM_ATOS_FOUNDER = 10;

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function checkCustomAtoLimits(userId: string): Promise<{
  canCreate: boolean;
  limit: number;
  current: number;
  isFounder: boolean;
  isDev: boolean;
}> {
  const user = await getUserById({ id: userId });

  if (!user) {
    throw new Error("User not found");
  }

  const isDev = isDevelopmentEnvironment;
  const isFounder = user.isFounder ?? false;

  // Dev mode has unlimited
  if (isDev) {
    return {
      canCreate: true,
      limit: -1,
      current: 0,
      isFounder,
      isDev: true,
    };
  }

  const limit = isFounder ? MAX_CUSTOM_ATOS_FOUNDER : MAX_CUSTOM_ATOS_DEFAULT;
  const currentMonth = getCurrentMonth();

  // Initialize customAtoCount if null
  const customAtoCount = user.customAtoCount ?? { month: "", count: 0 };

  // Reset count if new month
  let current = customAtoCount.count;
  if (customAtoCount.month !== currentMonth) {
    current = 0;
    await updateUserCustomAtoCount({
      userId,
      customAtoCount: { month: currentMonth, count: 0 },
    });
  }

  return {
    canCreate: current < limit,
    limit,
    current,
    isFounder,
    isDev: false,
  };
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const agents = await getCustomAgentsByUserId({ userId: session.user.id });
    const limits = await checkCustomAtoLimits(session.user.id);

    return NextResponse.json({
      agents,
      limits,
    });
  } catch (error) {
    console.error("Error fetching custom agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom agents." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: {
    name?: string;
    slash?: string;
    systemPrompt?: string;
    defaultVoiceId?: string;
    defaultVoiceLabel?: string;
    memoryScope?: "ato-only" | "hub-wide";
    tools?: string[];
  };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const {
    name,
    slash,
    systemPrompt,
    defaultVoiceId,
    defaultVoiceLabel,
    memoryScope,
    tools,
  } = payload;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!slash || typeof slash !== "string") {
    return NextResponse.json({ error: "Slash is required." }, { status: 400 });
  }

  // Check limits
  const limits = await checkCustomAtoLimits(session.user.id);

  if (!limits.canCreate) {
    return NextResponse.json(
      {
        error: `Custom ATO limit reached. You can create ${limits.limit} custom ATOs per month.`,
        limits,
      },
      { status: 403 }
    );
  }

  // Check prompt length limits
  const user = await getUserById({ id: session.user.id });
  const isFounder = user?.isFounder ?? false;
  const maxPromptLength = isFounder
    ? MAX_PROMPT_LENGTH_FOUNDER
    : MAX_PROMPT_LENGTH_DEFAULT;

  if (
    systemPrompt &&
    typeof systemPrompt === "string" &&
    systemPrompt.length > maxPromptLength
  ) {
    return NextResponse.json(
      {
        error: `Prompt instructions exceed maximum length of ${maxPromptLength} characters.`,
      },
      { status: 400 }
    );
  }

  try {
    const agent = await createCustomAgent({
      userId: session.user.id,
      name,
      slash: slash.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      systemPrompt,
      defaultVoiceId,
      defaultVoiceLabel,
      memoryScope: memoryScope ?? "ato-only",
      tools,
    });

    // Increment usage count (unless dev mode)
    if (!limits.isDev) {
      const currentMonth = getCurrentMonth();
      await updateUserCustomAtoCount({
        userId: session.user.id,
        customAtoCount: { month: currentMonth, count: limits.current + 1 },
      });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Error creating custom agent:", error);
    return NextResponse.json(
      { error: "Failed to create custom agent." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: {
    id?: string;
    name?: string;
    systemPrompt?: string;
    defaultVoiceId?: string;
    defaultVoiceLabel?: string;
    memoryScope?: "ato-only" | "hub-wide";
    tools?: string[];
  };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const {
    id,
    name,
    systemPrompt,
    defaultVoiceId,
    defaultVoiceLabel,
    memoryScope,
    tools,
  } = payload;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }

  // Check prompt length limits
  const user = await getUserById({ id: session.user.id });
  const isFounder = user?.isFounder ?? false;
  const maxPromptLength = isFounder
    ? MAX_PROMPT_LENGTH_FOUNDER
    : MAX_PROMPT_LENGTH_DEFAULT;

  if (
    systemPrompt &&
    typeof systemPrompt === "string" &&
    systemPrompt.length > maxPromptLength
  ) {
    return NextResponse.json(
      {
        error: `Prompt instructions exceed maximum length of ${maxPromptLength} characters.`,
      },
      { status: 400 }
    );
  }

  try {
    const agent = await updateCustomAgent({
      id,
      userId: session.user.id,
      name,
      systemPrompt,
      defaultVoiceId,
      defaultVoiceLabel,
      memoryScope,
      tools,
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Custom agent not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Error updating custom agent:", error);
    return NextResponse.json(
      { error: "Failed to update custom agent." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }

  try {
    const agent = await deleteCustomAgent({
      id,
      userId: session.user.id,
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Custom agent not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom agent:", error);
    return NextResponse.json(
      { error: "Failed to delete custom agent." },
      { status: 500 }
    );
  }
}
