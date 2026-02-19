CREATE TABLE IF NOT EXISTS "spotify_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "refresh_token_encrypted" text NOT NULL,
  "access_token" text,
  "expires_at" timestamp,
  "scope" text,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "spotify_accounts_user_id_User_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."User"("id")
    ON DELETE cascade
    ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "spotify_accounts_user_id_idx"
  ON "spotify_accounts" USING btree ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "spotify_accounts_active_user_idx"
  ON "spotify_accounts" USING btree ("user_id")
  WHERE "revoked_at" IS NULL;
