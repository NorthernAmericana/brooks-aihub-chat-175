import { z } from "zod";

import type { Receipt } from "../types/receipt";

const jsonSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonSchema), z.record(z.string(), jsonSchema)]),
);

export const receiptActorSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["user", "assistant", "system", "tool"]),
});

export const receiptPolicyDecisionSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().min(1),
  policyId: z.string().min(1).optional(),
});

export const receiptSourceRefSchema = z.object({
  id: z.string().min(1),
  uri: z.string().min(1),
  title: z.string().min(1).optional(),
});

export const receiptV0Schema = z
  .object({
    schemaVersion: z.literal("0"),
    receiptId: z.string().min(1),
    sessionId: z.string().min(1),
    turnId: z.string().min(1),
    timestamp: z.string().datetime({ offset: true }),
    actor: receiptActorSchema,
    action: z.string().min(1),
    inputs: z.record(z.string(), jsonSchema),
    outputs: z.record(z.string(), jsonSchema),
    policyDecision: receiptPolicyDecisionSchema,
    sourceRefs: z.array(receiptSourceRefSchema),
    supersedesReceiptId: z.string().min(1).optional(),
  })
  .passthrough();

export const receiptSchema = receiptV0Schema;

const receiptParsersByVersion = {
  "0": receiptV0Schema,
} as const;

export function parseReceipt(input: unknown): Receipt {
  const candidate = z.object({ schemaVersion: z.string() }).passthrough().parse(input);
  const versionedParser = receiptParsersByVersion[candidate.schemaVersion as keyof typeof receiptParsersByVersion];

  if (!versionedParser) {
    throw new Error(`Unsupported receipt schemaVersion: ${candidate.schemaVersion}`);
  }

  return versionedParser.parse(input) as Receipt;
}

export function safeParseReceipt(input: unknown) {
  const versionCheck = z.object({ schemaVersion: z.string() }).passthrough().safeParse(input);

  if (!versionCheck.success) {
    return versionCheck;
  }

  const versionedParser = receiptParsersByVersion[versionCheck.data.schemaVersion as keyof typeof receiptParsersByVersion];

  if (!versionedParser) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: "custom",
          message: `Unsupported receipt schemaVersion: ${versionCheck.data.schemaVersion}`,
          path: ["schemaVersion"],
        },
      ]),
    };
  }

  return versionedParser.safeParse(input) as ReturnType<typeof receiptV0Schema.safeParse>;
}

export function isReceipt(input: unknown): input is Receipt {
  return safeParseReceipt(input).success;
}

export function validateReceipt(input: unknown): Receipt {
  return parseReceipt(input);
}
