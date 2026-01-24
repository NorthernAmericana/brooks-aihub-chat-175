import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { listAgentConfigsWithCustom } from "@/lib/ai/agents/registry";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const agents = await listAgentConfigsWithCustom();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents." },
      { status: 500 }
    );
  }
}
