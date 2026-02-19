import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { namcInstallGateState } from "@/lib/db/schema";
import {
  isNamcInstallVerificationStatus,
  type NamcInstallVerificationStatus,
} from "@/lib/store/namcInstallVerification";
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
  let verificationStatus: NamcInstallVerificationStatus = "unknown";
  let verificationMethod: string | null = null;
  let verificationCheckedAt: Date | null = null;
  let verificationDetails: Record<string, unknown> | null = null;

  try {
    const body = (await request.json()) as {
      status?: unknown;
      verificationStatus?: unknown;
      verificationMethod?: unknown;
      verificationCheckedAt?: unknown;
      verificationDetails?: unknown;
    };
    if (body.status !== undefined) {
      if (!isInstallGateStatus(body.status)) {
        return NextResponse.json(
          { error: "Invalid status. Expected 'opened' or 'completed'." },
          { status: 400 }
        );
      }
      status = body.status;
    }

    if (body.verificationStatus !== undefined) {
      if (!isNamcInstallVerificationStatus(body.verificationStatus)) {
        return NextResponse.json(
          {
            error:
              "Invalid verificationStatus. Expected 'installed', 'unknown', or 'needs-recheck'.",
          },
          { status: 400 }
        );
      }
      verificationStatus = body.verificationStatus;
    }

    if (typeof body.verificationMethod === "string") {
      verificationMethod = body.verificationMethod.slice(0, 120);
    }

    if (typeof body.verificationCheckedAt === "string") {
      const parsed = new Date(body.verificationCheckedAt);
      if (!Number.isNaN(parsed.getTime())) {
        verificationCheckedAt = parsed;
      }
    }

    if (
      body.verificationDetails &&
      typeof body.verificationDetails === "object" &&
      !Array.isArray(body.verificationDetails)
    ) {
      verificationDetails = body.verificationDetails as Record<string, unknown>;
    }
  } catch {
    // Ignore invalid/missing JSON and default to "opened".
  }

  const now = new Date();

  const conflictSet: {
    openedAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    verificationStatus: NamcInstallVerificationStatus;
    verificationMethod: string | null;
    verificationCheckedAt: Date | null;
    verificationDetails: Record<string, unknown> | null;
  } = {
    openedAt: now,
    updatedAt: now,
    verificationStatus,
    verificationMethod,
    verificationCheckedAt,
    verificationDetails,
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
      verificationStatus,
      verificationMethod,
      verificationCheckedAt,
      verificationDetails,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [namcInstallGateState.userId],
      set: conflictSet,
    });

  return NextResponse.json({ ok: true });
}
