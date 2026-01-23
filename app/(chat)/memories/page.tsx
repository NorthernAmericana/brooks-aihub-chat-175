import { format } from "date-fns";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getAgentConfigById } from "@/lib/ai/agents/registry";
import { getApprovedMemoriesByUserId } from "@/lib/db/queries";
import { MemoriesList } from "@/components/memories-list";

const formatRoute = (route: string | null) => {
  if (!route) {
    return "Unknown route";
  }

  const trimmed = route.replace(/^\/|\/$/g, "");
  return `/${trimmed}/`;
};

const formatDate = (date: Date | null) => {
  if (!date) {
    return "Unknown date";
  }

  return format(date, "MMM d");
};

export default async function MemoriesPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  if (!session.user) {
    redirect("/api/auth/guest");
  }

  const memories = await getApprovedMemoriesByUserId({
    userId: session.user.id,
  });

  const formattedMemories = memories.map((memory) => {
    const agentLabel =
      memory.agentLabel ??
      (memory.agentId
        ? getAgentConfigById(memory.agentId)?.label
        : undefined) ??
      "Unknown agent";

    return {
      id: memory.id,
      route: formatRoute(memory.route),
      agentLabel,
      rawText: memory.rawText,
      sourceUri: memory.sourceUri,
      savedDate: formatDate(memory.approvedAt ?? memory.createdAt),
    };
  });

  return (
    <div className="flex h-full flex-col px-6 py-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">Memories</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Approved memories saved from chat appear here with the route and agent
          that captured them.
        </p>
      </div>

      <div className="mt-6">
        <MemoriesList memories={formattedMemories} />
      </div>
    </div>
  );
}
