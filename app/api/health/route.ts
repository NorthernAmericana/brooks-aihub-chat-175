import { NextResponse } from "next/server";
import packageJson from "@/package.json";

export async function GET() {
  const uptimeSeconds = process.uptime();

  return NextResponse.json({
    status: "ok",
    uptime: uptimeSeconds,
    version: packageJson.version,
    timestamp: new Date().toISOString(),
  });
}
