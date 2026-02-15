DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mycarmind_user_profiles'
      AND policyname = 'mycarmind_profile_public_read'
  ) THEN
    CREATE POLICY mycarmind_profile_public_read ON mycarmind_user_profiles
      FOR SELECT
      USING (true);
  END IF;
END$$;
