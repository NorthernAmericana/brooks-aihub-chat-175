ALTER TABLE mycarmind_user_profiles
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS show_subtitle boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hands_free_mode boolean NOT NULL DEFAULT false;
