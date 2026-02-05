import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/app/(auth)/auth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-12-15.clover",
});

const AVATAR_ADDON_PRICE_ID =
  process.env.STRIPE_AVATAR_ADDON_PRICE_ID ?? "price_avatar_addon_placeholder";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: AVATAR_ADDON_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/create-ato?avatar=1&purchase=success`,
      cancel_url: `${request.nextUrl.origin}/create-ato/onboarding?purchase=canceled`,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        productType: "avatar_addon",
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Stripe avatar addon checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
