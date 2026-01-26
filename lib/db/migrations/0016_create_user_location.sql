CREATE TABLE IF NOT EXISTS "UserLocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ownerId" uuid NOT NULL,
	"route" varchar(128) NOT NULL,
	"locationType" varchar NOT NULL,
	"rawText" text NOT NULL,
	"normalizedText" text,
	"isApproved" boolean DEFAULT false NOT NULL,
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
