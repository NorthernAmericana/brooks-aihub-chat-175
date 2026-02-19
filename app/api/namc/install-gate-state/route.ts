import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { namcInstallGateState } from "@/lib/db/schema";
import { NextResponse } from "next/server";

type InstallGateStatus = "opened" | "completed";

function isInstallGateStatus(value: unknown): value is InstallGateStatus {
  return value === "opened" || value === "completed";
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let status: InstallGateStatus = "opened";

  try {
    const body = (await request.json()) as { status?: unknown };
    if (body.status !== undefined) {
      if (!isInstallGateStatus(body.status)) {
        return NextResponse.json(
          { error: "Invalid status. Expected 'opened' or 'completed'." },
          { status: 400 }
        );
      }
      status = body.status;
    }
  } catch {
    // Ignore invalid/missing JSON and default to "opened".
  }

  const now = new Date();

  const conflictSet: {
    openedAt: Date;
    updatedAt: Date;
    completedAt?: Date;
  } = {
    openedAt: now,
    updatedAt: now,
  };

  if (status === "completed") {
    conflictSet.completedAt = now;
  }

  await db
    .insert(namcInstallGateState)
    .values({
      userId: session.user.id,
      openedAt: now,
      completedAt: status === "completed" ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [namcInstallGateState.userId],
      set: conflictSet,
    });

  return NextResponse.json({ ok: true });
}
