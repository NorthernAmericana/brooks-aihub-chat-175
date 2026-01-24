CREATE TABLE IF NOT EXISTS "Entitlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"productId" varchar(64) NOT NULL,
	"grantedAt" timestamp DEFAULT now() NOT NULL,
	"grantedBy" varchar(64) NOT NULL,
	"expiresAt" timestamp,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Redemption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codeId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"redeemedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "RedemptionCode" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"productId" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	"maxRedemptions" varchar(32) DEFAULT '1',
	"redemptionCount" varchar(32) DEFAULT '0',
	"isActive" boolean DEFAULT true,
	"metadata" json,
	CONSTRAINT "RedemptionCode_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "foundersAccess" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "foundersAccessGrantedAt" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_codeId_RedemptionCode_id_fk" FOREIGN KEY ("codeId") REFERENCES "public"."RedemptionCode"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
