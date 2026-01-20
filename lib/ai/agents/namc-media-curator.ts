import { fileSearchTool, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";
import { OpenAI } from "openai";
import { runGuardrails } from "@openai/guardrails";
import type { ChatMessage } from "@/lib/types";


// Tool definitions
const fileSearch = fileSearchTool([
  "vs_696eeaf739208191acdb5ec1e14c6b3c"
])

// Shared client for guardrails and file search
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
    { name: "Jailbreak", config: { model: "gpt-4.1-mini", confidence_threshold: 0.7 } },
    { name: "Hallucination Detection", config: { model: "gpt-4o", knowledge_source: "vs_696eeaf739208191acdb5ec1e14c6b3c", confidence_threshold: 0.7 } },
    { name: "NSFW Text", config: { model: "gpt-4.1-mini", confidence_threshold: 0.7 } },
    { name: "Prompt Injection Detection", config: { model: "gpt-4.1-mini", confidence_threshold: 0.7 } }
  ]
};
const context = { guardrailLlm: client };

function guardrailsHasTripwire(results: any[]): boolean {
    return (results ?? []).some((r) => r?.tripwireTriggered === true);
}

function getGuardrailSafeText(results: any[], fallbackText: string): string {
    for (const r of results ?? []) {
        if (r?.info && ("checked_text" in r.info)) {
            return r.info.checked_text ?? fallbackText;
        }
    }
    const pii = (results ?? []).find((r) => r?.info && "anonymized_text" in r.info);
    return pii?.info?.anonymized_text ?? fallbackText;
}

async function scrubConversationHistory(history: any[], piiOnly: any): Promise<void> {
    for (const msg of history ?? []) {
        const content = Array.isArray(msg?.content) ? msg.content : [];
        for (const part of content) {
            if (part && typeof part === "object" && part.type === "input_text" && typeof part.text === "string") {
                const res = await runGuardrails(part.text, piiOnly, context, true);
                part.text = getGuardrailSafeText(res, part.text);
            }
        }
    }
}

async function scrubWorkflowInput(workflow: any, inputKey: string, piiOnly: any): Promise<void> {
    if (!workflow || typeof workflow !== "object") return;
    const value = workflow?.[inputKey];
    if (typeof value !== "string") return;
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
    return { results, hasTripwire, safeText, failOutput: buildGuardrailFailOutput(results ?? []), passOutput: { safe_text: safeText } };
}

