import { generateText } from "ai";
import type { z } from "zod";
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

type AgentConfig<T = any> = {
  name: string;
  instructions: string;
  model: string;
  tools?: AgentTool[];
  outputType?: z.ZodType<T>;
  modelSettings?: {
    reasoning?: {
      effort?: string;
      summary?: string;
    };
    store?: boolean;
    temperature?: number;
  };
};

export class Agent<T = any> {
  name: string;
  instructions: string;
  model: string;
  tools?: AgentTool[];
  outputType?: z.ZodType<T>;
  modelSettings?: AgentConfig<T>["modelSettings"];

  constructor(config: AgentConfig<T>) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.model = config.model;
    this.tools = config.tools;
    this.outputType = config.outputType;
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

  async run<T = string>(agent: Agent<T>, items: AgentInputItem[]) {
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

    let finalOutput: T | string = text;

    // Try to parse JSON if outputType is provided
    if (agent.outputType) {
      try {
        const parsed = JSON.parse(text);
        finalOutput = agent.outputType.parse(parsed);
      } catch (error) {
        // Log error for debugging but continue with text fallback
        console.warn(
          "Failed to parse agent output:",
          error instanceof Error ? error.message : error
        );
        finalOutput = text as unknown as T;
      }
    }

    return {
      finalOutput,
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

export const webSearchTool = (config: {
  searchContextSize?: string;
  userLocation?: {
    country?: string;
    type?: string;
  };
}): AgentTool => ({
  type: "web_search",
  ...config,
});
