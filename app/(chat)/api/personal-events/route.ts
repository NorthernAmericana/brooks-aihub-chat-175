import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getApprovedMemoriesByUserIdPage } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

type PersonalEvent = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  route: string | null;
};

const EVENT_DATE_PREFIX = "event-date:";
const EVENT_TIME_PREFIX = "event-time:";

const parseEventDate = (tags: string[]) => {
  const eventDateTag = tags.find((tag) => tag.startsWith(EVENT_DATE_PREFIX));
  if (!eventDateTag) {
    return null;
  }

  const date = eventDateTag.slice(EVENT_DATE_PREFIX.length).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
};

const parseEventTime = (tags: string[]) => {
  const eventTimeTag = tags.find((tag) => tag.startsWith(EVENT_TIME_PREFIX));
  if (!eventTimeTag) {
    return null;
  }

  const time = eventTimeTag.slice(EVENT_TIME_PREFIX.length).trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : null;
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pageSize = 50;
  let nextCursor: number | null = 0;
  const allRows: Awaited<
    ReturnType<typeof getApprovedMemoriesByUserIdPage>
  >["rows"] = [];

  while (nextCursor !== null) {
    const page = await getApprovedMemoriesByUserIdPage({
      userId: session.user.id,
      limit: pageSize,
      offset: nextCursor,
    });

    allRows.push(...page.rows);
    nextCursor = page.nextCursor;
  }

  const personalEvents: PersonalEvent[] = allRows
    .filter((memory) => memory.tags.includes("personal-event"))
    .map((memory) => {
      const date = parseEventDate(memory.tags);
      if (!date) {
        return null;
      }

      return {
        id: memory.id,
        title: memory.rawText,
        date,
        time: parseEventTime(memory.tags),
        route: memory.route,
      };
    })
    .filter((event): event is PersonalEvent => Boolean(event));

  return NextResponse.json({ rows: personalEvents });
}
