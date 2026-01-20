import { NextResponse } from "next/server";
import { listAgentConfigs } from "@/lib/ai/agents/registry";

export async function GET() {
  const agents = await listAgentConfigs();

  return NextResponse.json(
    agents.map(({ systemPromptOverride: _prompt, ...agent }) => agent)
  );
}
