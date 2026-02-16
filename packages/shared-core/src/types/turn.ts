export type TurnRole = "user" | "assistant" | "system";

export type MessageMetadata = {
  createdAt: string;
};

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};

export type ArtifactKind = "text" | "code" | "image" | "sheet";

export type SuggestionData = {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
};

export type TurnUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: SuggestionData;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  "chat-title": string;
};

export type SessionTurn = {
  id: string;
  sessionId: string;
  role: TurnRole;
  parts: unknown;
  attachments: Attachment[];
  createdAt: Date;
};
