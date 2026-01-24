CREATE TABLE IF NOT EXISTS "CustomAto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"slash" varchar(128) NOT NULL,
	"voiceId" text,
	"voiceLabel" text,
	"promptInstructions" text,
	"memoryScope" varchar DEFAULT 'ato-only' NOT NULL,
	"isOfficial" boolean DEFAULT false NOT NULL,
	"usageCount" json DEFAULT '[]'::json NOT NULL,
	"lastUsedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionTier" varchar DEFAULT 'free' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CustomAto" ADD CONSTRAINT "CustomAto_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
