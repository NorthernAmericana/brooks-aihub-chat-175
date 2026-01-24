import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth, type UserType } from "@/app/(auth)/auth";
import {
  getAgentConfigByIdWithCustom,
  getAgentConfigBySlashWithCustom,
} from "@/lib/ai/agents/custom-ato-registry";
import { runNamcMediaCurator } from "@/lib/ai/agents/namc-media-curator";
import {
  type AgentToolId,
  getAgentConfigById,
  getAgentConfigBySlash,
  getDefaultAgentConfig,
} from "@/lib/ai/agents/registry";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { buildNamcLoreContext } from "@/lib/ai/namc-lore";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { saveMemory } from "@/lib/ai/tools/save-memory";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getApprovedMemoriesByUserId,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

const formatMemoryContext = (
  memories: Awaited<ReturnType<typeof getApprovedMemoriesByUserId>>
) => {
  if (!memories.length) {
    return null;
  }

  const formatted = memories
    .slice(0, 8)
    .map((memory) => {
      const routeLabel = memory.route ? ` (${memory.route})` : "";
      return `- ${memory.rawText}${routeLabel}`;
    })
    .join("\n");

  return `MEMORY CONTEXT\nUse these approved user memories when relevant:\n${formatted}`;
};

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

function getSlashTriggerFromMessages(
  messages: ChatMessage[]
): string | undefined {
  const lastUserMessage = [...messages]
    .reverse()
    .find((currentMessage) => currentMessage.role === "user");

  if (!lastUserMessage) {
    return undefined;
  }

  const textPart = lastUserMessage.parts.find((part) => part.type === "text") as
    | { type: "text"; text: string }
    | undefined;

  if (!textPart) {
    return undefined;
  }

  const trimmed = textPart.text.trim();
  const wrappedMatch = trimmed.match(/^\/(.+?)\/(?:\s|$)/);
  if (wrappedMatch?.[1]) {
    return wrappedMatch[1];
  }

  const match = trimmed.match(/^\/([^\s]+)/);
  return match?.[1];
}

function getLatestUserMessageText(messages: ChatMessage[]): string | null {
  const lastUserMessage = [...messages]
    .reverse()
    .find((currentMessage) => currentMessage.role === "user");

  if (!lastUserMessage) {
    return null;
  }

  const text = lastUserMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;
    let initialRouteKey: string | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      // Determine initial route key from the first message
      const firstMessageSlash = getSlashTriggerFromMessages([message]);
      initialRouteKey = firstMessageSlash
        ? (getAgentConfigBySlash(firstMessageSlash)?.id ?? null)
        : null;

      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
        routeKey: initialRouteKey,
      });
      titlePromise = generateTitleFromUserMessage({
        message,
        routeKey: initialRouteKey,
      });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const isReasoningModel =
      selectedChatModel.includes("reasoning") ||
      selectedChatModel.includes("thinking");

    const modelMessages = await convertToModelMessages(uiMessages);

    // Determine agent selection
    let selectedAgent: ReturnType<
      typeof getAgentConfigBySlash | typeof getDefaultAgentConfig
    >;

    if (chat?.routeKey) {
      // Use persisted routeKey for existing chats
      // First try to get as custom ATO, then fall back to official agents
      const customAgent = await getAgentConfigByIdWithCustom(
        chat.routeKey,
        session.user.id
      );
      selectedAgent =
        customAgent ?? getAgentConfigById(chat.routeKey) ?? getDefaultAgentConfig();
    } else {
      // For new chats or chats without routeKey, use slash trigger from message
      const slashTrigger = getSlashTriggerFromMessages(uiMessages);
      if (slashTrigger) {
        const customAgent = await getAgentConfigBySlashWithCustom(
          slashTrigger,
          session.user.id
        );
        selectedAgent =
          customAgent ?? getAgentConfigBySlash(slashTrigger) ?? getDefaultAgentConfig();
      } else {
        selectedAgent = getDefaultAgentConfig();
      }
    }

    const isNamcAgent = selectedAgent.id === "namc";
    const approvedMemories = await getApprovedMemoriesByUserId({
      userId: session.user.id,
    });
    const memoryContext = formatMemoryContext(approvedMemories);

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        if (isNamcAgent) {
          const latestUserMessage = getLatestUserMessageText(uiMessages);
          const namcLoreContext = latestUserMessage
            ? await buildNamcLoreContext(latestUserMessage, {
                maxSnippets: 4,
                maxTokens: 1500,
              })
            : null;
          const namcOutput = await runNamcMediaCurator({
            messages: uiMessages,
            loreContext: namcLoreContext,
            memoryContext,
          });

          dataStream.write({ type: "start" });
          dataStream.write({ type: "start-step" });
          dataStream.write({ type: "text-start", id: "text-1" });
          dataStream.write({
            type: "text-delta",
            id: "text-1",
            delta: namcOutput,
          });
          dataStream.write({ type: "text-end", id: "text-1" });
          dataStream.write({ type: "finish-step" });
          dataStream.write({ type: "finish", finishReason: "stop" });

          if (titlePromise) {
            const title = await titlePromise;
            dataStream.write({ type: "data-chat-title", data: title });
            updateChatTitleById({ chatId: id, title });
          }
          return;
        }

        type ToolDefinition =
          | typeof getWeather
          | ReturnType<typeof createDocument>
          | ReturnType<typeof updateDocument>
          | ReturnType<typeof requestSuggestions>
          | ReturnType<typeof saveMemory>;

        const toolImplementations: Record<AgentToolId, ToolDefinition> = {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({ session, dataStream }),
          saveMemory: saveMemory({ session, chatId: id, agent: selectedAgent }),
        };

        const tools = Object.fromEntries(
          selectedAgent.tools.map((toolId) => [
            toolId,
            toolImplementations[toolId],
          ])
        ) as Record<AgentToolId, ToolDefinition>;

        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: systemPrompt({
            selectedChatModel,
            requestHints,
            basePrompt: selectedAgent.systemPromptOverride,
            memoryContext: memoryContext ?? undefined,
          }),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools: isReasoningModel ? [] : selectedAgent.tools,
          providerOptions: isReasoningModel
            ? {
                anthropic: {
                  thinking: { type: "enabled", budgetTokens: 10_000 },
                },
              }
            : undefined,
          tools,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: "data-chat-title", data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => "Oops, an error occurred!",
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          // ignore redis errors
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
