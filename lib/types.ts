import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type {
  Attachment,
  MessageMetadata,
  SuggestionData,
  TurnUIDataTypes,
} from "@/packages/shared-core/src";
import type { createDocument } from "./ai/tools/create-document";
import type { getDirections } from "./ai/tools/get-directions";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { saveHomeLocation } from "./ai/tools/save-home-location";
import type { saveMemory } from "./ai/tools/save-memory";
import type { updateDocument } from "./ai/tools/update-document";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type { Attachment, MessageMetadata };

type weatherTool = InferUITool<typeof getWeather>;
type directionsTool = InferUITool<typeof getDirections>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type saveHomeLocationTool = InferUITool<ReturnType<typeof saveHomeLocation>>;
type saveMemoryTool = InferUITool<ReturnType<typeof saveMemory>>;

export type ChatTools = {
  getWeather: weatherTool;
  getDirections: directionsTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  saveHomeLocation: saveHomeLocationTool;
  saveMemory: saveMemoryTool;
};

export type CustomUIDataTypes = Omit<TurnUIDataTypes, "suggestion"> & {
  suggestion: SuggestionData;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;
