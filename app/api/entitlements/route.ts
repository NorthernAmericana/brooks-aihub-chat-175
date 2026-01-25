import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserById, getUserEntitlements } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId");

    // Users can only fetch their own entitlements
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await getUserById({ id: session.user.id });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const entitlements = await getUserEntitlements({ userId: session.user.id });

    return NextResponse.json({
      foundersAccess: user.foundersAccess || false,
      products: entitlements.map((e) => e.productId),
    });
  } catch (error) {
    console.error("Error fetching entitlements:", error);
    return NextResponse.json(
      { error: "Failed to fetch entitlements" },
      { status: 500 }
    );
  }
}
