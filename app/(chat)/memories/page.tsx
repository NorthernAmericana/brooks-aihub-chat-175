import { format } from "date-fns";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getAgentConfigById } from "@/lib/ai/agents/registry";
import { getApprovedMemoriesByUserId } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

  return (
    <div className="flex h-full flex-col px-6 py-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">Memories</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Approved memories saved from chat appear here with the route and agent
          that captured them.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {memories.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No approved memories yet. When you approve a saved memory in chat,
              it will show up here with its route and agent.
            </CardContent>
          </Card>
        ) : (
          memories.map((memory) => {
            const agentLabel =
              memory.agentLabel ??
              (memory.agentId
                ? getAgentConfigById(memory.agentId)?.label
                : undefined) ??
              "Unknown agent";

            return (
              <Card key={memory.id}>
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatRoute(memory.route)}</Badge>
                    <Badge variant="secondary">{agentLabel}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Saved {formatDate(memory.approvedAt ?? memory.createdAt)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground">{memory.rawText}</p>
                  <div className="text-xs text-muted-foreground">
                    Source: {memory.sourceUri}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
