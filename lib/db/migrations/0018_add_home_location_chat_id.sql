ALTER TABLE "UserLocation"
ADD COLUMN IF NOT EXISTS "chatId" uuid REFERENCES "Chat"("id");
