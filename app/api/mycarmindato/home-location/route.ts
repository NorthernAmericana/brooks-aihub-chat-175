import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createHomeLocationRecord,
  getChatsByUserId,
  getHomeLocationByUserId,
} from "@/lib/db/queries";

const MY_CAR_MIND_ROUTE = "/MyCarMindATO/";
const MY_CAR_MIND_ROUTE_KEYS = new Set([
  "my-car-mind",
  "my-car-mind-driver",
  "my-car-mind-trucker",
  "my-car-mind-delivery-driver",
  "my-car-mind-traveler",
]);

// Force dynamic rendering to prevent prerendering issues with auth()
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { chats } = await getChatsByUserId({
    id: session.user.id,
    limit: 50,
    startingAfter: null,
    endingBefore: null,
  });

  const candidateChats = chats.filter(
    (chat) => chat.routeKey && MY_CAR_MIND_ROUTE_KEYS.has(chat.routeKey)
  );

  for (const chat of candidateChats) {
    const homeLocation = await getHomeLocationByUserId({
      userId: session.user.id,
      chatId: chat.id,
      route: MY_CAR_MIND_ROUTE,
    });

    if (homeLocation) {
      return NextResponse.json({
        homeLocation: {
          rawText: homeLocation.rawText,
          normalizedText: homeLocation.normalizedText,
          updatedAt: homeLocation.updatedAt?.toISOString() ?? null,
        },
      });
    }
  }

  return NextResponse.json({ homeLocation: null });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    rawText?: string;
    normalizedText?: string | null;
  };

  if (!body.rawText?.trim()) {
    return NextResponse.json(
      { error: "Home location is required." },
      { status: 400 }
    );
  }

  const { chats } = await getChatsByUserId({
    id: session.user.id,
    limit: 50,
    startingAfter: null,
    endingBefore: null,
  });

  const candidateChat = chats.find(
    (chat) => chat.routeKey && MY_CAR_MIND_ROUTE_KEYS.has(chat.routeKey)
  );

  if (!candidateChat) {
    return NextResponse.json(
      { error: "Start a MyCarMindATO chat to save a home location." },
      { status: 400 }
    );
  }

  const record = await createHomeLocationRecord({
    ownerId: session.user.id,
    chatId: candidateChat.id,
    route: MY_CAR_MIND_ROUTE,
    rawText: body.rawText.trim(),
    normalizedText: body.normalizedText?.trim() ?? null,
  });

  return NextResponse.json({
    homeLocation: {
      rawText: record.rawText,
      normalizedText: record.normalizedText,
      updatedAt: record.updatedAt?.toISOString() ?? null,
    },
  });
}
