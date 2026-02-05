ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "sessionType" varchar DEFAULT 'chat';
UPDATE "Chat" SET "sessionType" = 'chat' WHERE "sessionType" IS NULL;
ALTER TABLE "Chat" ALTER COLUMN "sessionType" SET NOT NULL;
