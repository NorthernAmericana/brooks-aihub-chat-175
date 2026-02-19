CREATE TABLE IF NOT EXISTS "namc_install_gate_state" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "opened_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "namc_install_gate_state_user_id_User_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."User"("id")
    ON DELETE cascade
    ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "namc_install_gate_state_user_id_unique"
  ON "namc_install_gate_state" USING btree ("user_id");
