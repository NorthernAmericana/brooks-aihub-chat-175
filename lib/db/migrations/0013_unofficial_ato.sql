CREATE TABLE IF NOT EXISTS "UnofficialAto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"personalityName" text,
	"instructions" text,
	"intelligenceMode" varchar DEFAULT 'ATO-Limited' NOT NULL,
	"defaultVoiceId" text,
	"defaultVoiceLabel" text,
	"webSearchEnabled" boolean DEFAULT false NOT NULL,
	"fileSearchEnabled" boolean DEFAULT false NOT NULL,
	"ownerUserId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"planMetadata" json
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UnofficialAto" ADD CONSTRAINT "UnofficialAto_ownerUserId_User_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
