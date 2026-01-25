import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { updateEntitlementProgress } from "@/lib/db/queries";
import { PRODUCT_IDS } from "@/lib/entitlements/products";

const allowedProducts = new Set<string>([
  PRODUCT_IDS.MDD_GAME_BASE,
  PRODUCT_IDS.MDD_NOVEL_BASE,
]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const productId = body?.productId;
    const progress = body?.progress;

    if (typeof productId !== "string" || !allowedProducts.has(productId)) {
      return NextResponse.json(
        { error: "Invalid productId" },
        { status: 400 }
      );
    }

    if (!progress || typeof progress !== "object") {
      return NextResponse.json(
        { error: "Invalid progress payload" },
        { status: 400 }
      );
    }

    await updateEntitlementProgress({
      userId: session.user.id,
      productId,
      progress,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error syncing progress:", error);
    return NextResponse.json(
      { error: "Failed to sync progress" },
      { status: 500 }
    );
  }
}
