import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  json,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  birthday: varchar("birthday", { length: 10 }),
  messageColor: text("messageColor"),
  avatarUrl: text("avatarUrl"),
  foundersAccess: boolean("foundersAccess").default(false),
  foundersAccessGrantedAt: timestamp("foundersAccessGrantedAt"),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  routeKey: text("routeKey"),
  sessionType: varchar("sessionType", { enum: ["chat", "video-call"] })
    .notNull()
    .default("chat"),
  ttsEnabled: boolean("ttsEnabled").default(true),
  ttsVoiceId: text("ttsVoiceId"),
  ttsVoiceLabel: text("ttsVoiceLabel"),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const memory = pgTable("Memory", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  memoryKey: text("memoryKey").notNull(),
  memoryVersion: integer("memoryVersion").notNull().default(1),
  supersedesMemoryId: uuid("supersedesMemoryId"),
  validFrom: timestamp("validFrom").notNull().defaultNow(),
  validTo: timestamp("validTo"),
  stalenessReason: text("stalenessReason"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  sourceType: varchar("sourceType", {
    enum: ["chat", "document", "file", "web", "integration", "manual"],
  }).notNull(),
  sourceUri: text("sourceUri").notNull(),
  ownerId: uuid("ownerId")
    .notNull()
    .references(() => user.id),
  orgId: varchar("orgId", { length: 64 }).notNull().default("default"),
  productId: varchar("productId", { length: 64 })
    .notNull()
    .default("brooks-aihub"),
  route: varchar("route", { length: 128 }),
  agentId: varchar("agentId", { length: 64 }),
  agentLabel: varchar("agentLabel", { length: 128 }),
  isApproved: boolean("isApproved").notNull().default(false),
  approvedAt: timestamp("approvedAt"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  rawText: text("rawText").notNull(),
  normalizedText: text("normalizedText"),
  embeddingsRef: text("embeddingsRef"),
},
  (table) => ({
    ownerMemoryVersionIdx: uniqueIndex("Memory_owner_memory_version_idx").on(
      table.ownerId,
      table.memoryKey,
      table.memoryVersion
    ),
    supersedesMemoryRef: foreignKey({
      columns: [table.supersedesMemoryId],
      foreignColumns: [table.id],
      name: "Memory_supersedesMemoryId_Memory_id_fk",
    }),
  })
);

export type Memory = InferSelectModel<typeof memory>;

export const userLocation = pgTable("UserLocation", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  ownerId: uuid("ownerId")
    .notNull()
    .references(() => user.id),
  chatId: uuid("chatId").references(() => chat.id),
  route: varchar("route", { length: 128 }).notNull(),
  locationType: varchar("locationType", {
    enum: ["home-location"],
  }).notNull(),
  rawText: text("rawText").notNull(),
  normalizedText: text("normalizedText"),
  isApproved: boolean("isApproved").notNull().default(false),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserLocation = InferSelectModel<typeof userLocation>;

export const userVehicle = pgTable("UserVehicle", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  ownerId: uuid("ownerId")
    .notNull()
    .references(() => user.id),
  chatId: uuid("chatId").references(() => chat.id),
  route: varchar("route", { length: 128 }).notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  isApproved: boolean("isApproved").notNull().default(false),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserVehicle = InferSelectModel<typeof userVehicle>;

export const unofficialAto = pgTable("UnofficialAto", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  route: text("route"),
  description: text("description"),
  personalityName: text("personalityName"),
  instructions: text("instructions"),
  intelligenceMode: varchar("intelligenceMode", {
    enum: ["Hive", "ATO-Limited"],
  })
    .notNull()
    .default("ATO-Limited"),
  defaultVoiceId: text("defaultVoiceId"),
  defaultVoiceLabel: text("defaultVoiceLabel"),
  webSearchEnabled: boolean("webSearchEnabled").notNull().default(false),
  fileSearchEnabled: boolean("fileSearchEnabled").notNull().default(false),
  fileUsageEnabled: boolean("fileUsageEnabled").notNull().default(false),
  fileStoragePath: text("fileStoragePath"),
  ownerUserId: uuid("ownerUserId")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  planMetadata: json("planMetadata").$type<Record<string, unknown>>(),
});

export type UnofficialAto = InferSelectModel<typeof unofficialAto>;

export const routeRegistry = pgTable("RouteRegistry", {
  id: varchar("id", { length: 64 }).primaryKey().notNull(),
  label: text("label").notNull(),
  slash: text("slash").notNull(),
  description: text("description"),
});

export type RouteRegistry = InferSelectModel<typeof routeRegistry>;

export const atoApps = pgTable("ato_apps", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  category: text("category"),
  storePath: text("store_path"),
  appPath: text("app_path"),
  isOfficial: boolean("is_official").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AtoApp = InferSelectModel<typeof atoApps>;

export const atoRoutes = pgTable("ato_routes", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  appId: uuid("app_id")
    .notNull()
    .references(() => atoApps.id),
  slash: text("slash").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  agentId: text("agent_id"),
  toolPolicy: json("tool_policy")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  isFoundersOnly: boolean("is_founders_only").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AtoRoute = InferSelectModel<typeof atoRoutes>;

export const userInstalls = pgTable("user_installs", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  appId: uuid("app_id")
    .notNull()
    .references(() => atoApps.id),
  installedAt: timestamp("installed_at").notNull().defaultNow(),
  lastOpenedAt: timestamp("last_opened_at"),
}, (table) => ({
  appUserUnique: uniqueIndex("user_installs_app_id_user_id_unique").on(
    table.appId,
    table.userId
  ),
}));

export type UserInstall = InferSelectModel<typeof userInstalls>;

export const atoAppReviews = pgTable("ato_app_reviews", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  appId: uuid("app_id")
    .notNull()
    .references(() => atoApps.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  rating: integer("rating").notNull(),
  body: text("body"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  appUserUnique: uniqueIndex("ato_app_reviews_app_id_user_id_unique").on(
    table.appId,
    table.userId
  ),
}));

export type AtoAppReview = InferSelectModel<typeof atoAppReviews>;

export const entitlements = pgTable("entitlements", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  productId: varchar("product_id", { length: 64 }).notNull(),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  grantedBy: varchar("granted_by", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

export type EntitlementRecord = InferSelectModel<typeof entitlements>;

export const customAtos = pgTable("custom_atos", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  route: text("route"),
  description: text("description"),
  personalityName: text("personality_name"),
  instructions: text("instructions"),
  toolPolicy: json("tool_policy").$type<Record<string, unknown>>(),
  hasAvatar: boolean("has_avatar").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CustomAto = InferSelectModel<typeof customAtos>;

export const avatarAddonPurchases = pgTable("avatar_addon_purchases", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  addonSku: varchar("addon_sku", { length: 64 }).notNull(),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  priceCents: integer("price_cents"),
  currency: varchar("currency", { length: 3 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

export type AvatarAddonPurchase = InferSelectModel<typeof avatarAddonPurchases>;

export const storeProducts = pgTable("store_products", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  type: varchar("type", {
    enum: ["merch", "digital_media", "digital_code"],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  externalUrl: text("external_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type StoreProduct = InferSelectModel<typeof storeProducts>;

export const atoFile = pgTable("AtoFile", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  atoId: uuid("atoId")
    .notNull()
    .references(() => unofficialAto.id),
  ownerUserId: uuid("ownerUserId")
    .notNull()
    .references(() => user.id),
  filename: text("filename").notNull(),
  blobUrl: text("blobUrl").notNull(),
  blobPathname: text("blobPathname").notNull(),
  contentType: text("contentType").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type AtoFile = InferSelectModel<typeof atoFile>;

export const review = pgTable("Review", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  placeId: text("placeId").notNull(),
  placeName: text("placeName").notNull(),
  placeSource: varchar("placeSource", { length: 32 }),
  googleMapsUrl: text("googleMapsUrl"),
  rating: integer("rating").notNull(),
  reviewText: text("reviewText").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Review = InferSelectModel<typeof review>;

export const reviewPhoto = pgTable("ReviewPhoto", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  reviewId: uuid("reviewId").references(() => review.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  placeId: text("placeId").notNull(),
  placeName: text("placeName").notNull(),
  blobUrl: text("blobUrl").notNull(),
  blobPathname: text("blobPathname").notNull(),
  contentType: text("contentType").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ReviewPhoto = InferSelectModel<typeof reviewPhoto>;

// Entitlements table for product ownership
export const entitlement = pgTable("Entitlement", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  productId: varchar("productId", { length: 64 }).notNull(), // MDD-GAME_BASE, MDD_NOVEL_BASE, MDD_SPOILER_PASS
  grantedAt: timestamp("grantedAt").notNull().defaultNow(),
  grantedBy: varchar("grantedBy", { length: 64 }).notNull(), // stripe, redemption_code, admin, etc.
  expiresAt: timestamp("expiresAt"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

export type Entitlement = InferSelectModel<typeof entitlement>;

// Redemption codes table
export const redemptionCode = pgTable("RedemptionCode", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  productId: varchar("productId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt"),
  maxRedemptions: varchar("maxRedemptions", { length: 32 }).default("1"), // "1", "unlimited", or a number
  redemptionCount: varchar("redemptionCount", { length: 32 }).default("0"),
  isActive: boolean("isActive").default(true),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

export type RedemptionCode = InferSelectModel<typeof redemptionCode>;

// Track individual redemptions
export const redemption = pgTable("Redemption", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  codeId: uuid("codeId")
    .notNull()
    .references(() => redemptionCode.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  redeemedAt: timestamp("redeemedAt").notNull().defaultNow(),
});

export type Redemption = InferSelectModel<typeof redemption>;

// User Inventory table for privacy-safe cannabis inventory tracking
// See: /docs/myflowerai/inventory-management.md
export const userInventory = pgTable("user_inventory", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  schemaVersion: varchar("schema_version", { length: 10 }).notNull().default("1.0"),
  inventoryId: uuid("inventory_id").notNull().unique().defaultRandom(),
  strainId: varchar("strain_id", { length: 255 }).notNull(),
  
  // Privacy metadata
  storageLocation: varchar("storage_location", { length: 50 })
    .notNull()
    .default("database_user_private"),
  userConsent: boolean("user_consent").notNull().default(false),
  
  // Inventory details (privacy-safe with bucketed values and month granularity)
  acquiredMonth: varchar("acquired_month", { length: 7 }), // YYYY-MM format only
  opened: boolean("opened").default(false),
  remainingEstimate: varchar("remaining_estimate", { length: 20 }), // Bucketed: full, half, low, empty
  storageType: varchar("storage_type", { length: 50 }),
  hasHumidipack: boolean("has_humidipack"),
  storageLocationType: varchar("storage_location_type", { length: 50 }),
  qualityNotes: text("quality_notes"),
  tags: text("tags").array(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserInventory = InferSelectModel<typeof userInventory>;

// Personal Fit table for privacy-safe personal strain fit tracking
// See: /docs/myflowerai/personal-fit.md
export const personalFit = pgTable("personal_fit", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  schemaVersion: varchar("schema_version", { length: 10 }).notNull().default("1.0"),
  personalFitId: uuid("personal_fit_id").notNull().unique().defaultRandom(),
  strainId: varchar("strain_id", { length: 255 }).notNull(),
  
  // Privacy metadata
  storageLocation: varchar("storage_location", { length: 50 })
    .notNull()
    .default("database_user_private"),
  userConsent: boolean("user_consent").notNull().default(false),
  
  // Personal fit details
  rating1to10: varchar("rating_1to10", { length: 10 }), // Stored as string to allow null/optional
  bestFor: text("best_for").array(), // User's personal tags for what this works best for
  avoidFor: text("avoid_for").array(), // User's personal tags for when to avoid
  repeatProbability0to1: varchar("repeat_probability_0to1", { length: 10 }), // Stored as string to allow null/optional
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PersonalFit = InferSelectModel<typeof personalFit>;

// MyFlowerAI Quiz Results table for privacy-safe quiz completion tracking
// See: /docs/myflowerai/quiz-to-aura.md
export const myfloweraiQuizResults = pgTable("myflowerai_quiz_results", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  quizId: varchar("quiz_id", { length: 100 }).notNull(),
  personaId: varchar("persona_id", { length: 100 }).notNull(),
  createdMonth: varchar("created_month", { length: 7 }).notNull(), // YYYY-MM format only (privacy-safe)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MyfloweraiQuizResult = InferSelectModel<typeof myfloweraiQuizResults>;

// MyFlowerAI Generated Images table for privacy-safe image tracking
// See: /docs/myflowerai/quiz-to-aura.md
export const myfloweraiImages = pgTable("myflowerai_images", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  personaId: varchar("persona_id", { length: 100 }),
  strainId: varchar("strain_id", { length: 255 }),
  presetId: varchar("preset_id", { length: 100 }),
  storageKey: text("storage_key").notNull(), // Vercel Blob storage key (not signed URL)
  createdMonth: varchar("created_month", { length: 7 }).notNull(), // YYYY-MM format only (privacy-safe)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MyfloweraiImage = InferSelectModel<typeof myfloweraiImages>;

export const myflowerDailyGoals = pgTable("myflower_daily_goals", {
  userId: uuid("user_id")
    .primaryKey()
    .notNull()
    .references(() => user.id),
  targetG: numeric("target_g").notNull().default("0"),
  targetMgThc: numeric("target_mg_thc"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MyflowerDailyGoal = InferSelectModel<typeof myflowerDailyGoals>;

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  url: text("url").notNull(),
  contentType: text("content_type").notNull(),
  bytes: integer("bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MediaAsset = InferSelectModel<typeof mediaAssets>;

export const myflowerLogs = pgTable("myflower_logs", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  productType: varchar("product_type", {
    enum: [
      "flower",
      "vape",
      "edible",
      "tincture",
      "concentrate",
      "topical",
      "other",
    ],
  }).notNull(),
  strainSlug: varchar("strain_slug", { length: 255 }),
  strainName: text("strain_name"),
  amountG: numeric("amount_g"),
  amountMgThc: numeric("amount_mg_thc"),
  notes: text("notes"),
  photoAssetId: uuid("photo_asset_id").references(() => mediaAssets.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MyflowerLog = InferSelectModel<typeof myflowerLogs>;

export const myflowerPosts = pgTable("myflower_posts", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  kind: varchar("kind", {
    enum: ["log", "photo", "check_in", "note"],
  }).notNull(),
  caption: text("caption"),
  mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id),
  metadata: jsonb("metadata"),
  visibility: varchar("visibility", {
    enum: ["public", "private", "unlisted"],
  }).notNull(),
  sourceApp: text("source_app").notNull().default("myflowerai"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MyflowerPost = InferSelectModel<typeof myflowerPosts>;

export const commonsCampfire = pgTable(
  "campfires",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    path: varchar("path", { length: 128 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull().default(""),
    createdById: uuid("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false),
    isPrivate: boolean("is_private").notNull().default(false),
  },
  (table) => ({
    slugUniqueIdx: uniqueIndex("campfires_slug_unique_idx").on(table.slug),
    pathUniqueIdx: uniqueIndex("campfires_path_unique_idx").on(table.path),
  })
);

export type CommonsCampfire = InferSelectModel<typeof commonsCampfire>;

export const commonsPost = pgTable("commons_posts", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  campfireId: uuid("campfire_id")
    .notNull()
    .references(() => commonsCampfire.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
  bodyFormat: varchar("body_format", { enum: ["markdown", "plain"] })
    .notNull()
    .default("markdown"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
  isVisible: boolean("is_visible").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export type CommonsPost = InferSelectModel<typeof commonsPost>;

export const commonsComment = pgTable(
  "commons_comments",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => commonsPost.id, { onDelete: "cascade" }),
    parentCommentId: uuid("parent_comment_id"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    bodyFormat: varchar("body_format", { enum: ["markdown", "plain"] })
      .notNull()
      .default("markdown"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
    isVisible: boolean("is_visible").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (table) => ({
    parentCommentRef: foreignKey({
      columns: [table.parentCommentId],
      foreignColumns: [table.id],
      name: "commons_comments_parent_comment_id_commons_comments_id_fk",
    }),
  })
);

export type CommonsComment = InferSelectModel<typeof commonsComment>;

export const commonsVote = pgTable(
  "commons_votes",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    postId: uuid("post_id").references(() => commonsPost.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("comment_id").references(() => commonsComment.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: integer("value").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (table) => ({
    postVotePerUserUniqueIdx: uniqueIndex("commons_votes_post_user_unique_idx").on(
      table.postId,
      table.userId
    ),
    commentVotePerUserUniqueIdx: uniqueIndex(
      "commons_votes_comment_user_unique_idx"
    ).on(table.commentId, table.userId),
  })
);

export type CommonsVote = InferSelectModel<typeof commonsVote>;

export const commonsReport = pgTable("commons_reports", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  postId: uuid("post_id").references(() => commonsPost.id, {
    onDelete: "cascade",
  }),
  commentId: uuid("comment_id").references(() => commonsComment.id, {
    onDelete: "cascade",
  }),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: varchar("reason", { length: 64 }).notNull(),
  details: text("details"),
  status: varchar("status", {
    enum: ["open", "reviewing", "dismissed", "resolved"],
  })
    .notNull()
    .default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export type CommonsReport = InferSelectModel<typeof commonsReport>;
