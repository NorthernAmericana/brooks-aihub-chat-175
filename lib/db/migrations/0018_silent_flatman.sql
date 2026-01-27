CREATE TABLE IF NOT EXISTS "personal_fit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"schema_version" varchar(10) DEFAULT '1.0' NOT NULL,
	"personal_fit_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"strain_id" varchar(255) NOT NULL,
	"storage_location" varchar(50) DEFAULT 'database_user_private' NOT NULL,
	"user_consent" boolean DEFAULT false NOT NULL,
	"rating_1to10" varchar(10),
	"best_for" text[],
	"avoid_for" text[],
	"repeat_probability_0to1" varchar(10),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "personal_fit_personal_fit_id_unique" UNIQUE("personal_fit_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"schema_version" varchar(10) DEFAULT '1.0' NOT NULL,
	"inventory_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"strain_id" varchar(255) NOT NULL,
	"storage_location" varchar(50) DEFAULT 'database_user_private' NOT NULL,
	"user_consent" boolean DEFAULT false NOT NULL,
	"acquired_month" varchar(7),
	"opened" boolean DEFAULT false,
	"remaining_estimate" varchar(20),
	"storage_type" varchar(50),
	"has_humidipack" boolean,
	"storage_location_type" varchar(50),
	"quality_notes" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_inventory_inventory_id_unique" UNIQUE("inventory_id")
);
--> statement-breakpoint
ALTER TABLE "UserLocation" ADD COLUMN "chatId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_fit" ADD CONSTRAINT "personal_fit_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
