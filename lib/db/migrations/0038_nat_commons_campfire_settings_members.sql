CREATE TABLE IF NOT EXISTS "commons_campfire_settings" (
  "campfire_id" uuid PRIMARY KEY NOT NULL,
  "retention_mode" text NOT NULL,
  "rolling_window_size" integer,
  "expires_in_hours" integer,
  "is_temp" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "commons_campfire_settings_campfire_id_campfires_id_fk"
    FOREIGN KEY ("campfire_id") REFERENCES "public"."campfires"("id") ON DELETE cascade,
  CONSTRAINT "commons_campfire_settings_retention_mode_check"
    CHECK ("retention_mode" IN ('permanent', 'rolling_window', 'timeboxed', 'burn_on_empty')),
  CONSTRAINT "commons_campfire_settings_rolling_window_size_check"
    CHECK ("rolling_window_size" IS NULL OR "rolling_window_size" IN (1, 5, 10)),
  CONSTRAINT "commons_campfire_settings_expires_in_hours_check"
    CHECK (
      "expires_in_hours" IS NULL
      OR "expires_in_hours" IN (3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 48, 72, 96)
    )
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commons_campfire_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campfire_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text NOT NULL,
  "invited_by_user_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "commons_campfire_members_campfire_id_campfires_id_fk"
    FOREIGN KEY ("campfire_id") REFERENCES "public"."campfires"("id") ON DELETE cascade,
  CONSTRAINT "commons_campfire_members_user_id_User_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade,
  CONSTRAINT "commons_campfire_members_invited_by_user_id_User_id_fk"
    FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."User"("id") ON DELETE set null,
  CONSTRAINT "commons_campfire_members_role_check"
    CHECK ("role" IN ('host', 'member'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commons_campfire_members_campfire_user_unique_idx"
  ON "commons_campfire_members" USING btree ("campfire_id", "user_id");
