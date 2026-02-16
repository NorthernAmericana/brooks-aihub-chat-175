export type MemorySourceType =
  | "chat"
  | "document"
  | "file"
  | "web"
  | "integration"
  | "manual";

export type MemoryRecord = {
  id: string;
  source_type: MemorySourceType;
  source_uri: string;
  owner_id: string;
  org_id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  raw_text: string;
  normalized_text: string;
  embeddings_ref: string | null;
};

export type MemoryIngestionRecord = {
  id?: string;
  source_type: MemorySourceType;
  source_uri: string;
  owner_id: string;
  org_id: string;
  product_id: string;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
  raw_text: string;
  normalized_text?: string;
  embeddings_ref?: string | null;
};

export type MemoryIngestionPayload = {
  records: MemoryIngestionRecord[];
};

export type Memory = {
  id: string;
  memoryKey: string;
  memoryVersion: number;
  supersedesMemoryId: string | null;
  validFrom: Date;
  validTo: Date | null;
  stalenessReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  sourceType: MemorySourceType;
  sourceUri: string;
  ownerId: string;
  orgId: string;
  productId: string;
  route: string | null;
  agentId: string | null;
  agentLabel: string | null;
  isApproved: boolean;
  approvedAt: Date | null;
  tags: string[];
  rawText: string;
  normalizedText: string | null;
  embeddingsRef: string | null;
};
