export type SlashRouteTool =
  | "getWeather"
  | "getDirections"
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
