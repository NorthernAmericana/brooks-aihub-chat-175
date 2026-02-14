import { type NextRequest, NextResponse } from "next/server";

import {
  expireTempCampfires,
  pruneRollingWindowBacklog,
} from "@/lib/commons/maintenance";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authorizationHeader = request.headers.get("authorization");
  if (authorizationHeader === `Bearer ${secret}`) {
    return true;
  }

  const cronSecretHeader = request.headers.get("x-cron-secret");
  if (cronSecretHeader === secret) {
    return true;
  }

  return false;
}

async function handleCronMaintenance(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startedAt = new Date().toISOString();

    const [expiredTempCampfires, rollingWindowBacklog] = await Promise.all([
      expireTempCampfires(),
      pruneRollingWindowBacklog(),
    ]);

    return NextResponse.json({
      ok: true,
      startedAt,
      completedAt: new Date().toISOString(),
      expiredTempCampfires,
      rollingWindowBacklog,
    });
  } catch (error) {
    console.error("commons-maintenance cron failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Commons maintenance failed",
        completedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export function POST(request: NextRequest) {
  return handleCronMaintenance(request);
}

export function GET(request: NextRequest) {
  return handleCronMaintenance(request);
}
