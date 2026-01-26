ALTER TABLE "UserLocation"
ADD COLUMN "chatId" uuid REFERENCES "Chat"("id");
