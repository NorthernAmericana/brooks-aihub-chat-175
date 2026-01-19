declare module "@openai/agents" {
  export type AgentInputItem = {
    role: string;
    content: unknown[];
  };

  export class Agent {
    constructor(options: {
      name: string;
      instructions: string;
      model?: string;
      modelSettings?: {
        reasoning?: { effort?: string; summary?: string };
        store?: boolean;
      };
    });
  }

  export class Runner {
    constructor(options?: { traceMetadata?: Record<string, string> });
    run(
      agent: Agent,
      items: AgentInputItem[]
    ): Promise<{
      newItems: Array<{ rawItem: AgentInputItem }>;
      finalOutput?: string;
    }>;
  }

  export function withTrace<T>(
    name: string,
    callback: () => Promise<T>
  ): Promise<T>;
}
