import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const foundersEditionPriceId = process.env.STRIPE_FOUNDERS_EDITION_PRICE_ID;

export async function POST(request: Request) {
  if (!stripeSecretKey) {
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

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("client_reference_id", clientReferenceId);
  params.set("line_items[0][price]", foundersEditionPriceId);
  params.set("line_items[0][quantity]", "1");

  const stripeResponse = await fetch(
    "https://api.stripe.com/v1/checkout/sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!stripeResponse.ok) {
    const errorText = await stripeResponse.text();
    return NextResponse.json(
      { error: "Failed to create checkout session.", details: errorText },
      { status: stripeResponse.status }
    );
  }

  const checkoutSession = (await stripeResponse.json()) as {
    id: string;
    url: string | null;
  };

  return NextResponse.json({
    id: checkoutSession.id,
    url: checkoutSession.url,
  });
}
