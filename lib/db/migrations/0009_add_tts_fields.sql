-- Add TTS (Text-to-Speech) fields to Chat table for voice settings
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "ttsEnabled" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "ttsVoiceId" text;
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "ttsVoiceLabel" text;
