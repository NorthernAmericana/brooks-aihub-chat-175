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

const FOUNDERS_ACCESS_PRICE_ID = "price_1SpBht050iAre6ZtPyv42z6s";

// Force dynamic rendering to prevent prerendering issues with auth()
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await request.json();

    // Validate price ID
    if (priceId !== FOUNDERS_ACCESS_PRICE_ID) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/brooks-ai-hub?success=true`,
      cancel_url: `${request.nextUrl.origin}/?canceled=true`,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        productType: "founders_access",
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          productType: "founders_access",
        },
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
