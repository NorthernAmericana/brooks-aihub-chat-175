ALTER TABLE "custom_atos" ADD COLUMN IF NOT EXISTS "has_avatar" boolean DEFAULT false NOT NULL;
ALTER TABLE "ato_routes" ADD COLUMN IF NOT EXISTS "agent_id" text;
