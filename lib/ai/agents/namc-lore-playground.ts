import {
  Agent,
  type AgentInputItem,
  fileSearchTool,
  Runner,
  webSearchTool,
  withTrace,
} from "@openai/agents";
import { runGuardrails } from "@openai/guardrails";
import { buildNamcLoreContext } from "@/lib/ai/namc-lore";
import { OpenAI } from "@/lib/openai/client";
import type { ChatMessage } from "@/lib/types";

const NAMC_VECTOR_STORE_ID = "vs_696eeaf739208191acdb5ec1e14c6b3c";

// Tool definitions
const fileSearch = fileSearchTool([NAMC_VECTOR_STORE_ID]);
const webSearchPreview = webSearchTool({
  searchContextSize: "medium",
  userLocation: {
    country: "US",
    type: "approximate",
  },
});

// Shared client for guardrails
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Guardrails definitions
type GuardrailDefinition = {
  name: string;
  config?: {
    model?: string;
    confidence_threshold?: number;
    knowledge_source?: string;
    block?: boolean;
  };
};

type GuardrailsConfig = {
  guardrails: GuardrailDefinition[];
};

const guardrailsConfig: GuardrailsConfig = {
  guardrails: [
    {
      name: "Jailbreak",
      config: { model: "gpt-4.1-mini", confidence_threshold: 0.7 },
    },
    {
      name: "Hallucination Detection",
      config: {
        model: "gpt-4o",
        knowledge_source: NAMC_VECTOR_STORE_ID,
        confidence_threshold: 0.7,
      },
    },
    {
      name: "NSFW Text",
      config: { model: "gpt-4.1-mini", confidence_threshold: 0.7 },
    },
    {
      name: "Prompt Injection Detection",
      config: { model: "gpt-4.1-mini", confidence_threshold: 0.7 },
    },
  ],
};

const context = { guardrailLlm: client };

function guardrailsHasTripwire(results: any[]): boolean {
  return (results ?? []).some((r) => r?.tripwireTriggered === true);
}

function getGuardrailSafeText(results: any[], fallbackText: string): string {
  for (const r of results ?? []) {
    if (r?.info && "checked_text" in r.info) {
      return r.info.checked_text ?? fallbackText;
    }
  }
  const pii = (results ?? []).find(
    (r) => r?.info && "anonymized_text" in r.info
  );
  return pii?.info?.anonymized_text ?? fallbackText;
}

async function scrubConversationHistory(
  history: any[],
  piiOnly: any
): Promise<void> {
  for (const msg of history ?? []) {
    const content = Array.isArray(msg?.content) ? msg.content : [];
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        part.type === "input_text" &&
        typeof part.text === "string"
      ) {
        const res = await runGuardrails(part.text, piiOnly, context, true);
        part.text = getGuardrailSafeText(res, part.text);
      }
    }
  }
}

async function scrubWorkflowInput(
  workflow: any,
  inputKey: string,
  piiOnly: any
): Promise<void> {
  if (!workflow || typeof workflow !== "object") {
    return;
  }
  const value = workflow?.[inputKey];
  if (typeof value !== "string") {
    return;
  }
  const res = await runGuardrails(value, piiOnly, context, true);
  workflow[inputKey] = getGuardrailSafeText(res, value);
}

async function runAndApplyGuardrails(
  inputText: string,
  config: GuardrailsConfig,
  history: any[],
  workflow: any
) {
  const guardrails = config.guardrails;
  const results = await runGuardrails(inputText, config, context, true);
  const shouldMaskPII = guardrails.find(
    (g) => g.name === "Contains PII" && g.config?.block === false
  );
  if (shouldMaskPII) {
    const piiOnly = { guardrails: [shouldMaskPII] };
    await scrubConversationHistory(history, piiOnly);
    await scrubWorkflowInput(workflow, "input_as_text", piiOnly);
    await scrubWorkflowInput(workflow, "input_text", piiOnly);
  }
  const hasTripwire = guardrailsHasTripwire(results);
  const safeText = getGuardrailSafeText(results, inputText) ?? inputText;
  return {
    results,
    hasTripwire,
    safeText,
    failOutput: buildGuardrailFailOutput(results ?? []),
    passOutput: { safe_text: safeText },
  };
}

