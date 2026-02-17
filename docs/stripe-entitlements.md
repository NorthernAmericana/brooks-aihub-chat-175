# Stripe Integration, Entitlements, and Founders Access

This document describes the implementation plan and architecture for Stripe payments, webhook handling, entitlement management, Founders Access, and code redemption in Brooks AI HUB.

## Table of Contents

- [Overview](#overview)
- [Stripe Integration](#stripe-integration)
  - [Checkout Flow](#checkout-flow)
  - [Webhook Handling](#webhook-handling)
- [Entitlement System](#entitlement-system)
  - [Product IDs](#product-ids)
  - [Entitlement Storage](#entitlement-storage)
  - [Checking Entitlements](#checking-entitlements)
- [Founders Access](#founders-access)
  - [Pricing](#pricing)
  - [Perks](#perks)
  - [UI Indicators](#ui-indicators)
- [Code Redemption](#code-redemption)
- [Developer Notes](#developer-notes)
  - [Known Issues](#known-issues)
- [Configuration](#configuration)
- [Future Enhancements](#future-enhancements)

## Overview

Brooks AI HUB implements a monetization and entitlement system using Stripe for payments and subscriptions. The system supports:

- **Founders Access**: A paid subscription tier at $4.99/month
- **Entitlements**: Product-based access control for game, novel, and spoiler content
- **Code Redemption**: Ability to grant entitlements via redemption codes

The app remains in development mode but is usable for real client testing with actual payments.

## Stripe Integration

### Checkout Flow

1. User clicks "Join Founder's Access for $4.99" button on the landing page
2. System creates a Stripe Checkout session with:
   - Price ID: use `STRIPE_FOUNDERS_PRICE_ID` (mirror to `NEXT_PUBLIC_FOUNDERS_STRIPE_PRICE_ID` if client needs to pass the ID)
   - Mode: subscription
   - Success URL: `/brooks-ai-hub?success=true`
   - Cancel URL: `/?canceled=true`
3. User is redirected to Stripe's hosted checkout page
4. On successful payment, Stripe redirects back and sends webhook events
5. Webhook handler processes the subscription and grants Founders Access

**API Endpoint**: `POST /api/stripe/checkout`

**Required Authentication**: User must be signed in

### Webhook Handling

The webhook endpoint (`POST /api/stripe/webhook`) handles the following Stripe events:

- `checkout.session.completed`: Initial checkout completion
- `customer.subscription.created`: New subscription created
- `customer.subscription.updated`: Subscription status changed
- `customer.subscription.deleted`: Subscription cancelled

**Webhook Signature Verification**: All webhooks are verified using the `STRIPE_WEBHOOK_SECRET` to ensure they come from Stripe.

**Actions on Subscription Events**:
- Updates user record with Stripe customer ID and subscription ID
- Grants or revokes Founders Access based on subscription status
- Creates entitlement record in database

**Important**: Webhooks must be configured in the Stripe Dashboard to point to `https://your-domain.com/api/stripe/webhook`

## Entitlement System

### Product IDs

The system defines the following product entitlements:

```typescript
PRODUCT_IDS = {
  MDD_GAME_BASE: "MDD-GAME_BASE",      // Base game access
  MDD_NOVEL_BASE: "MDD_NOVEL_BASE",    // Novel access
  MDD_SPOILER_PASS: "MDD_SPOILER_PASS", // Spoiler content access
  FOUNDERS_ACCESS: "FOUNDERS_ACCESS",   // Founders Access subscription
}
```

### Entitlement Storage

Entitlements are stored in the `Entitlement` table with:
- `userId`: User who owns the entitlement
- `productId`: Which product is granted
- `grantedAt`: When the entitlement was granted
- `grantedBy`: How it was granted (stripe, redemption_code, admin, etc.)
- `expiresAt`: Optional expiration date
- `metadata`: Additional data (subscription ID, etc.)

### Checking Entitlements

**API Endpoint**: `GET /api/entitlements?userId={userId}`

Returns:
```json
{
  "foundersAccess": true,
  "products": ["FOUNDERS_ACCESS", "MDD-GAME_BASE"]
}
```

**Client-side Hook**: `useEntitlements(userId)`

```typescript
const { entitlements, loading, error, refetch } = useEntitlements(user.id);
```

## Founders Access

### Pricing

- **Price**: $4.99/month (USD)
- **Stripe Price ID**: configured via `STRIPE_FOUNDERS_PRICE_ID` (and optional `NEXT_PUBLIC_FOUNDERS_STRIPE_PRICE_ID` for client checkout payloads)
- **Billing**: Monthly recurring subscription
- **Payment Methods**: Credit/debit cards via Stripe

### Early Release phase alignment

- Early Release launch is defined as **April 10, 2026 at 00:00 America/Chicago**.
- Launch config is centralized in code and environment variables; see [`docs/launch/early-release-apr-10-2026.md`](./launch/early-release-apr-10-2026.md).
- Pricing/UI copy must continue to show only **Free + Founders ($4.99/month)** until a future tier release is explicitly shipped.

### Perks

Founders Access unlocks the following concrete benefits:

- **Premium ATO routes**: Founders-only ATO routes and premium apps in the store.
- **Higher ATO creation quota**: Create up to 10 unofficial ATOs each month.
- **More file and image uploads**: Upload up to 10 files per ATO and up to 10 images per chat message.
- **Longer instruction limits**: Draft up to 999 instruction characters per ATO.
- **Avatar pairing at setup**: Pair custom ATOs with avatars during creation.

These perks are enforced by entitlement checks in the app and are surfaced in the UI.

### What users get immediately this month

When Stripe marks the subscription active and entitlement sync completes, users can immediately:

- Access Founders-only routes in NAMC/HUB experiences that are marked with Founders gating.
- Create unofficial ATOs up to the Founders monthly limit (10/month) instead of the Free cap (3 total).
- Use higher composition and upload limits (999 instructions, 10 files per ATO, 10 images per chat message).
- Enable avatar pairing during ATO setup.

There is no separate seasonal unlock process for these current perks.

### Plan limits (Free vs Founders)

| Capability | Free | Founders |
| --- | --- | --- |
| Unofficial ATO creation | Up to 3 total | Up to 10 per month |
| Instruction length | Up to 500 chars | Up to 999 chars |
| Avatar pairing at setup | Not available | Available |
| Files per ATO | Up to 5 | Up to 10 |
| Images per chat message | Up to 5 | Up to 10 |
| Founders-gated NAMC/HUB routes | Locked | Unlocked |

### Practical meaning of NAMC/HUB ecosystem access

"NAMC/HUB ecosystem access" means practical, in-product route access:

- Some app routes are explicitly marked as Founders-only in NAMC and HUB-related experiences.
- Founders members can enter and use those routes.
- Free users can still use non-Founders routes and will see lock/upgrade messaging on gated routes.

### Not included yet

Founders Access currently does **not** include:

- Community-only spaces/features (planned, not shipped).
- Admin UI for code generation (code creation remains script/admin-driven).
- Any roadmap feature that is not already listed as Live in product/readiness docs.

Pricing and upgrade copy should avoid promising unshipped features.

### Pricing page FAQ policy (source of truth)

The in-app pricing FAQ should stay aligned to this document and answer, at minimum:

1. What unlocks immediately this month.
2. What differs by plan limits/perks.
3. What NAMC/HUB ecosystem access means in practical terms.
4. What is not included yet.

### UI Indicators

Founders benefits show up in the product experience in a few places:

- **Pricing page**: A Founders perks section lists every perk included in the subscription.
- **Greeting dashboard**: Founders perks card shows active/locked status and a CTA to upgrade.
- **ATO store details**: Founders-required apps include a banner that lists perks for locked users and confirms perks for active members.

## Code Redemption

Users can redeem codes to unlock entitlements without payment.

### UI Access

1. Open the sidebar user dropdown menu (click on user avatar/email)
2. Select "Input code" (appears above "Toggle dark mode")
3. Enter redemption code in the dialog
4. Click "Redeem" to apply the code

### API Endpoint

**Endpoint**: `POST /api/redeem-code`

**Request Body**:
```json
{
  "code": "YOUR-CODE-HERE"
}
```

**Response**:
```json
{
  "success": true,
  "productId": "MDD-GAME_BASE",
  "message": "Code redeemed successfully"
}
```

### Code Properties

Redemption codes support:
- **Max Redemptions**: Single-use, multi-use, or unlimited
- **Expiration**: Optional expiration date
- **Product**: Which entitlement to grant
- **Active Status**: Can be deactivated
- **Metadata**: Custom data storage

### Creating Codes

Codes can be created via database query:

```typescript
await createRedemptionCode({
  code: "SPECIAL-CODE-123",
  productId: "MDD-GAME_BASE",
  maxRedemptions: "unlimited",
  expiresAt: new Date("2026-12-31"),
});
```

**Note**: Admin UI for code generation is not yet implemented. Codes must be created via database scripts or admin panel (to be built).

## Developer Notes

### Known Issues

**⚠️ The following features are currently broken and need fixing:**

1. **Whisper (Mic Transcription)**
   - Speech-to-text transcription is not functioning
   - Users cannot dictate messages via microphone
   - Issue affects the STT (speech-to-text) API endpoint

2. **Voice Selection**
   - Voice selection UI may not properly update
   - Voice preferences may not persist correctly
   - Related to TTS (text-to-speech) settings

3. **ElevenLabs Audio Playback**
   - TTS audio playback using ElevenLabs is experiencing issues
   - Audio may not play or may have quality/timing problems
   - Check ElevenLabs API integration and audio streaming

**These notes should be removed once the issues are fixed.**

## Configuration

### Environment Variables

Required environment variables (add to `.env.local`):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database Migration

Run the migration to create the necessary tables:

```bash
pnpm db:migrate
```

This creates:
- `Entitlement` table
- `RedemptionCode` table
- `Redemption` table
- Adds Stripe fields to `User` table

### Stripe Setup

1. **Create Product and Price**:
   - Log in to Stripe Dashboard
   - Create a product for "Founders Access"
   - Create a recurring price of $4.99/month
   - Note the price ID value and set it in `STRIPE_FOUNDERS_PRICE_ID`

2. **Configure Webhook**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

3. **Test Mode**:
   - Use test API keys (`sk_test_...` and `pk_test_...`) for development
   - Use Stripe test cards: `4242 4242 4242 4242` (any future date, any CVC)

4. **Production Mode**:
   - Switch to live API keys when ready for production
   - Update webhook endpoint to production URL
   - Ensure SSL/HTTPS is enabled

## Future Enhancements

### Short-term

- [ ] Admin UI for creating and managing redemption codes
- [ ] User dashboard to view active subscriptions and entitlements
- [ ] Email notifications for successful purchases
- [ ] Implement entitlement rules based on game progress and unlock sources

### Medium-term

- [ ] Additional payment methods (PayPal, Apple Pay, Google Pay)
- [ ] Gift subscriptions
- [ ] Referral codes with rewards
- [ ] Tiered subscription plans
- [ ] One-time purchase options for individual products

### Long-term

- [ ] Advanced entitlement rules engine
- [ ] A/B testing for pricing and features
- [ ] Revenue analytics dashboard
- [ ] Integration with game/novel progress tracking
- [ ] Community features for Founders Access members

## Support and Troubleshooting

### Common Issues

**Checkout not working**:
- Verify Stripe API keys are set correctly
- Check that user is signed in before checkout
- Look for errors in browser console and server logs

**Webhooks not processing**:
- Verify webhook secret is correct
- Check webhook endpoint is publicly accessible
- Review Stripe webhook logs for delivery attempts
- Ensure webhook signature verification is passing

**Entitlements not granted**:
- Check webhook was received and processed successfully
- Verify subscription status in Stripe Dashboard
- Look for errors in server logs during webhook processing

### Support

For technical support or questions:
- Check the main [docs/README.md](./README.md) for general architecture
- Review Stripe documentation: https://stripe.com/docs
- Open an issue in the repository for bugs

---

**Last Updated**: 2026-01-24

**Maintainers**: Brooks AI HUB Development Team
