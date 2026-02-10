ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "memoryKey" text;
--> statement-breakpoint
UPDATE "Memory"
SET "memoryKey" = COALESCE("memoryKey", "id"::text)
WHERE "memoryKey" IS NULL;
--> statement-breakpoint
ALTER TABLE "Memory" ALTER COLUMN "memoryKey" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "memoryVersion" integer;
--> statement-breakpoint
UPDATE "Memory"
SET "memoryVersion" = COALESCE("memoryVersion", 1)
WHERE "memoryVersion" IS NULL;
--> statement-breakpoint
ALTER TABLE "Memory" ALTER COLUMN "memoryVersion" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "Memory" ALTER COLUMN "memoryVersion" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "supersedesMemoryId" uuid;
--> statement-breakpoint
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "validFrom" timestamp;
--> statement-breakpoint
UPDATE "Memory"
SET "validFrom" = COALESCE("validFrom", COALESCE("approvedAt", "createdAt", now()))
WHERE "validFrom" IS NULL;
--> statement-breakpoint
ALTER TABLE "Memory" ALTER COLUMN "validFrom" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "Memory" ALTER COLUMN "validFrom" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "validTo" timestamp;
--> statement-breakpoint
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "stalenessReason" text;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Memory" ADD CONSTRAINT "Memory_supersedesMemoryId_Memory_id_fk" FOREIGN KEY ("supersedesMemoryId") REFERENCES "public"."Memory"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Memory_owner_memory_version_idx" ON "Memory" USING btree ("ownerId","memoryKey","memoryVersion");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Memory_owner_memory_current_idx" ON "Memory" USING btree ("ownerId","memoryKey","validTo");
