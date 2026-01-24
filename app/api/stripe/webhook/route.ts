import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createEntitlement,
  getUserById,
  updateUserStripeInfo,
} from "@/lib/db/queries";
import { PRODUCT_IDS } from "@/lib/entitlements/products";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-01-27.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id;

  if (!userId) {
    console.error("No userId found in checkout session");
    return;
  }

  // Update user with Stripe customer ID
  if (session.customer) {
    await updateUserStripeInfo({
      userId,
      stripeCustomerId: session.customer as string,
    });
  }

  // If this is a subscription, handle it
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    await handleSubscriptionChange(subscription);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("No userId found in subscription metadata");
    return;
  }

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  // Update user with subscription info and founders access
  await updateUserStripeInfo({
    userId,
    stripeSubscriptionId: subscription.id,
    foundersAccess: isActive,
  });

  // Grant founders access entitlement if active
  if (isActive) {
    const user = await getUserById({ id: userId });
    if (user) {
      // Check if entitlement already exists to avoid duplicates
      try {
        await createEntitlement({
          userId,
          productId: PRODUCT_IDS.FOUNDERS_ACCESS,
          grantedBy: "stripe",
          metadata: {
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
          },
        });
      } catch (_error) {
        // Entitlement might already exist, that's okay
        console.log("Entitlement creation skipped (may already exist)");
      }
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("No userId found in subscription metadata");
    return;
  }

  // Remove founders access
  await updateUserStripeInfo({
    userId,
    foundersAccess: false,
  });
}
