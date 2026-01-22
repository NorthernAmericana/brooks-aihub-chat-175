CREATE TABLE "Memory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "content" text NOT NULL,
  "isRead" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp NOT NULL
);

ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id");
