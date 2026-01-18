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

export const slashRoutes: SlashRoute[] = [
  {
    id: "general",
    label: "General ATO",
    description: "Balanced assistance for everyday tasks.",
    prompt:
      "You are operating in the General ATO. Provide balanced guidance and use tools when helpful.",
    activeTools: [
      "getWeather",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
    ],
  },
  {
    id: "briefing",
    label: "Briefing ATO",
    description: "Concise summaries, quick status updates, and highlights.",
    prompt:
      "You are operating in the Briefing ATO. Prioritize concise summaries, bullet points, and actionable takeaways.",
    activeTools: ["getWeather"],
  },
  {
    id: "builder",
    label: "Builder ATO",
    description: "Document-heavy workflows and structured outputs.",
    prompt:
      "You are operating in the Builder ATO. Default to structured outputs and use artifacts for longer deliverables.",
    activeTools: ["createDocument", "updateDocument", "requestSuggestions"],
  },
];

export const defaultSlashRouteId = "general";

export const getSlashRouteById = (id?: string | null) =>
  slashRoutes.find((route) => route.id === id);

export const getDefaultSlashRoute = () =>
  getSlashRouteById(defaultSlashRouteId) ?? slashRoutes[0];
