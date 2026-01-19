export type SlashRouteTool =
  | "getWeather"
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions";

export type SlashRoute = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  activeTools: SlashRouteTool[];
};
