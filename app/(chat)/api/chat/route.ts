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
import { runMyCarMindAtoWorkflow } from "@/lib/ai/agents/mycarmindato-workflow";
import { runMyFlowerAIWorkflow } from "@/lib/ai/agents/myflowerai-workflow";
import { runNamcMediaCurator } from "@/lib/ai/agents/namc-media-curator";
import {
  type AgentToolId,
  getAgentConfigById,
  getAgentConfigBySlash,
  getDefaultAgentConfig,
} from "@/lib/ai/agents/registry";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getDirections } from "@/lib/ai/tools/get-directions";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { saveHomeLocation } from "@/lib/ai/tools/save-home-location";
import { saveMemory } from "@/lib/ai/tools/save-memory";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getApprovedMemoriesByUserId,
  getApprovedMemoriesByUserIdAndRoute,
  getApprovedMemoriesByUserIdAndProjectRoute,
  getChatById,
  getEnabledAtoFilesByAtoId,
  getHomeLocationByUserId,
  getMessageCountByUserId,
  getMessagesByChatId,
  getUnofficialAtoById,
  getUserById,
  getUserEntitlements,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import {
  deriveEntitlementRules,
  formatSpoilerAccessContext,
  getSpoilerAccessSummary,
} from "@/lib/entitlements/products";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

const MY_CAR_MIND_ROUTE = "/MyCarMindATO/";

// Free subroutes that don't require founders access
const FREE_SUBROUTES = [
  "MyCarMindATO/Driver",
  "MyCarMindATO/DeliveryDriver",
  "MyCarMindATO/Traveler",
];

/**
 * Helper function to extract the parent project route from a subroute.
 * E.g., "MyCarMindATO/Driver" -> "/MyCarMindATO/"
 * E.g., "BrooksBears/BenjaminBear" -> "/BrooksBears/"
 */
const getProjectRoute = (agentSlash: string): string | null => {
  // Check if this is a subroute (contains a /)
  const parts = agentSlash.split("/");
  if (parts.length > 1) {
    // Return the parent route with leading and trailing slashes
    return `/${parts[0]}/`;
  }
  return null;
};

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

const formatHomeLocationContext = (
  homeLocation: Awaited<ReturnType<typeof getHomeLocationByUserId>>
) => {
  if (!homeLocation) {
    return null;
  }

  return `HOME LOCATION\nUser-approved home location:\n- ${homeLocation.rawText}`;
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
  const wrappedMatch = trimmed.match(/^\/(.+)\/(?:\s|$)/);
  if (wrappedMatch?.[1]) {
    return wrappedMatch[1];
  }

  const match = trimmed.match(/^\/([^\s]+)/);
  return match?.[1];
}

