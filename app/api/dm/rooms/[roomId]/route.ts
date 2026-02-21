import { NextResponse } from "next/server";
import {
  getDmRoomCapacitySnapshot,
  getDmRoomMemberCount,
  getDmRoomMessageCount,
  listDmRoomMembers,
  loadDmRoomByIdForMember,
} from "@/lib/db/dm-queries";
import {
  DM_MESSAGE_BODY_MAX_LENGTH,
  DM_MESSAGE_PAGE_LIMIT_DEFAULT,
  DM_MESSAGE_PAGE_LIMIT_MAX,
  getDmDisplayNameForUserId,
  requireAuthUserId,
  requireRoomMembership,
} from "@/lib/dm/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;

  const authResult = await requireAuthUserId();
  if (authResult.response) {
    return authResult.response;
  }

  const memberResult = await requireRoomMembership(roomId, authResult.userId);
  if (memberResult.response) {
    return memberResult.response;
  }

  const [room, members, memberCount, messageCount, capacity] =
    await Promise.all([
      loadDmRoomByIdForMember({ roomId, userId: authResult.userId }),
      listDmRoomMembers(roomId),
      getDmRoomMemberCount(roomId),
      getDmRoomMessageCount(roomId),
      getDmRoomCapacitySnapshot(roomId),
    ]);

  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const roomMemberLimit = capacity?.memberLimit ?? 4;

  return NextResponse.json({
    room: {
      id: room.id,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      createdByUserId: room.createdByUserId,
    },
    members: members.map((member) => ({
      membershipId: member.membershipId,
      userId: member.userId,
      joinedAt: member.joinedAt,
      author: {
        id: member.userId,
        displayName: getDmDisplayNameForUserId(member.userId),
        avatarUrl: member.avatarUrl,
      },
    })),
    counts: {
      members: memberCount,
      messages: messageCount,
    },
    limits: {
      members: roomMemberLimit,
      messageBodyMaxLength: DM_MESSAGE_BODY_MAX_LENGTH,
      messagePageDefaultLimit: DM_MESSAGE_PAGE_LIMIT_DEFAULT,
      messagePageMaxLimit: DM_MESSAGE_PAGE_LIMIT_MAX,
    },
  });
}
