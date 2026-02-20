CREATE TABLE IF NOT EXISTS "dm_rooms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_by_user_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dm_rooms_created_by_user_id_User_id_fk"
    FOREIGN KEY ("created_by_user_id") REFERENCES "public"."User"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dm_room_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dm_room_members_room_id_dm_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "public"."dm_rooms"("id") ON DELETE cascade,
  CONSTRAINT "dm_room_members_user_id_User_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dm_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL,
  "sender_user_id" uuid NOT NULL,
  "body" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dm_messages_room_id_dm_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "public"."dm_rooms"("id") ON DELETE cascade,
  CONSTRAINT "dm_messages_sender_user_id_User_id_fk"
    FOREIGN KEY ("sender_user_id") REFERENCES "public"."User"("id") ON DELETE cascade,
  CONSTRAINT "dm_messages_has_body_check" CHECK ("body" IS NULL OR length(trim("body")) > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dm_message_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "message_id" uuid NOT NULL,
  "room_id" uuid NOT NULL,
  "uploader_user_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "asset_url" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dm_message_attachments_message_id_dm_messages_id_fk"
    FOREIGN KEY ("message_id") REFERENCES "public"."dm_messages"("id") ON DELETE cascade,
  CONSTRAINT "dm_message_attachments_room_id_dm_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "public"."dm_rooms"("id") ON DELETE cascade,
  CONSTRAINT "dm_message_attachments_uploader_user_id_User_id_fk"
    FOREIGN KEY ("uploader_user_id") REFERENCES "public"."User"("id") ON DELETE cascade,
  CONSTRAINT "dm_message_attachments_kind_check" CHECK ("kind" IN ('image'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dm_drawpad_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "draft" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dm_drawpad_drafts_room_id_dm_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "public"."dm_rooms"("id") ON DELETE cascade,
  CONSTRAINT "dm_drawpad_drafts_user_id_User_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dm_room_members_room_user_unique_idx"
  ON "dm_room_members" USING btree ("room_id", "user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dm_drawpad_drafts_room_user_unique_idx"
  ON "dm_drawpad_drafts" USING btree ("room_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_messages_room_created_idx"
  ON "dm_messages" USING btree ("room_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_message_attachments_message_idx"
  ON "dm_message_attachments" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dm_message_attachments_room_created_idx"
  ON "dm_message_attachments" USING btree ("room_id", "created_at" DESC);
--> statement-breakpoint
ALTER TABLE "dm_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dm_room_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dm_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dm_message_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dm_drawpad_drafts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_rooms' AND policyname = 'dm_rooms_member_access') THEN
    CREATE POLICY dm_rooms_member_access ON dm_rooms
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_rooms.id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      )
      WITH CHECK (
        created_by_user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        OR EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_rooms.id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_room_members' AND policyname = 'dm_room_members_member_read') THEN
    CREATE POLICY dm_room_members_member_read ON dm_room_members
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_room_members.room_id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_messages' AND policyname = 'dm_messages_member_rw') THEN
    CREATE POLICY dm_messages_member_rw ON dm_messages
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_messages.room_id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_messages.room_id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_message_attachments' AND policyname = 'dm_message_attachments_member_rw') THEN
    CREATE POLICY dm_message_attachments_member_rw ON dm_message_attachments
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_message_attachments.room_id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM dm_room_members m
          WHERE m.room_id = dm_message_attachments.room_id
            AND m.user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dm_drawpad_drafts' AND policyname = 'dm_drawpad_drafts_owner_rw') THEN
    CREATE POLICY dm_drawpad_drafts_owner_rw ON dm_drawpad_drafts
      FOR ALL
      USING (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  END IF;
END$$;
