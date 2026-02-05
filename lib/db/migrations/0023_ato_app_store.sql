CREATE TABLE "ato_apps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(64) NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "icon_url" text,
  "category" text,
  "store_path" text,
  "app_path" text,
  "is_official" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ato_apps_slug_unique" UNIQUE("slug")
);

CREATE TABLE "ato_routes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "app_id" uuid NOT NULL,
  "slash" text NOT NULL,
  "label" text NOT NULL,
  "description" text,
  "tool_policy" json DEFAULT '{}'::json NOT NULL,
  "is_founders_only" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ato_routes_app_id_slash_unique" UNIQUE("app_id", "slash")
);

CREATE TABLE "user_installs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "app_id" uuid NOT NULL,
  "installed_at" timestamp DEFAULT now() NOT NULL,
  "last_opened_at" timestamp,
  CONSTRAINT "user_installs_user_id_app_id_unique" UNIQUE("user_id", "app_id")
);

CREATE TABLE "entitlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "product_id" varchar(64) NOT NULL,
  "granted_at" timestamp DEFAULT now() NOT NULL,
  "granted_by" varchar(64) NOT NULL,
  "expires_at" timestamp,
  "metadata" json
);

CREATE TABLE "custom_atos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "route" text,
  "description" text,
  "personality_name" text,
  "instructions" text,
  "tool_policy" json,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "avatar_addon_purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "addon_sku" varchar(64) NOT NULL,
  "purchased_at" timestamp DEFAULT now() NOT NULL,
  "price_cents" integer,
  "currency" varchar(3),
  "metadata" json
);

DO $$ BEGIN
  ALTER TABLE "ato_routes" ADD CONSTRAINT "ato_routes_app_id_ato_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."ato_apps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_installs" ADD CONSTRAINT "user_installs_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_installs" ADD CONSTRAINT "user_installs_app_id_ato_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."ato_apps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "custom_atos" ADD CONSTRAINT "custom_atos_owner_user_id_User_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "avatar_addon_purchases" ADD CONSTRAINT "avatar_addon_purchases_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
