-- Migration: Add user_inventory table for privacy-safe cannabis inventory tracking
-- See: /docs/myflowerai/inventory-management.md

CREATE TABLE IF NOT EXISTS "user_inventory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "schema_version" varchar(10) NOT NULL DEFAULT '1.0',
  "inventory_id" uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  "strain_id" varchar(255) NOT NULL,
  
  -- Privacy metadata
  "storage_location" varchar(50) NOT NULL DEFAULT 'database_user_private',
  "user_consent" boolean NOT NULL DEFAULT false,
  
  -- Inventory details (privacy-safe with bucketed values and month granularity)
  "acquired_month" varchar(7),  -- YYYY-MM format only (no exact dates)
  "opened" boolean DEFAULT false,
  "remaining_estimate" varchar(20),  -- Bucketed: full, half, low, empty (no exact grams)
  "storage_type" varchar(50),
  "has_humidipack" boolean,
  "storage_location_type" varchar(50),
  "quality_notes" text,
  "tags" text[],
  
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Ensure acquired_month is in YYYY-MM format if provided
  CONSTRAINT "acquired_month_format" CHECK ("acquired_month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$' OR "acquired_month" IS NULL)
);

-- Foreign key to User table
DO $$ BEGIN
  ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_User_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Note: This application uses application-level access control rather than database-level RLS.
-- Access control should be enforced in the application layer to ensure users can only access
-- their own inventory records by filtering queries with the authenticated user's ID.

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_inventory_user_id" ON "user_inventory"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_inventory_strain_id" ON "user_inventory"("strain_id");
CREATE INDEX IF NOT EXISTS "idx_user_inventory_created_at" ON "user_inventory"("created_at");

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_inventory_updated_at_trigger
  BEFORE UPDATE ON "user_inventory"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_inventory_updated_at();
