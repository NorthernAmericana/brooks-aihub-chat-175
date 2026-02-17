import "server-only";

export const SERVER_FOUNDERS_STRIPE_PRICE_ID =
  process.env.STRIPE_FOUNDERS_PRICE_ID ||
  process.env.NEXT_PUBLIC_FOUNDERS_STRIPE_PRICE_ID ||
  "";
