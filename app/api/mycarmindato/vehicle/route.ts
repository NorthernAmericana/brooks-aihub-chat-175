import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getCurrentVehicleByUserIdAndRoute } from "@/lib/db/queries";

const MY_CAR_MIND_ROUTE = "/MyCarMindATO/";

// Force dynamic rendering to prevent prerendering issues with auth()
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const vehicle = await getCurrentVehicleByUserIdAndRoute({
    userId: session.user.id,
    route: MY_CAR_MIND_ROUTE,
  });

  if (!vehicle) {
    return NextResponse.json({ vehicle: null });
  }

  return NextResponse.json({
    vehicle: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      updatedAt: vehicle.updatedAt?.toISOString() ?? null,
    },
  });
}