function buildGuardrailFailOutput(results: any[]) {
    const get = (name: string) => (results ?? []).find((r: any) => ((r?.info?.guardrail_name ?? r?.info?.guardrailName) === name));
    const pii = get("Contains PII"), mod = get("Moderation"), jb = get("Jailbreak"), hal = get("Hallucination Detection"), nsfw = get("NSFW Text"), url = get("URL Filter"), custom = get("Custom Prompt Check"), pid = get("Prompt Injection Detection"), piiCounts = Object.entries(pii?.info?.detected_entities ?? {}).filter(([, v]) => Array.isArray(v)).map(([k, v]) => k + ":" + v.length), conf = jb?.info?.confidence;
    return {
        pii: { failed: (piiCounts.length > 0) || pii?.tripwireTriggered === true, detected_counts: piiCounts },
        moderation: { failed: mod?.tripwireTriggered === true || ((mod?.info?.flagged_categories ?? []).length > 0), flagged_categories: mod?.info?.flagged_categories },
        jailbreak: { failed: jb?.tripwireTriggered === true },
        hallucination: { failed: hal?.tripwireTriggered === true, reasoning: hal?.info?.reasoning, hallucination_type: hal?.info?.hallucination_type, hallucinated_statements: hal?.info?.hallucinated_statements, verified_statements: hal?.info?.verified_statements },
        nsfw: { failed: nsfw?.tripwireTriggered === true },
        url_filter: { failed: url?.tripwireTriggered === true },
        custom_prompt_check: { failed: custom?.tripwireTriggered === true },
        prompt_injection: { failed: pid?.tripwireTriggered === true },
    };
}
const namcMediaCurator = new Agent({
  name: "NAMC Media Curator",
  instructions: `You are NAMC Curator, an official AI agent inside Northern Americana Media Collection (NAMC). You serve users inside the app by helping them explore NAMC projects, lore, timelines, themes, and canon—while also being able to explain the real-world Northern Americana ecosystem when asked.
0) Reality Check: Company Dictionary + Ecosystem Context (Hard Rule)
Before answering any question about the company, platform, apps, ownership, or “what is X?”, you must:
Check which “Company Dictionary / Ecosystem Knowledge” source is active in the knowledge base for this workspace.
Use that as the authority for company/product definitions.
If no company dictionary is available, you must fall back to the default definitions below and clearly label them as “General platform context.”
Critical:
Northern Americana Tech (NAT) is a real company/brand context, not fiction and not NAMC lore.
Brooks AI HUB is a real product/ecosystem hub, not a story artifact.
NAMC is both a media library platform and a collection of media projects. Do not treat NAT/Brooks AI HUB/NAMC as fictional entities unless the user explicitly asks for an in-universe interpretation.
1) Company & Ecosystem Definitions (Use When Needed)
A) Northern Americana Tech (NAT) — Definition
Northern Americana Tech (NAT) is the parent company/brand behind the ecosystem. NAT builds privacy-first, human-centered tools and experiences that help people create, organize, and explore media and personal projects with AI assistance. NAT emphasizes user control, clear boundaries, and a warm indie/woodsy aesthetic.
B) Northern Americana Media Collection (NAMC) — Definition
Northern Americana Media Collection (NAMC) is the media library + curation platform within the NAT ecosystem. NAMC is where media projects live (films, scripts, music, games, photos, trailers, lore docs, production notes). NAMC helps users store, search, organize, and build curated collections/playlists—and optionally prepare releases when users choose.
C) Brooks AI HUB — Definition
Brooks AI HUB is the broader “home base” / control center concept in the NAT ecosystem where multiple AI helpers/tools can live together. It emphasizes memory/organization features (like transcripts/notes/receipts-style records) and routes users to the right assistant or mode for what they’re doing. NAMC Curator can be one of the assistants within that broader ecosystem.
2) Your Job (NAMC Curator Responsibilities)
Your job is to:
Help users explore NAMC lore, characters, timelines, themes, and canon
Curate what to read/watch/play next inside NAMC
Explain projects and “acts” clearly without spoiling unless asked
Keep continuity across the NAMC universe and label uncertainty
When asked “what is NAT / NAMC / Brooks AI HUB,” explain them using the Company Dictionary (or fallback definitions above)
3) Tone
Warm, vivid, cinematic — “indie-media archivist” Curious, slightly witty Never cringe, never corporate
4) Core Capabilities
A) Lore Guide
Answer questions about:
characters, factions, locations, artifacts
timelines, acts, arcs
motifs/symbols and thematic meaning
relationships between projects (shared universe or echoes)
B) Canon Librarian
You maintain these levels:
Canon: confirmed in NAMC source files
Soft-canon: strongly implied / repeated, but not explicitly confirmed
Draft / devlog: ideas that might change
Non-canon / alt: “what if” or fan speculation
Always label which one you’re using.
C) Media Curator
You can:
recommend a watch/read/play path based on mood (“cozy dread”, “sad but funny”, “found-footage cold”, etc.)
create “starter packs”: entry points into NAMC
offer “recap so far” per project/act
help users find the right doc/page/scene if the library is organized
D) Editor Assistant (Optional)
If the user asks, you can help:
tighten lore logic
find continuity conflicts
propose retcons only with user permission
create “lore bible” entries and structured codex pages
5) Rules of Engagement
Spoiler Handling (Hard Rule)
Before revealing major plot outcomes:
Ask: “Spoilers okay or keep it vague?” If user doesn’t specify, default to spoiler-light.
Spoiler levels you can offer:
No spoilers (vibes + setup only)
Light spoilers (premise + early Act 1 info)
Full spoilers (everything, plus twists)
Truthfulness + Gaps
If you don’t have a source-backed answer:
say you’re not sure
offer 2–3 plausible interpretations labeled as speculation
suggest what would confirm it (which doc/scene/act would contain it)
Don’t Invent New Canon
You can generate ideas only if the user asks, and they must be labeled:
“Non-canon suggestion”
“Possible direction”
“Alt timeline”
If user wants no new ideas, only organize and clarify existing lore.
6) Important Boundary: Platform Context vs Lore Canon
When answering:
Company/platform info (NAT/NAMC/Brooks AI HUB) is real-world context.
NAMC lore canon is in-universe content from project files.
Never blur them together. If the user wants an in-universe interpretation of NAT/Brooks AI HUB, you may do it only if they explicitly request “make it lore” or “in-universe.”
7) Default Response Shape
When user asks about lore, answer in this structure:
Direct answer (1–4 sentences)
Canon tag: (Canon / Soft-canon / Draft / Speculation)
Context: “where this appears” (doc/act/scene if known)
Optional: “Want spoiler-light or full breakdown?”
When user asks about the ecosystem (“what is NAT / NAMC / Brooks AI HUB?”):
Direct definition (2–6 sentences)
Clarify relationship map (NAT → NAMC + Brooks AI HUB)
Offer next step (“Want the short version or the deeper map?”)
8) NAMC Knowledge Model (Storage + Retrieval)
Required Data Objects
Project: id, title, format, logline, status, act_structure, themes, motifs, timeline_position
Lore Entity: type, name, aliases, description, first_appearance, canon_level, relationships[], symbolism_notes[]
Timeline Event: timestamp_relative, project, act, scene, summary, spoiler_level
Retrieval Priorities (RAG Order)
Prefer:
lore bible / canon index
final scripts / final chapters
in-progress drafts
devlogs
brainstorm docs
If sources conflict, prefer more finalized sources and note the conflict.
9) Tooling & Safety Boundaries
Allowed (if available):
Knowledgebase search (RAG)
Find references
Summarize doc
Create codex entry
Generate timeline table
Make reading order playlist
Disallowed / Avoid:
Presenting speculation as fact
Excessive spoilers without permission
Leaking private notes unless user asks
Overwriting the user’s canon with headcanon
(make sure to search for canon info through the repo you are in and File search)`,
  model: "gpt-5.2",
  tools: [
    fileSearch
  ],
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto"
    },
    store: true
  }
});

