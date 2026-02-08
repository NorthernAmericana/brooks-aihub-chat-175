CREATE TABLE IF NOT EXISTS "UserVehicle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ownerId" uuid NOT NULL,
	"chatId" uuid,
	"route" varchar(128) NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer,
	"isApproved" boolean DEFAULT false NOT NULL,
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "UserVehicle" ADD CONSTRAINT "UserVehicle_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "UserVehicle" ADD CONSTRAINT "UserVehicle_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "UserVehicle"
	ADD CONSTRAINT "UserVehicle_route_check"
	CHECK ("route" = '/MyCarMindATO/');
