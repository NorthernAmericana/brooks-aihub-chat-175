CREATE TABLE IF NOT EXISTS "myflower_daily_goals" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"target_g" numeric DEFAULT 0 NOT NULL,
	"target_mg_thc" numeric,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"content_type" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "myflower_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"occurred_at" timestamptz NOT NULL,
	"product_type" varchar(32) NOT NULL,
	"strain_slug" varchar(255),
	"strain_name" text,
	"amount_g" numeric,
	"amount_mg_thc" numeric,
	"notes" text,
	"photo_asset_id" uuid,
	"created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "myflower_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(32) NOT NULL,
	"caption" text,
	"media_asset_id" uuid,
	"metadata" jsonb,
	"visibility" varchar(32) NOT NULL,
	"source_app" text DEFAULT 'myflowerai' NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "myflower_daily_goals" ADD CONSTRAINT "myflower_daily_goals_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "myflower_logs" ADD CONSTRAINT "myflower_logs_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "myflower_logs" ADD CONSTRAINT "myflower_logs_photo_asset_id_media_assets_id_fk" FOREIGN KEY ("photo_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "myflower_posts" ADD CONSTRAINT "myflower_posts_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "myflower_posts" ADD CONSTRAINT "myflower_posts_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;
