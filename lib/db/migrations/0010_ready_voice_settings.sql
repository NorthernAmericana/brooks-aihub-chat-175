ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "ttsVoiceId" varchar(128);
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "ttsVoiceLabel" varchar(128);
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "ttsEnabled" boolean DEFAULT true NOT NULL;
