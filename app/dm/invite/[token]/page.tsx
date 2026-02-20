import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import {
  acceptDmRoomInvite,
  addDmRoomMemberIfMissing,
  getDmRoomCapacitySnapshot,
  getDmRoomInviteByTokenHash,
} from "@/lib/db/dm-queries";
import { dmRoomMembers } from "@/lib/db/schema";
import { hashDmInviteToken } from "@/lib/dm/invite-token";

export default async function DmInviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const nextPath = `/dm/invite/${token}`;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const userEmail = session.user.email?.trim().toLowerCase();
  const invite = await getDmRoomInviteByTokenHash(hashDmInviteToken(token));
  if (!invite) {
    redirect("/commons/dm");
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    redirect("/commons/dm");
  }

  if (userEmail !== invite.targetEmail.toLowerCase()) {
    redirect("/commons/dm");
  }

  if (
    invite.acceptedAt &&
    invite.acceptedByUserId &&
    invite.acceptedByUserId !== session.user.id
  ) {
    redirect("/commons/dm");
  }

  const [membership] = await db
    .select({ id: dmRoomMembers.id })
    .from(dmRoomMembers)
    .where(
      and(
        eq(dmRoomMembers.roomId, invite.roomId),
        eq(dmRoomMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (!membership) {
    const capacity = await getDmRoomCapacitySnapshot(invite.roomId);
    if (!capacity || capacity.memberCount >= capacity.memberLimit) {
      redirect("/commons/dm");
    }

    await addDmRoomMemberIfMissing({
      roomId: invite.roomId,
      userId: session.user.id,
    });
  }

  if (!invite.acceptedAt) {
    await acceptDmRoomInvite({
      inviteId: invite.id,
      acceptedByUserId: session.user.id,
    });
  }

  redirect(`/dm/rooms/${invite.roomId}`);
}