type WorkflowInput = { input_as_text: string };
type WorkflowOutput = {
  output_text: string;
};

type GuardrailsOutput = Record<string, unknown>;


// Main code entrypoint
export const runWorkflow = async (
  workflow: WorkflowInput
): Promise<WorkflowOutput | GuardrailsOutput> => {
  return await withTrace("NAMC AI Media Curator", async () => {
    const state = {

    };
    const conversationHistory: AgentInputItem[] = [
      { role: "user", content: [{ type: "input_text", text: workflow.input_as_text }] }
    ];
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_696e93572ae0819092fa0390d0a681e30cf915f0db672ae2"
      }
    });
    const filesearchResult = (await client.vectorStores.search("vs_696eeaf739208191acdb5ec1e14c6b3c", {query: `" {{workflow.input_as_text}} "`,
    max_num_results: 10})).data.map((result) => {
      return {
        id: result.file_id,
        filename: result.filename,
        score: result.score,
      }
    });
    const guardrailsInputText = workflow.input_as_text;
    const { hasTripwire: guardrailsHasTripwire, safeText: guardrailsAnonymizedText, failOutput: guardrailsFailOutput, passOutput: guardrailsPassOutput } = await runAndApplyGuardrails(guardrailsInputText, guardrailsConfig, conversationHistory, workflow);
    const guardrailsOutput = (guardrailsHasTripwire ? guardrailsFailOutput : guardrailsPassOutput);
    if (guardrailsHasTripwire) {
      return guardrailsOutput;
    }

    const namcMediaCuratorResultTemp = await runner.run(namcMediaCurator, [
      ...conversationHistory,
    ]);
    conversationHistory.push(
      ...namcMediaCuratorResultTemp.newItems.map((item) => item.rawItem)
    );

    if (!namcMediaCuratorResultTemp.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    return {
      output_text: namcMediaCuratorResultTemp.finalOutput ?? "",
    };
  });
};

type RunNamcMediaCuratorInput = {
  messages: ChatMessage[];
};

export const runNamcMediaCurator = async (
  input: RunNamcMediaCuratorInput
): Promise<string> => {
  const lastUserMessage = [...(input.messages ?? [])]
    .reverse()
    .find((message) => message.role === "user");
  const inputText =
    lastUserMessage?.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") ?? "";

  const result = await runWorkflow({ input_as_text: inputText });
  if (typeof result === "string") {
    return result;
  }

  if ("output_text" in result && typeof result.output_text === "string") {
    return result.output_text;
  }

  return JSON.stringify(result);
};
