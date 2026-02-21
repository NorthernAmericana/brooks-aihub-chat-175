CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "is_read" boolean NOT NULL DEFAULT false,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "notifications_user_created_idx"
  ON "notifications" ("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx"
  ON "notifications" ("user_id", "is_read", "created_at" DESC);
