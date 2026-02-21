import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { DmCampfireRecoveryPanel } from "./_components/DmCampfireRecoveryPanel";
import { DmCampfireRoom } from "./_components/DmCampfireRoom";
import {
  getDmCampfireRecoveryForViewer,
  getDmRoomForViewer,
} from "@/lib/db/commons-queries";

export default async function PrivateDmCampfirePage({
  params,
}: {
  params: Promise<{ dmId: string }>;
}) {
  const { dmId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      `/api/auth/guest?redirectUrl=${encodeURIComponent(`/commons/dm/${dmId}`)}`
    );
  }

  const campfirePath = `dm/${dmId}`;
  const dmRoom = await getDmRoomForViewer({
    campfirePath,
    viewerId: session.user.id,
  });

  if (dmRoom?.access.canRead) {
    return (
      <DmCampfireRoom
        access={dmRoom.access}
        campfire={dmRoom.campfire}
        campfirePath={campfirePath}
        expiresAt={dmRoom.expiresAt ? dmRoom.expiresAt.toISOString() : null}
        host={dmRoom.host}
        members={dmRoom.members}
        messages={dmRoom.messages}
        roomId={dmId}
        viewerUserId={session.user.id}
      />
    );
  }

  const recovery = await getDmCampfireRecoveryForViewer({
    dmId,
    viewerId: session.user.id,
  });

  if (recovery?.isBurnedOutTemporary) {
    return (
      <DmCampfireRecoveryPanel campfireName={recovery.campfireName} dmId={dmId} />
    );
  }

  // Default product behavior is to hide inaccessible private DMs behind a 404.
  notFound();
}
