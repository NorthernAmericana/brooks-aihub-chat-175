import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteApprovedMemoriesByUserId,
  deleteApprovedMemoriesByUserIdInRange,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

type DeletePayload = {
  startDate?: string;
  endDate?: string;
};

const parseDate = (value: string, isEnd: boolean) => {
  const suffix = isEnd ? "T23:59:59.999Z" : "T00:00:00.000Z";
  return new Date(`${value}${suffix}`);
};

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: DeletePayload = {};

  try {
    payload = await request.json();
  } catch (_error) {
    payload = {};
  }

  const { startDate, endDate } = payload;

  if ((startDate && !endDate) || (!startDate && endDate)) {
    return NextResponse.json(
      { error: "Start and end dates must be provided together." },
      { status: 400 }
    );
  }

  if (startDate && endDate) {
    const parsedStart = parseDate(startDate, false);
    const parsedEnd = parseDate(endDate, true);

    if (
      Number.isNaN(parsedStart.getTime()) ||
      Number.isNaN(parsedEnd.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid date range." },
        { status: 400 }
      );
    }

    if (parsedStart > parsedEnd) {
      return NextResponse.json(
        { error: "Start date must be before end date." },
        { status: 400 }
      );
    }

    const result = await deleteApprovedMemoriesByUserIdInRange({
      userId: session.user.id,
      startDate: parsedStart,
      endDate: parsedEnd,
    });

    return NextResponse.json(result);
  }

  const result = await deleteApprovedMemoriesByUserId({
    userId: session.user.id,
  });

  return NextResponse.json(result);
}
