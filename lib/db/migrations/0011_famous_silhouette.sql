ALTER TABLE "Chat" ALTER COLUMN "ttsVoiceId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "ttsVoiceLabel" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "ttsEnabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "ttsEnabled" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Memory" ALTER COLUMN "isApproved" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "routeKey" text;