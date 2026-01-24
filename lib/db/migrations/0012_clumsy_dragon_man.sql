CREATE TABLE IF NOT EXISTS "CustomAgent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"slash" varchar(128) NOT NULL,
	"systemPrompt" text,
	"defaultVoiceId" text,
	"defaultVoiceLabel" text,
	"memoryScope" varchar DEFAULT 'ato-only' NOT NULL,
	"tools" json DEFAULT '[]'::json NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastUsedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "isFounder" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "customAtoCount" json DEFAULT '{"month":"","count":0}'::json;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CustomAgent" ADD CONSTRAINT "CustomAgent_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
