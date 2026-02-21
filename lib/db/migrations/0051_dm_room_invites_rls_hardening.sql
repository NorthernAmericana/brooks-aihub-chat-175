DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dm_room_invites'
      AND policyname = 'dm_room_invites_member_rw'
  ) THEN
    DROP POLICY dm_room_invites_member_rw ON dm_room_invites;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dm_room_invites'
      AND policyname = 'dm_room_invites_member_read'
  ) THEN
    CREATE POLICY dm_room_invites_member_read ON dm_room_invites
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_room_invites.room_id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dm_room_invites'
      AND policyname = 'dm_room_invites_inviter_insert'
  ) THEN
    CREATE POLICY dm_room_invites_inviter_insert ON dm_room_invites
      FOR INSERT
      WITH CHECK (
        inviter_user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dm_room_invites'
      AND policyname = 'dm_room_invites_inviter_update'
  ) THEN
    CREATE POLICY dm_room_invites_inviter_update ON dm_room_invites
      FOR UPDATE
      USING (
        inviter_user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      )
      WITH CHECK (
        inviter_user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dm_room_invites'
      AND policyname = 'dm_room_invites_inviter_delete'
  ) THEN
    CREATE POLICY dm_room_invites_inviter_delete ON dm_room_invites
      FOR DELETE
      USING (
        inviter_user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      );
  END IF;
END$$;