function buildGuardrailFailOutput(results: any[]) {
  const get = (name: string) =>
    (results ?? []).find(
      (r: any) => (r?.info?.guardrail_name ?? r?.info?.guardrailName) === name
    );
  const pii = get("Contains PII"),
    mod = get("Moderation"),
    jb = get("Jailbreak"),
    hal = get("Hallucination Detection"),
    nsfw = get("NSFW Text"),
    url = get("URL Filter"),
    custom = get("Custom Prompt Check"),
    pid = get("Prompt Injection Detection"),
    detectedEntities = (pii?.info?.detected_entities ?? {}) as Record<
      string,
      unknown
    >,
    piiCounts = Object.entries(detectedEntities).flatMap(([k, v]) =>
      Array.isArray(v) ? [`${k}:${v.length}`] : []
    ),
    _conf = jb?.info?.confidence;
  return {
    pii: {
      failed: piiCounts.length > 0 || pii?.tripwireTriggered === true,
      detected_counts: piiCounts,
    },
    moderation: {
      failed:
        mod?.tripwireTriggered === true ||
        (mod?.info?.flagged_categories ?? []).length > 0,
      flagged_categories: mod?.info?.flagged_categories,
    },
    jailbreak: { failed: jb?.tripwireTriggered === true },
    hallucination: {
      failed: hal?.tripwireTriggered === true,
      reasoning: hal?.info?.reasoning,
      hallucination_type: hal?.info?.hallucination_type,
      hallucinated_statements: hal?.info?.hallucinated_statements,
      verified_statements: hal?.info?.verified_statements,
    },
    nsfw: { failed: nsfw?.tripwireTriggered === true },
    url_filter: { failed: url?.tripwireTriggered === true },
    custom_prompt_check: { failed: custom?.tripwireTriggered === true },
    prompt_injection: { failed: pid?.tripwireTriggered === true },
  };
}

const namcLorePlayground = new Agent({
  name: "NAMC Lore Playground",
  instructions: `You are the /NAMC/Lore-Playground/ assistant inside Brooks AI HUB.

Purpose & Identity
- You help users explore NAMC lore + external media lore (movies, TV, games, books, etc.)
- You assist with headcanon development, worldbuilding, and creative storytelling
- You provide spoiler-aware guidance (always ask before revealing major plot points)
- You use web search to find lore information when needed and help users discover connections
- You help users track their progress and levels in specific games (both NAMC and non-NAMC games)

Core Behavior
- Be warm, curious, and supportive of creative exploration
- Ask clarifying questions when lore context is ambiguous
- Encourage users to develop their own headcanons while respecting official canon
- When discussing NAMC projects, use existing NAMC lore knowledge
- When discussing external media, rely on web search and your training data
- Explicitly label source confidence for external media statements as one of:
  - Official canon
  - Widely accepted interpretation
  - Fan theory/headcanon
- Always warn before spoilers and let users opt in
- You are a client-facing assistant; never assume the user is the founder
- Review shared memory context provided by the system before responding; use it only when relevant

NAMC Lore Assistance
- Help users explore NAMC story worlds, characters, timelines, and themes
- Connect different NAMC projects when relevant (e.g., shared universe elements)
- Provide context for NAMC media without assuming internal knowledge
- Keep responses client-facing and promotional

External Media Lore Assistance
- Use web search to find up-to-date information about any movie, TV show, game, book, or other media
- Help users explore lore from any pop culture property
- Provide factual lore information based on web search results and your training
- Help users develop theories and headcanons
- Connect themes and patterns across different media
- For multi-media comparisons (movies/games/books/anime/comics), avoid overclaiming shared continuity unless directly supported by canon
- If universes, timelines, or adaptations conflict in a comparison, ask exactly one clarifying question before deep analysis

Game Progress & Level Tracking
- Help users track their progress in NAMC games and external games
- Discuss game mechanics, level progression, achievements, and challenges
- Provide tips and strategies for games when requested
- Help users organize their gaming goals and milestones
- Support both casual and dedicated gaming discussions

Headcanon Support
- Encourage creative interpretation and fan theories
- Help users build consistent headcanons that fit within established lore
- Offer alternative perspectives when users are stuck
- Never dismiss user interpretations unless they contradict core facts

Spoiler Awareness
- ALWAYS ask before revealing major plot twists, character deaths, or story endings
- Use spoiler tags format: ||spoiler text here|| when appropriate
- Let users specify how much they know before diving deep
- Respect user preferences for spoiler-free vs full discussion
- Before deep lore synthesis, confirm the user's spoiler level preference first (spoiler-free, light spoilers, or full spoilers)

Web Search Usage
- When users ask about external media lore, use web search to find accurate information
- Search for game guides, walkthroughs, lore wikis, and official sources
- Verify information across multiple sources when possible
- Always cite when you've used web search to answer a question

Response Style
- Keep initial responses concise and inviting
- Ask "How much do you know about [topic]?" before deep dives
- Use bullet points for lore summaries
- Reference specific episodes, chapters, or scenes when helpful
- Suggest related lore topics for further exploration

Lore Reply Template (for direct lore requests)
- Canon facts
- Open ambiguities
- Headcanon options (2-3)
- Continuity risks
- Suggested next question

Built-in Example Prompt Intents (default toward collaborative headcanon creation)
- "Help me create a headcanon that explains this character's unseen motivations without breaking canon."
- "Give me 2-3 alternate headcanon paths for this timeline gap, then let me choose one to develop."
- "Compare canon vs my idea and help me revise my headcanon so it stays internally consistent."
- "Brainstorm crossover-safe headcanon links between these two franchises while marking confidence levels."
- "Turn my rough theory into a lore note with canon facts, ambiguities, and continuity checks."

Memory & Receipts
- Ask permission before saving anything to memory
- Only save when explicitly approved by the user
- When users ask you to remember game progress or lore notes, use the saveMemory tool after confirming`,
  model: "gpt-5.2",
  tools: [fileSearch, webSearchPreview],
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto",
    },
    store: true,
  },
});

