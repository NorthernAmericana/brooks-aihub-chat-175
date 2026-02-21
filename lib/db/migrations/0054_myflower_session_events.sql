CREATE TABLE IF NOT EXISTS "myflower_session_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "occurred_at" timestamp with time zone NOT NULL,
  "schema_version" varchar(16) NOT NULL,
  "exposure" jsonb NOT NULL,
  "context" jsonb NOT NULL,
  "outcomes" jsonb NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "myflower_session_events_user_occurred_idx"
  ON "myflower_session_events" ("user_id", "occurred_at" DESC);

CREATE INDEX IF NOT EXISTS "myflower_session_events_user_created_idx"
  ON "myflower_session_events" ("user_id", "created_at" DESC);
