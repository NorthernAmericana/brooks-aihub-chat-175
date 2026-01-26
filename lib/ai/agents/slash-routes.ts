export type SlashRouteTool =
  | "getWeather"
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions"
  | "saveMemory"
  | "saveHomeLocation";

export type SlashRoute = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  activeTools: SlashRouteTool[];
};
