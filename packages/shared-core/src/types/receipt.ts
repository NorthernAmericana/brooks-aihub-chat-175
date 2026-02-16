export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type JsonObject = {
  readonly [key: string]: JsonValue;
};

export type JsonArray = readonly JsonValue[];

export type ReceiptActor = {
  readonly id: string;
  readonly type: "user" | "assistant" | "system" | "tool";
};

export type ReceiptPolicyDecision = {
  readonly allowed: boolean;
  readonly reason: string;
  readonly policyId?: string;
};

export type ReceiptSourceRef = {
  readonly id: string;
  readonly uri: string;
  readonly title?: string;
};

/**
 * Immutable append-only event contract.
 *
 * - Receipts must never be updated in place.
 * - Corrections are represented as a new receipt that points to the previous
 *   receipt via `supersedesReceiptId`.
 */
export type ReceiptV0 = {
  readonly schemaVersion: "0";
  readonly receiptId: string;
  readonly sessionId: string;
  readonly turnId: string;
  readonly timestamp: string;
  readonly actor: ReceiptActor;
  readonly action: string;
  readonly inputs: JsonObject;
  readonly outputs: JsonObject;
  readonly policyDecision: ReceiptPolicyDecision;
  readonly sourceRefs: readonly ReceiptSourceRef[];
  readonly supersedesReceiptId?: string;
};

export type Receipt = ReceiptV0;
