CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS mycarmind_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  state text NOT NULL,
  city text NOT NULL,
  category text NOT NULL,
  lat double precision,
  lng double precision,
  source_type text NOT NULL DEFAULT 'registry',
  created_by_user_id uuid REFERENCES "User"(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mycarmind_place_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES mycarmind_places(id) ON DELETE CASCADE,
  source_kind text NOT NULL DEFAULT 'registry',
  citation_url text,
  citation_title text,
  citation_publisher text,
  citation_note text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (place_id, citation_url)
);

CREATE TABLE IF NOT EXISTS mycarmind_place_embeddings (
  place_id uuid PRIMARY KEY REFERENCES mycarmind_places(id) ON DELETE CASCADE,
  embedding vector(1536),
  model text NOT NULL DEFAULT 'text-embedding-3-small',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mycarmind_user_profiles (
  user_id uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  nickname text,
  home_city text,
  home_state text,
  car_make text,
  car_model text,
  car_year integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mycarmind_user_stats (
  user_id uuid PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  visits_count integer NOT NULL DEFAULT 0,
  missions_completed integer NOT NULL DEFAULT 0,
  city_badges integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mycarmind_place_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES mycarmind_places(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS mycarmind_place_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES mycarmind_places(id) ON DELETE CASCADE,
  visited_at timestamptz NOT NULL DEFAULT now(),
  note text,
  media_asset_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mycarmind_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  city text,
  state text,
  category text,
  target_count integer NOT NULL DEFAULT 1,
  points_reward integer NOT NULL DEFAULT 100,
  season text NOT NULL DEFAULT 'season-1',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mycarmind_mission_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES mycarmind_missions(id) ON DELETE CASCADE,
  progress_count integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);

CREATE TABLE IF NOT EXISTS mycarmind_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  place_id uuid REFERENCES mycarmind_places(id) ON DELETE SET NULL,
  visit_id uuid REFERENCES mycarmind_place_visits(id) ON DELETE SET NULL,
  media_asset_id uuid NOT NULL,
  publish_to_commons boolean NOT NULL DEFAULT false,
  commons_post_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS mycarmind_place_sources_place_url_not_null_uidx ON mycarmind_place_sources(place_id, citation_url) WHERE citation_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS mycarmind_places_city_state_category_idx ON mycarmind_places(city, state, category);
CREATE INDEX IF NOT EXISTS mycarmind_places_state_city_idx ON mycarmind_places(state, city);
CREATE INDEX IF NOT EXISTS mycarmind_missions_location_idx ON mycarmind_missions(state, city, category);
CREATE INDEX IF NOT EXISTS mycarmind_visits_user_created_idx ON mycarmind_place_visits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mycarmind_place_embeddings_vector_idx ON mycarmind_place_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);


DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media_assets') THEN
    ALTER TABLE mycarmind_place_visits
      ADD CONSTRAINT mycarmind_place_visits_media_asset_fk
      FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE RESTRICT;

    ALTER TABLE mycarmind_media_assets
      ADD CONSTRAINT mycarmind_media_assets_media_asset_fk
      FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE RESTRICT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commons_posts') THEN
    ALTER TABLE mycarmind_media_assets
      ADD CONSTRAINT mycarmind_media_assets_commons_post_fk
      FOREIGN KEY (commons_post_id) REFERENCES commons_posts(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

ALTER TABLE mycarmind_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycarmind_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycarmind_place_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycarmind_place_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycarmind_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycarmind_media_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mycarmind_place_saves' AND policyname = 'mycarmind_saves_owner') THEN
    CREATE POLICY mycarmind_saves_owner ON mycarmind_place_saves
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mycarmind_place_visits' AND policyname = 'mycarmind_visits_owner') THEN
    CREATE POLICY mycarmind_visits_owner ON mycarmind_place_visits
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mycarmind_user_profiles' AND policyname = 'mycarmind_profile_owner') THEN
    CREATE POLICY mycarmind_profile_owner ON mycarmind_user_profiles
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mycarmind_user_stats' AND policyname = 'mycarmind_stats_owner_read') THEN
    CREATE POLICY mycarmind_stats_owner_read ON mycarmind_user_stats
      FOR SELECT USING (true);
  END IF;


  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mycarmind_user_stats' AND policyname = 'mycarmind_stats_owner_write') THEN
    CREATE POLICY mycarmind_stats_owner_write ON mycarmind_user_stats
      FOR ALL
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mycarmind_mission_progress' AND policyname = 'mycarmind_progress_owner') THEN
    CREATE POLICY mycarmind_progress_owner ON mycarmind_mission_progress
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mycarmind_media_assets' AND policyname = 'mycarmind_media_owner') THEN
    CREATE POLICY mycarmind_media_owner ON mycarmind_media_assets
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;
END$$;
