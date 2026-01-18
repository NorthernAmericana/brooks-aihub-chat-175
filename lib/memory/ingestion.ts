import type {
  MemoryIngestionPayload,
  MemoryIngestionRecord,
  MemorySourceType,
} from "./types";

export type MemoryIngestionInput = {
  sourceType: MemorySourceType;
  sourceUri: string;
  ownerId: string;
  orgId: string;
  productId: string;
  rawText: string;
  tags?: string[];
  normalizedText?: string;
  embeddingsRef?: string | null;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function buildMemoryIngestionRecord(
  input: MemoryIngestionInput,
): MemoryIngestionRecord {
  return {
    id: input.id,
    source_type: input.sourceType,
    source_uri: input.sourceUri,
    owner_id: input.ownerId,
    org_id: input.orgId,
    product_id: input.productId,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
    tags: input.tags ?? [],
    raw_text: input.rawText,
    normalized_text: input.normalizedText,
    embeddings_ref: input.embeddingsRef ?? null,
  };
}

export function buildMemoryIngestionPayload(
  records: MemoryIngestionRecord[],
): MemoryIngestionPayload {
  return { records };
}
