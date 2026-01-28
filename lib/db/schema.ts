import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
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
});

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

export const unofficialAto = pgTable("UnofficialAto", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
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