const buildLorePlaygroundConversationHistory = (
  messages: ChatMessage[],
  loreContext?: string,
  memoryContext?: string
): AgentInputItem[] => {
  const conversationHistory = messages
    .map((message) => {
      const text = message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      if (!text.trim()) {
        return null;
      }

      return {
        role: message.role,
        content: [
          {
            type: message.role === "assistant" ? "output_text" : "input_text",
            text,
          },
        ],
      } satisfies AgentInputItem;
    })
    .filter((item): item is AgentInputItem => item !== null);

  const systemContexts = [loreContext, memoryContext].filter(
    (context): context is string => Boolean(context)
  );

  if (systemContexts.length > 0) {
    return [
      {
        role: "system",
        content: systemContexts.map((context) => ({
          type: "input_text",
          text: context,
        })),
      },
      ...conversationHistory,
    ];
  }

  return conversationHistory;
};

export const runNamcLorePlayground = async ({
  messages,
  latestUserMessage,
  loreContext,
  memoryContext,
}: {
  messages: ChatMessage[];
  latestUserMessage?: ChatMessage | null;
  loreContext?: string | null;
  memoryContext?: string | null;
}): Promise<string> => {
  return await withTrace("NAMC Lore Playground", async () => {
    const lastUserMessage =
      latestUserMessage ??
      [...(messages ?? [])]
        .reverse()
        .find((message) => message.role === "user");
    const inputText =
      lastUserMessage?.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("") ?? "";
    const resolvedLoreContext =
      loreContext ??
      (inputText.trim() ? await buildNamcLoreContext(inputText) : null);
    const conversationHistory = buildLorePlaygroundConversationHistory(
      messages,
      resolvedLoreContext ?? undefined,
      memoryContext ?? undefined
    );
    const workflow = {
      input_as_text: inputText,
      input_text: inputText,
    };
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_namc_lore_playground",
      },
    });
    const guardrailsInputText = workflow.input_as_text;
    const {
      hasTripwire: guardrailsHasTripwire,
      failOutput: guardrailsFailOutput,
    } = await runAndApplyGuardrails(
      guardrailsInputText,
      guardrailsConfig,
      conversationHistory,
      workflow
    );
    if (guardrailsHasTripwire) {
      return JSON.stringify(guardrailsFailOutput);
    }

    const namcLorePlaygroundResultTemp = await runner.run(namcLorePlayground, [
      ...conversationHistory,
    ]);
    conversationHistory.push(
      ...namcLorePlaygroundResultTemp.newItems.map((item) => item.rawItem)
    );

    if (!namcLorePlaygroundResultTemp.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    return namcLorePlaygroundResultTemp.finalOutput ?? "";
  });
};
