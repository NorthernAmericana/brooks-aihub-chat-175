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
