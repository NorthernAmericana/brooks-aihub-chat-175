ALTER TABLE "namc_install_gate_state"
  ADD COLUMN IF NOT EXISTS "verification_status" text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "verification_method" text,
  ADD COLUMN IF NOT EXISTS "verification_checked_at" timestamp,
  ADD COLUMN IF NOT EXISTS "verification_details" json;
