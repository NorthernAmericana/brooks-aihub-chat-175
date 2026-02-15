import { z } from "zod";
import { CAMPFIRE_SEGMENT_REGEX } from "@/lib/commons/routing";

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
  .refine(
    (value) =>
      value.split("/").every((segment) => CAMPFIRE_SEGMENT_REGEX.test(segment)),
    {
      message: "Campfire path contains invalid segments.",
    }
  );

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
    name: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(300).default(""),
    campfirePath: campfirePathSchema.optional(),
    recipientEmail: z.string().trim().toLowerCase().email().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "community") {
      if (!value.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Name is required for community campfires.",
          path: ["name"],
        });
      }

      if (!value.campfirePath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Path is required for community campfires.",
          path: ["campfirePath"],
        });
      }
    }

    if (value.mode === "dm" && !value.recipientEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recipient email is required for direct campfires.",
        path: ["recipientEmail"],
      });
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
