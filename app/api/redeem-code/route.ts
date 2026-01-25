import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createEntitlement,
  getRedemptionCodeByCode,
  hasRedeemedCode,
  incrementCodeRedemptionCount,
  redeemCode,
} from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Find the redemption code
    const redemptionCode = await getRedemptionCodeByCode({ code: code.trim() });

    if (!redemptionCode) {
      return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    }

    // Check if code is active
    if (!redemptionCode.isActive) {
      return NextResponse.json(
        { error: "This code is no longer active" },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (
      redemptionCode.expiresAt &&
      new Date(redemptionCode.expiresAt) < new Date()
    ) {
      return NextResponse.json(
        { error: "This code has expired" },
        { status: 400 }
      );
    }

    // Check if user has already redeemed this code
    const alreadyRedeemed = await hasRedeemedCode({
      codeId: redemptionCode.id,
      userId: session.user.id,
    });

    if (alreadyRedeemed) {
      return NextResponse.json(
        { error: "You have already redeemed this code" },
        { status: 400 }
      );
    }

    // Check max redemptions
    const maxRedemptions = redemptionCode.maxRedemptions;
    const currentRedemptions = Number.parseInt(
      redemptionCode.redemptionCount || "0",
      10
    );

    if (maxRedemptions !== "unlimited") {
      const max = Number.parseInt(maxRedemptions || "1", 10);
      if (currentRedemptions >= max) {
        return NextResponse.json(
          { error: "This code has reached its maximum number of redemptions" },
          { status: 400 }
        );
      }
    }

    // Redeem the code
    await redeemCode({
      codeId: redemptionCode.id,
      userId: session.user.id,
    });

    // Increment redemption count
    await incrementCodeRedemptionCount({ codeId: redemptionCode.id });

    // Grant the entitlement
    await createEntitlement({
      userId: session.user.id,
      productId: redemptionCode.productId,
      grantedBy: "redemption_code",
      metadata: {
        ...(redemptionCode.metadata ?? {}),
        code: redemptionCode.code,
        codeId: redemptionCode.id,
      },
    });

    return NextResponse.json({
      success: true,
      productId: redemptionCode.productId,
      message: "Code redeemed successfully",
    });
  } catch (error) {
    console.error("Error redeeming code:", error);
    return NextResponse.json(
      { error: "Failed to redeem code" },
      { status: 500 }
    );
  }
}
