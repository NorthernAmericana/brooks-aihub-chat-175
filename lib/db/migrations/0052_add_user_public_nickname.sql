ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicNickname" varchar(24);

CREATE UNIQUE INDEX IF NOT EXISTS "User_publicNickname_unique_idx"
  ON "User" (lower("publicNickname"))
  WHERE "publicNickname" IS NOT NULL;
