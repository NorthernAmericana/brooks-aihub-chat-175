CREATE TABLE IF NOT EXISTS "Review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"placeId" text NOT NULL,
	"placeName" text NOT NULL,
	"placeSource" varchar(32),
	"googleMapsUrl" text,
	"rating" integer NOT NULL,
	"reviewText" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReviewPhoto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reviewId" uuid,
	"userId" uuid NOT NULL,
	"placeId" text NOT NULL,
	"placeName" text NOT NULL,
	"blobUrl" text NOT NULL,
	"blobPathname" text NOT NULL,
	"contentType" text NOT NULL,
	"size" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ReviewPhoto" ADD CONSTRAINT "ReviewPhoto_reviewId_Review_id_fk" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ReviewPhoto" ADD CONSTRAINT "ReviewPhoto_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
