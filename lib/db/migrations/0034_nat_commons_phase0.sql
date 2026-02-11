CREATE TABLE IF NOT EXISTS "campfires" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(64) NOT NULL,
  "path" varchar(128) NOT NULL,
  "name" varchar(120) NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "created_by_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "last_activity_at" timestamptz DEFAULT now() NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  "is_private" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campfires" ADD CONSTRAINT "campfires_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "campfires_slug_unique_idx" ON "campfires" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "campfires_path_unique_idx" ON "campfires" USING btree ("path");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commons_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campfire_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "title" varchar(160) NOT NULL,
  "body" text NOT NULL,
  "body_format" varchar DEFAULT 'markdown' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "edited_at" timestamptz,
  "deleted_at" timestamptz,
  "is_visible" boolean DEFAULT true NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_posts" ADD CONSTRAINT "commons_posts_campfire_id_campfires_id_fk" FOREIGN KEY ("campfire_id") REFERENCES "public"."campfires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_posts" ADD CONSTRAINT "commons_posts_author_id_User_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commons_posts_campfire_created_idx" ON "commons_posts" USING btree ("campfire_id", "created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commons_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL,
  "parent_comment_id" uuid,
  "author_id" uuid NOT NULL,
  "body" text NOT NULL,
  "body_format" varchar DEFAULT 'markdown' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "edited_at" timestamptz,
  "deleted_at" timestamptz,
  "is_visible" boolean DEFAULT true NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_comments" ADD CONSTRAINT "commons_comments_post_id_commons_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."commons_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_comments" ADD CONSTRAINT "commons_comments_parent_comment_id_commons_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."commons_comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_comments" ADD CONSTRAINT "commons_comments_author_id_User_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commons_comments_post_created_idx" ON "commons_comments" USING btree ("post_id", "created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commons_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid,
  "comment_id" uuid,
  "user_id" uuid NOT NULL,
  "value" integer DEFAULT 1 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  CONSTRAINT "commons_votes_single_target_chk" CHECK (("post_id" IS NOT NULL AND "comment_id" IS NULL) OR ("post_id" IS NULL AND "comment_id" IS NOT NULL)),
  CONSTRAINT "commons_votes_value_chk" CHECK ("value" IN (-1, 1))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_votes" ADD CONSTRAINT "commons_votes_post_id_commons_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."commons_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_votes" ADD CONSTRAINT "commons_votes_comment_id_commons_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."commons_comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_votes" ADD CONSTRAINT "commons_votes_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commons_votes_post_user_unique_idx" ON "commons_votes" USING btree ("post_id", "user_id") WHERE "is_deleted" = false;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commons_votes_comment_user_unique_idx" ON "commons_votes" USING btree ("comment_id", "user_id") WHERE "is_deleted" = false;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commons_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid,
  "comment_id" uuid,
  "reporter_id" uuid NOT NULL,
  "reason" varchar(64) NOT NULL,
  "details" text,
  "status" varchar DEFAULT 'open' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "resolved_at" timestamptz,
  "is_deleted" boolean DEFAULT false NOT NULL,
  CONSTRAINT "commons_reports_target_chk" CHECK (("post_id" IS NOT NULL) OR ("comment_id" IS NOT NULL))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_reports" ADD CONSTRAINT "commons_reports_post_id_commons_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."commons_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_reports" ADD CONSTRAINT "commons_reports_comment_id_commons_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."commons_comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commons_reports" ADD CONSTRAINT "commons_reports_reporter_id_User_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

INSERT INTO "campfires" ("slug", "path", "name", "description", "is_active", "is_private")
VALUES
  ('roadmap', 'roadmap', 'Roadmap Campfire', 'Discuss release priorities, milestones, and roadmap updates.', true, false),
  ('builders-circle', 'community/builders-circle', 'Builders Circle', 'A shared circle for build logs, launches, and founder support.', true, false),
  ('archive', 'archive', 'Archive', 'Read-only archive for earlier Commons conversations.', false, false)
ON CONFLICT ("path") DO NOTHING;
