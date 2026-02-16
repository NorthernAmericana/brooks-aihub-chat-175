export type Receipt = {
  id: string;
  ownerId: string;
  sourceUri: string;
  route: string | null;
  agentId: string | null;
  agentLabel: string | null;
  tags: string[];
  rawText: string;
  normalizedText: string | null;
  createdAt: Date;
  updatedAt: Date;
};
