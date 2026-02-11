ALTER TABLE "campfires"
  ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamptz USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "last_activity_at" TYPE timestamptz USING "last_activity_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "commons_posts"
  ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamptz USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "edited_at" TYPE timestamptz USING "edited_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE timestamptz USING "deleted_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "commons_comments"
  ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamptz USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "edited_at" TYPE timestamptz USING "edited_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE timestamptz USING "deleted_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "commons_votes"
  ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamptz USING "updated_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "commons_reports"
  ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamptz USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "resolved_at" TYPE timestamptz USING "resolved_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
DROP INDEX IF EXISTS "commons_votes_post_user_unique_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "commons_votes_comment_user_unique_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commons_votes_post_user_unique_idx"
  ON "commons_votes" USING btree ("post_id", "user_id")
  WHERE "is_deleted" = false;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commons_votes_comment_user_unique_idx"
  ON "commons_votes" USING btree ("comment_id", "user_id")
  WHERE "is_deleted" = false;
