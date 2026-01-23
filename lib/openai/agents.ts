import { generateText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";

type AgentInputText = {
  type: "input_text" | "output_text";
  text: string;
};

export type AgentInputItem = {
  role: "user" | "assistant" | "system";
  content: AgentInputText[];
};

export type AgentTool = {
  type: string;
  [key: string]: unknown;
};

type AgentConfig = {
  name: string;
  instructions: string;
  model: string;
  tools?: AgentTool[];
  modelSettings?: {
    reasoning?: {
      effort?: string;
      summary?: string;
    };
    store?: boolean;
  };
};

export class Agent {
  name: string;
  instructions: string;
  model: string;
  tools?: AgentTool[];
  modelSettings?: AgentConfig["modelSettings"];

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.model = config.model;
    this.tools = config.tools;
    this.modelSettings = config.modelSettings;
  }
}

export class Runner {
  traceMetadata?: Record<string, string>;

  constructor({
    traceMetadata,
  }: { traceMetadata?: Record<string, string> } = {}) {
    this.traceMetadata = traceMetadata;
  }

  async run(agent: Agent, items: AgentInputItem[]) {
    const prompt = items
      .map((item) => {
        const text = item.content.map((part) => part.text).join("");
        if (!text) {
          return null;
        }
        return `${item.role.toUpperCase()}: ${text}`;
      })
      .filter(Boolean)
      .join("\n\n");

    const { text } = await generateText({
      model: getLanguageModel(agent.model),
      system: agent.instructions,
      prompt,
    });

    return {
      finalOutput: text,
      newItems: [
        {
          rawItem: {
            role: "assistant",
            content: [{ type: "output_text", text }],
          } satisfies AgentInputItem,
        },
      ],
    };
  }
}

export const withTrace = async <T>(
  _name: string,
  fn: () => Promise<T>
): Promise<T> => fn();

export const fileSearchTool = (vectorStoreIds: string[]): AgentTool => ({
  type: "file_search",
  vectorStoreIds,
});
