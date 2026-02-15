CREATE TABLE IF NOT EXISTS mycarmind_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  curated_place_id uuid REFERENCES mycarmind_places(id) ON DELETE SET NULL,
  provider text NOT NULL,
  place_ref text NOT NULL,
  place_name text NOT NULL,
  category text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  lat double precision,
  lng double precision,
  proof_type text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mycarmind_visits_user_created_idx
  ON mycarmind_visits (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS mycarmind_visits_provider_ref_idx
  ON mycarmind_visits (provider, place_ref);

ALTER TABLE mycarmind_visits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mycarmind_visits'
      AND policyname = 'mycarmind_visits_owner'
  ) THEN
    CREATE POLICY mycarmind_visits_owner ON mycarmind_visits
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;
END$$;

ALTER TABLE mycarmind_daily_missions
  ADD COLUMN IF NOT EXISTS requires_home_city_match boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_city text,
  ADD COLUMN IF NOT EXISTS home_state text;
