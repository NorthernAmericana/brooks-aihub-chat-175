CREATE TABLE IF NOT EXISTS "CustomATO" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"slash" varchar(128) NOT NULL,
	"voiceId" text NOT NULL,
	"voiceLabel" text NOT NULL,
	"instructions" text NOT NULL,
	"memoryScope" varchar DEFAULT 'ato-only' NOT NULL,
	"lastUsedAt" timestamp,
	CONSTRAINT "CustomATO_userId_slash_unique" UNIQUE("userId", "slash")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CustomATO" ADD CONSTRAINT "CustomATO_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
