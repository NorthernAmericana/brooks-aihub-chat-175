CREATE TABLE IF NOT EXISTS mycarmind_daily_missions (
  date_key date NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  required_count integer NOT NULL DEFAULT 1,
  window_start_hour integer NOT NULL DEFAULT 0,
  window_end_hour integer NOT NULL DEFAULT 23,
  points_reward integer NOT NULL DEFAULT 100,
  PRIMARY KEY (date_key, slug)
);

CREATE TABLE IF NOT EXISTS mycarmind_daily_mission_progress (
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  date_key date NOT NULL,
  slug text NOT NULL,
  progress_count integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date_key, slug),
  FOREIGN KEY (date_key, slug) REFERENCES mycarmind_daily_missions(date_key, slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS mycarmind_daily_missions_date_idx
  ON mycarmind_daily_missions (date_key, points_reward DESC);

CREATE INDEX IF NOT EXISTS mycarmind_daily_mission_progress_lookup_idx
  ON mycarmind_daily_mission_progress (user_id, date_key);

ALTER TABLE mycarmind_daily_mission_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mycarmind_daily_mission_progress'
      AND policyname = 'mycarmind_daily_progress_owner'
  ) THEN
    CREATE POLICY mycarmind_daily_progress_owner ON mycarmind_daily_mission_progress
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;
END$$;
