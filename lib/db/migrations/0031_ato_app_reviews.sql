CREATE TABLE IF NOT EXISTS "ato_app_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ato_app_reviews" ADD CONSTRAINT "ato_app_reviews_app_id_ato_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."ato_apps"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ato_app_reviews" ADD CONSTRAINT "ato_app_reviews_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ato_app_reviews" ADD CONSTRAINT "ato_app_reviews_app_id_user_id_unique" UNIQUE ("app_id","user_id");
--> statement-breakpoint
ALTER TABLE "ato_app_reviews" ADD CONSTRAINT "ato_app_reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);
--> statement-breakpoint
ALTER TABLE "user_installs" ADD CONSTRAINT "user_installs_app_id_user_id_unique" UNIQUE ("app_id","user_id");
