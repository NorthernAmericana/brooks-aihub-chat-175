ALTER TABLE "dm_message_attachments"
ADD COLUMN IF NOT EXISTS "metadata" jsonb;
