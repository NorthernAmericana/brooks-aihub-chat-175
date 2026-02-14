import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getApprovedMemoriesByUserIdPage } from "@/lib/db/queries";
import { MemoriesClient } from "./memories-client";
import { buildMemoryItems } from "./memory-utils";

export default async function MemoriesPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  if (!session.user) {
    redirect("/api/auth/guest");
  }

  const { rows, nextCursor } = await getApprovedMemoriesByUserIdPage({
    userId: session.user.id,
    limit: 50,
    offset: 0,
  });

  const memoryItems = await buildMemoryItems(rows);

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col overflow-y-auto px-6 py-8 pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <MemoriesClient
        initialMemories={memoryItems}
        initialNextCursor={nextCursor}
      />
    </div>
  );
}
