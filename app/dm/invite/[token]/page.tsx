import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import {
  acceptDmInviteMembershipAtomically,
  getDmRoomInviteByTokenHash,
} from "@/lib/db/dm-queries";
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

  const result = await acceptDmInviteMembershipAtomically({
    inviteId: invite.id,
    roomId: invite.roomId,
    userId: session.user.id,
  });

  if (!result.ok) {
    redirect("/commons/dm");
  }

  redirect(`/dm/rooms/${invite.roomId}`);
}
