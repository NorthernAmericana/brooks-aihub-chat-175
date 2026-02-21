CREATE TABLE IF NOT EXISTS "dm_room_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL,
  "inviter_user_id" uuid NOT NULL,
  "target_email" varchar(64) NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "accepted_at" timestamptz,
  "accepted_by_user_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dm_room_invites_room_id_dm_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "public"."dm_rooms"("id") ON DELETE cascade,
  CONSTRAINT "dm_room_invites_inviter_user_id_User_id_fk"
    FOREIGN KEY ("inviter_user_id") REFERENCES "public"."User"("id") ON DELETE cascade,
  CONSTRAINT "dm_room_invites_accepted_by_user_id_User_id_fk"
    FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."User"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dm_room_invites_token_hash_unique_idx"
  ON "dm_room_invites" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_room_invites_room_created_idx"
  ON "dm_room_invites" USING btree ("room_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_room_invites_target_email_idx"
  ON "dm_room_invites" USING btree ("target_email");
--> statement-breakpoint
ALTER TABLE "dm_room_invites" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_room_invites' AND policyname = 'dm_room_invites_member_rw') THEN
    CREATE POLICY dm_room_invites_member_rw ON dm_room_invites
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_room_invites.room_id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_room_invites.room_id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      );
  END IF;
END$$;
