CREATE TABLE IF NOT EXISTS "AtoFile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"atoId" uuid NOT NULL,
	"ownerUserId" uuid NOT NULL,
	"filename" text NOT NULL,
	"blobUrl" text NOT NULL,
	"blobPathname" text NOT NULL,
	"contentType" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AtoFile" ADD CONSTRAINT "AtoFile_atoId_UnofficialAto_id_fk" FOREIGN KEY ("atoId") REFERENCES "public"."UnofficialAto"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "AtoFile" ADD CONSTRAINT "AtoFile_ownerUserId_User_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