function getLastUserMessageText(messages: ChatMessage[]): string | null {
  const lastUserMessage = [...messages]
    .reverse()
    .find((currentMessage) => currentMessage.role === "user");
  if (!lastUserMessage) {
    return null;
  }
  const textPart = lastUserMessage.parts.find((part) => part.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  return textPart?.text ?? null;
}

function isDocumentRequest(text: string | null): boolean {
  if (!text) {
    return false;
  }
  return /\b(create|write|draft|make|update|edit)\b[\s\S]*\b(document|doc)\b/i.test(
    text
  );
}

function isDocumentSuggestionRequest(text: string | null): boolean {
  if (!text) {
    return false;
  }
  return /\b(suggest|suggestions|feedback|review)\b[\s\S]*\b(document|doc)\b/i.test(
    text
  );
}

function isHomeLocationRequest(text: string | null): boolean {
  if (!text) {
    return false;
  }

  return /(\b(save|set|store|remember)\b[\s\S]*\b(home|house)\b[\s\S]*\b(location|address)\b)|(\bmy home is\b)|(\bhome location\b)/i.test(
    text
  );
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
    const user = await getUserById({ id: session.user.id });

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const enabledFileUrls = new Set<string>();

    if (requestBody.atoId) {
      const ato = await getUnofficialAtoById({
        id: requestBody.atoId,
        ownerUserId: session.user.id,
      });

      if (!ato) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }

      const enabledFiles = await getEnabledAtoFilesByAtoId({
        atoId: requestBody.atoId,
        ownerUserId: session.user.id,
      });

      enabledFiles.forEach((file) => {
        enabledFileUrls.add(file.blobUrl);
      });
    }

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const isToolApprovalFlow = Boolean(messages);

    const filterParts = <T extends { parts?: unknown[] }>(entry: T): T => {
      if (!requestBody.atoId || !Array.isArray(entry.parts)) {
        return entry;
      }

      const filteredParts = entry.parts.filter((part) => {
        if (
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          (part as { type?: string }).type === "file"
        ) {
          const url = (part as { url?: string }).url;
          return typeof url === "string" ? enabledFileUrls.has(url) : false;
        }
        return true;
      });

      return { ...entry, parts: filteredParts };
    };

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
      
      // Check if this subroute requires founders access
      const requiresFoundersForNewChat = firstMessageSlash?.includes("/") && 
        !FREE_SUBROUTES.includes(firstMessageSlash);
      
      if (requiresFoundersForNewChat && !user.foundersAccess) {
        return new ChatSDKError(
          "forbidden:auth",
          "Founders access required for this subroute."
        ).toResponse();
      }
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

    const sanitizedMessage = message
      ? filterParts(message as ChatMessage)
      : undefined;
    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[]).map((current) => filterParts(current))
      : [
          ...convertToUIMessages(messagesFromDb),
          ...(sanitizedMessage ? [sanitizedMessage] : []),
        ];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (sanitizedMessage?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: sanitizedMessage.id,
            role: "user",
            parts: sanitizedMessage.parts,
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
      selectedAgent =
        getAgentConfigById(chat.routeKey) ?? getDefaultAgentConfig();
    } else {
      // For new chats or chats without routeKey, use slash trigger from message
      const slashTrigger = getSlashTriggerFromMessages(uiMessages);
      selectedAgent =
        (slashTrigger ? getAgentConfigBySlash(slashTrigger) : undefined) ??
        getDefaultAgentConfig();
    }
    
    const requiresFoundersAccess = selectedAgent.slash.includes("/") && 
      !FREE_SUBROUTES.includes(selectedAgent.slash);
    
    if (requiresFoundersAccess && !user.foundersAccess) {
      return new ChatSDKError(
        "forbidden:auth",
        "Founders access required for this subroute."
      ).toResponse();
    }

    const isMyCarMindAgent = selectedAgent.id === "my-car-mind";
    const projectRoute = getProjectRoute(selectedAgent.slash);
    const isMyCarMindProject = projectRoute === MY_CAR_MIND_ROUTE;
    const isBrooksBearsProject = projectRoute === "/BrooksBears/";
    
    // Determine memory scope:
    // 1. For MyCarMindATO subroutes (Driver, Trucker, DeliveryDriver, Traveler): use project-level memories
    // 2. For BrooksBears subroutes (BenjaminBear): use project-level memories
    // 3. For standalone MyCarMindATO: use exact route memories
    // 4. For other agents: use all user memories
    let approvedMemories;
    if (isMyCarMindProject && projectRoute) {
      // Project-level memory sharing for MyCarMindATO subroutes
      approvedMemories = await getApprovedMemoriesByUserIdAndProjectRoute({
        userId: session.user.id,
        projectRoute,
      });
    } else if (isBrooksBearsProject && projectRoute) {
      // Project-level memory sharing for BrooksBears subroutes
      approvedMemories = await getApprovedMemoriesByUserIdAndProjectRoute({
        userId: session.user.id,
        projectRoute,
      });
    } else if (isMyCarMindAgent) {
      // Exact route for standalone MyCarMindATO
      approvedMemories = await getApprovedMemoriesByUserIdAndRoute({
        userId: session.user.id,
        route: selectedAgent.slash,
      });
    } else {
      // All memories for other agents
      approvedMemories = await getApprovedMemoriesByUserId({
        userId: session.user.id,
      });
    }
    
    const baseMemoryContext = formatMemoryContext(approvedMemories);
    const homeLocation = isMyCarMindAgent || isMyCarMindProject
      ? await getHomeLocationByUserId({
          userId: session.user.id,
          chatId: id,
          // Guard: home-location reads must remain scoped to MY_CAR_MIND_ROUTE only.
          route: MY_CAR_MIND_ROUTE,
        })
      : null;
    const homeLocationContext = formatHomeLocationContext(homeLocation);
    const userEntitlements = await getUserEntitlements({
      userId: session.user.id,
    });
    const entitlementRules = deriveEntitlementRules(userEntitlements);
    const spoilerSummary = getSpoilerAccessSummary(entitlementRules);
    const spoilerAccessContext = formatSpoilerAccessContext(spoilerSummary);
    const memoryContext =
      [baseMemoryContext, homeLocationContext, spoilerAccessContext]
        .filter(Boolean)
        .join("\n\n") || null;

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const isNamcAgent = selectedAgent.id === "namc";
        const isMyFlowerAiAgent = selectedAgent.id === "my-flower-ai";
        const lastUserText = getLastUserMessageText(uiMessages);
        const isNamcDocumentRequest =
          isNamcAgent && isDocumentRequest(lastUserText);
        const isNamcSuggestionRequest =
          isNamcAgent && isDocumentSuggestionRequest(lastUserText);
        const isHomeLocationSaveRequest =
          selectedAgent.id === "my-car-mind" &&
          isHomeLocationRequest(lastUserText);
        type ToolDefinition =
          | typeof getDirections
          | typeof getWeather
          | ReturnType<typeof createDocument>
          | ReturnType<typeof updateDocument>
          | ReturnType<typeof requestSuggestions>
          | ReturnType<typeof saveMemory>
          | ReturnType<typeof saveHomeLocation>;

        const toolImplementations = {
          getDirections,
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({ session, dataStream }),
          saveMemory: saveMemory({ session, chatId: id, agent: selectedAgent }),
          saveHomeLocation: saveHomeLocation({ session, chatId: id }),
        } satisfies Record<AgentToolId, ToolDefinition>;

        const namcDocumentTools: AgentToolId[] = [
          "createDocument",
          "updateDocument",
          "saveMemory",
        ];
        if (isNamcSuggestionRequest) {
          namcDocumentTools.push("requestSuggestions");
        }

        const activeToolIds: AgentToolId[] = isNamcDocumentRequest
          ? namcDocumentTools
          : selectedAgent.tools;

        const tools = Object.fromEntries(
          activeToolIds.map((toolId) => [toolId, toolImplementations[toolId]])
        ) as Record<AgentToolId, ToolDefinition>;

        if (isNamcAgent && !isNamcDocumentRequest) {
          const lastUserMessage = [...uiMessages]
            .reverse()
            .find((currentMessage) => currentMessage.role === "user");
          const responseText = await runNamcMediaCurator({
            messages: uiMessages,
            latestUserMessage: lastUserMessage,
            memoryContext,
          });
          const responseId = generateUUID();
          dataStream.write({ type: "text-start", id: responseId });
          if (responseText) {
            dataStream.write({
              type: "text-delta",
              id: responseId,
              delta: responseText,
            });
          }
          dataStream.write({ type: "text-end", id: responseId });
        } else if (isMyFlowerAiAgent) {
          const responseText = await runMyFlowerAIWorkflow({
            messages: uiMessages,
            memoryContext,
          });
          const responseId = generateUUID();
          dataStream.write({ type: "text-start", id: responseId });
          if (responseText) {
            dataStream.write({
              type: "text-delta",
              id: responseId,
              delta: responseText,
            });
          }
          dataStream.write({ type: "text-end", id: responseId });
        } else if (
          selectedAgent.id === "my-car-mind" &&
          !isToolApprovalFlow &&
          !isHomeLocationSaveRequest
        ) {
          const responseText = await runMyCarMindAtoWorkflow({
            messages: uiMessages,
            memoryContext,
            homeLocationText: homeLocation?.rawText ?? null,
          });
          const responseId = generateUUID();
          dataStream.write({ type: "text-start", id: responseId });
          if (responseText) {
            dataStream.write({
              type: "text-delta",
              id: responseId,
              delta: responseText,
            });
          }
          dataStream.write({ type: "text-end", id: responseId });
        } else {
          const result = streamText({
            model: getLanguageModel(selectedChatModel),
            system: systemPrompt({
              selectedChatModel,
              requestHints,
              basePrompt: selectedAgent.systemPromptOverride,
              memoryContext: memoryContext ?? undefined,
              includeArtifactsPrompt: !isNamcAgent || isNamcDocumentRequest,
            }),
            messages: modelMessages,
            stopWhen: stepCountIs(5),
            experimental_activeTools: isReasoningModel ? [] : activeToolIds,
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
        }

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
