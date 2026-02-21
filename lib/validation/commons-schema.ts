import { z } from "zod";
import { DM_RECIPIENT_LIMIT_FOUNDER } from "@/lib/commons/constants";
import { isValidDmTempRetentionHours } from "@/lib/commons/dm-retention";
import { isValidCampfirePathValue } from "@/lib/commons/routing";

const MARKDOWN_DISALLOWED_PATTERN = /<\s*\w/i;

const markdownBodySchema = z
  .string()
  .min(1)
  .max(20_000)
  .refine((value) => !MARKDOWN_DISALLOWED_PATTERN.test(value), {
    message: "Body contains disallowed markdown/html content.",
  });

export const campfirePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((value) => !value.includes(".."), {
    message: "Campfire path must not contain relative segments.",
  })
  .refine((value) => isValidCampfirePathValue(value), {
    message: "Campfire path contains invalid segments.",
  });

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export const createPostSchema = z.object({
  campfirePath: campfirePathSchema,
  title: z.string().trim().min(5).max(160),
  body: markdownBodySchema,
});

export const createCampfireSchema = z
  .object({
    mode: z.enum(["community", "dm"]).default("community"),
    retentionMode: z
      .enum(["permanent", "rolling_window", "timeboxed", "burn_on_empty"])
      .default("permanent"),
    rollingWindowSize: z.coerce.number().int().min(1).max(5000).optional(),
    expiresInHours: z.coerce.number().int().min(1).max(8760).optional(),
    name: z.string().trim().min(3).max(120).or(z.literal("")).optional(),
    description: z.string().trim().max(300).default(""),
    campfirePath: campfirePathSchema.optional(),
    recipientEmail: z.string().trim().toLowerCase().email().optional(),
    recipientEmails: z
      .array(z.string().trim().toLowerCase().email())
      .max(DM_RECIPIENT_LIMIT_FOUNDER)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "community") {
      if (!value.campfirePath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Path is required for community campfires.",
          path: ["campfirePath"],
        });
      }

      if (value.retentionMode !== "permanent") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Community campfires currently support permanent retention only.",
          path: ["retentionMode"],
        });
      }
    }

    if (value.mode === "dm") {
      const normalizedEmails = [
        ...(value.recipientEmails ?? []),
        ...(value.recipientEmail ? [value.recipientEmail] : []),
      ];

      if (!normalizedEmails.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "At least one recipient email is required for direct campfires.",
          path: ["recipientEmails"],
        });
      }

      if (!["permanent", "timeboxed"].includes(value.retentionMode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DM campfires support permanent or temporary retention.",
          path: ["retentionMode"],
        });
      }

      if (value.retentionMode === "timeboxed" && !value.expiresInHours) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Expiration hours are required when DM retention mode is temporary.",
          path: ["expiresInHours"],
        });
      }

      if (
        value.retentionMode === "timeboxed" &&
        !isValidDmTempRetentionHours(value.expiresInHours)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Temporary DM campfires must use an approved duration preset.",
          path: ["expiresInHours"],
        });
      }
    }
  });


export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1)
    .max(5000)
    .refine((value) => !MARKDOWN_DISALLOWED_PATTERN.test(value), {
      message: "Body contains disallowed markdown/html content.",
    }),
  parentCommentId: z.uuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateCampfireInput = z.infer<typeof createCampfireSchema>;
