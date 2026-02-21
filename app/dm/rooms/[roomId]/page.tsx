import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import {
  getDmRoomCapacitySnapshot,
  loadDmRoomByIdForMember,
} from "@/lib/db/dm-queries";

export default async function DmRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?next=${encodeURIComponent(`/dm/rooms/${roomId}`)}`);
  }

  const [room, capacity] = await Promise.all([
    loadDmRoomByIdForMember({ roomId, userId: session.user.id }),
    getDmRoomCapacitySnapshot(roomId),
  ]);

  if (!room || !capacity) {
    redirect("/commons/dm");
  }

  return (
    <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-sky-950/30 bg-sky-100/65 p-8 shadow-[0_15px_45px_rgba(10,36,64,0.28)]">
        <header className="space-y-2 border-b border-sky-950/25 pb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
            Direct Room
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Room {roomId.slice(0, 8)}
          </h1>
          <p className="text-base text-slate-700">
            Members {capacity.memberCount}/{capacity.memberLimit}
          </p>
        </header>

        <section className="rounded-xl border border-sky-900/25 bg-white/85 p-4 text-sm text-slate-700">
          This stable route is now available for DM invite flows.
        </section>

        <Link
          className="inline-flex rounded-md border border-sky-950/35 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          href={`/commons/dm/${encodeURIComponent(roomId)}`}
        >
          Open campfire UI
        </Link>
      </div>
    </main>
  );
}
