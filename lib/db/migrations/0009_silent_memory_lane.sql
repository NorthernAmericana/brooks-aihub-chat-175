CREATE TABLE IF NOT EXISTS "Memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"sourceType" varchar NOT NULL,
	"sourceUri" text NOT NULL,
	"ownerId" uuid NOT NULL,
	"orgId" varchar(64) DEFAULT 'default' NOT NULL,
	"productId" varchar(64) DEFAULT 'brooks-aihub' NOT NULL,
	"route" varchar(128),
	"agentId" varchar(64),
	"agentLabel" varchar(128),
	"isApproved" boolean DEFAULT false NOT NULL,
	"approvedAt" timestamp,
	"tags" json DEFAULT '[]'::json NOT NULL,
	"rawText" text NOT NULL,
	"normalizedText" text,
	"embeddingsRef" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Memory" ADD CONSTRAINT "Memory_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
