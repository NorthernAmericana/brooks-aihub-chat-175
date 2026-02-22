ALTER TABLE "myflower_session_events"
ADD COLUMN "expectancy" jsonb NOT NULL DEFAULT '{}'::jsonb;
