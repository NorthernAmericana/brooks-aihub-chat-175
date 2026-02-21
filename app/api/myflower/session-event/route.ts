import type { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { myflowerSessionEvents } from "@/lib/db/schema";
import {
  SessionEventSchemaV1_0,
  type SessionEventV1_0,
} from "@/lib/validation/session-event-schema";

function buildSessionEventResponse(event: {
  id: string;
  occurredAt: Date;
  schemaVersion: string;
  exposure: unknown;
  context: unknown;
  outcomes: unknown;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    id: event.id,
    occurred_at: event.occurredAt.toISOString(),
    schema_version: event.schemaVersion,
    exposure: event.exposure,
    context: event.context,
    outcomes: event.outcomes,
    notes: event.notes,
    created_at: event.createdAt.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const parsed = SessionEventSchemaV1_0.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid session_event payload",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const payload: SessionEventV1_0 = parsed.data;

    const [event] = await db
      .insert(myflowerSessionEvents)
      .values({
        userId: session.user.id,
        occurredAt: new Date(payload.occurred_at),
        schemaVersion: payload.schema_version,
        exposure: payload.exposure,
        context: payload.context,
        outcomes: payload.outcomes,
        notes: payload.notes ?? null,
      })
      .returning();

    if (!event) {
      return NextResponse.json(
        { error: "Failed to create session_event" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { session_event: buildSessionEventResponse(event) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create myflower session_event", error);
    return NextResponse.json(
      { error: "Failed to create session_event" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const events = await db
      .select()
      .from(myflowerSessionEvents)
      .where(eq(myflowerSessionEvents.userId, session.user.id))
      .orderBy(desc(myflowerSessionEvents.occurredAt))
      .limit(50);

    return NextResponse.json({
      session_events: events.map((event) => buildSessionEventResponse(event)),
    });
  } catch (error) {
    console.error("Failed to load myflower session_events", error);
    return NextResponse.json(
      { error: "Failed to load session_events" },
      { status: 500 },
    );
  }
}
