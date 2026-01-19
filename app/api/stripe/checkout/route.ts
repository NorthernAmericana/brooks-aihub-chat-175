import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/app/(auth)/auth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const foundersEditionPriceId = process.env.STRIPE_FOUNDERS_EDITION_PRICE_ID;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

export async function POST(request: Request) {
  if (!stripe || !stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  if (!foundersEditionPriceId) {
    return NextResponse.json(
      { error: "Founders Edition price is not configured." },
      { status: 500 }
    );
  }

  const session = await auth();
  const body = await request.json().catch(() => ({}));

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    (request.headers.get("host")
      ? `https://${request.headers.get("host")}`
      : null);

  if (!origin) {
    return NextResponse.json(
      { error: "Unable to determine site URL." },
      { status: 400 }
    );
  }

  const successUrl =
    process.env.STRIPE_SUCCESS_URL ?? new URL("/?checkout=success", origin).href;
  const cancelUrl =
    process.env.STRIPE_CANCEL_URL ?? new URL("/?checkout=cancel", origin).href;

  const clientReferenceId =
    session?.user?.id ?? body?.clientReferenceId ?? "anonymous";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: foundersEditionPriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: clientReferenceId,
  });

  return NextResponse.json({
    id: checkoutSession.id,
    url: checkoutSession.url,
  });
}
