import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { DmCampfireRoom } from "./_components/DmCampfireRoom";
import { getDmRoomForViewer } from "@/lib/db/commons-queries";

export default async function PrivateDmCampfirePage({
  params,
}: {
  params: Promise<{ dmId: string }>;
}) {
  const { dmId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/api/auth/guest?redirectUrl=${encodeURIComponent(`/commons/dm/${dmId}`)}`);
  }

  const campfirePath = `dm/${dmId}`;
  const dmRoom = await getDmRoomForViewer({
    campfirePath,
    viewerId: session.user.id,
  });

  // Default product behavior is to hide inaccessible private DMs behind a 404.
  // If we ever want an invite-required experience, gate it behind an explicit
  // product decision before replacing this path.
  if (!dmRoom || !dmRoom.access.canRead) {
    notFound();
  }

  return (
    <DmCampfireRoom
      access={dmRoom.access}
      campfire={dmRoom.campfire}
      campfirePath={campfirePath}
      host={dmRoom.host}
      members={dmRoom.members}
      messages={dmRoom.messages}
      roomId={dmId}
    />
  );
}
