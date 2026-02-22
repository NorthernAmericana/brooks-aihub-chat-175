import type { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { myflowerSessionEvents } from "@/lib/db/schema";
import { assessSessionEventSafety } from "@/lib/myflowerai/session-event-safety";
import { buildSessionEventTrendReport } from "@/lib/myflowerai/session-event-trends";
import {
  SessionEventSchemaV1_0,
  type SessionEventV1_0,
} from "@/lib/validation/session-event-schema";

function buildSessionEventResponse(event: {
  id: string;
  occurredAt: Date;
  createdAt: Date;
  payload: SessionEventV1_0;
}) {
  const safetyAssessment = assessSessionEventSafety(event.payload);

  return {
    id: event.id,
    occurred_at: event.occurredAt.toISOString(),
    schema_version: event.payload.schema_version,
    exposure: event.payload.exposure,
    context: event.payload.context,
    expectancy: event.payload.expectancy ?? null,
    outcomes: event.payload.outcomes,
    notes: event.payload.notes ?? null,
    created_at: event.createdAt.toISOString(),
    safety: {
      flagged: safetyAssessment.safetyFlag,
      reasons: safetyAssessment.reasons,
      response_policy: safetyAssessment.selectedPolicy,
      guidance: safetyAssessment.guidance,
      audit: {
        safety_flag_fired: safetyAssessment.audit.safetyFlagFired,
        trigger_reason_codes: safetyAssessment.audit.triggerReasonCodes,
        selected_policy: safetyAssessment.audit.selectedPolicy,
        suppressed_advice_category:
          safetyAssessment.audit.suppressedAdviceCategory,
      },
    },
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
        expectancy: payload.expectancy ?? {},
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
      {
        session_event: buildSessionEventResponse({
          id: event.id,
          occurredAt: event.occurredAt,
          createdAt: event.createdAt,
          payload,
        }),
      },
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

    const parsedEvents = events.flatMap((event) => {
      const parsed = SessionEventSchemaV1_0.safeParse({
        schema_version: event.schemaVersion,
        occurred_at: event.occurredAt.toISOString(),
        exposure: event.exposure,
        context: event.context,
        expectancy:
          event.expectancy &&
          Object.keys(event.expectancy as Record<string, unknown>).length > 0
            ? event.expectancy
            : undefined,
        outcomes: event.outcomes,
        notes: event.notes ?? undefined,
      });

      if (!parsed.success) {
        return [];
      }

      return [
        buildSessionEventResponse({
          id: event.id,
          occurredAt: event.occurredAt,
          createdAt: event.createdAt,
          payload: parsed.data,
        }),
      ];
    });

    return NextResponse.json({
      session_events: parsedEvents,
      trend_summary: buildSessionEventTrendReport(
        parsedEvents.map((event) => ({
          schema_version: event.schema_version,
          occurred_at: event.occurred_at,
          exposure: event.exposure,
          context: event.context,
          expectancy: event.expectancy ?? undefined,
          outcomes: event.outcomes,
          notes: event.notes ?? undefined,
        })),
      ),
    });
  } catch (error) {
    console.error("Failed to load myflower session_events", error);
    return NextResponse.json(
      { error: "Failed to load session_events" },
      { status: 500 },
    );
  }
}
