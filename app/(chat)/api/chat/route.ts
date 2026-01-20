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
  getAgentConfigByRoute,
  getDefaultAgentConfig,
  listAgentConfigs,
  type AgentToolId,
} from "@/lib/ai/agents/registry";
import { runNamcMediaCurator } from "@/lib/ai/agents/namc-media-curator";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { buildNamcLoreContext } from "@/lib/ai/namc-lore";
import { parseSlashCommand, resolveActiveRoute } from "@/lib/ai/routing";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatActiveRoute,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID, getTextFromMessage } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

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

function replaceUserMessageText(
  message: ChatMessage,
  text: string
): ChatMessage {
  const nonTextParts = message.parts.filter(
    (
      part
    ): part is Exclude<ChatMessage["parts"][number], { type: "text" }> =>
      part.type !== "text"
  );
  const textPart: ChatMessage["parts"][number] = { type: "text", text };
  const nextParts: ChatMessage["parts"] = [textPart, ...nonTextParts];

  return {
    ...message,
    parts: nextParts,
  };
}

function streamPlainText(
  dataStream: { write: (value: unknown) => void },
  text: string
) {
  dataStream.write({ type: "start" });
  dataStream.write({ type: "start-step" });
  dataStream.write({ type: "text-start", id: "text-1" });
  dataStream.write({
    type: "text-delta",
    id: "text-1",
    delta: text,
  });
  dataStream.write({ type: "text-end", id: "text-1" });
  dataStream.write({ type: "finish-step" });
  dataStream.write({ type: "finish", finishReason: "stop" });
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
    const defaultAgent = await getDefaultAgentConfig();
    let activeRoute = chat?.activeRoute ?? defaultAgent.route;
    const parsedSlash =
      message?.role === "user"
        ? parseSlashCommand(getTextFromMessage(message as ChatMessage))
        : null;
    let routeForMessage = resolveActiveRoute(
      activeRoute,
      parsedSlash?.route ?? null
    );
    const shouldUpdateRoute =
      Boolean(parsedSlash?.route) && parsedSlash?.route !== activeRoute;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
        activeRoute: routeForMessage,
      });
    }

    let outgoingMessage = message as ChatMessage | undefined;
    if (outgoingMessage && parsedSlash && (parsedSlash.route || parsedSlash.isHelp)) {
      outgoingMessage = replaceUserMessageText(outgoingMessage, parsedSlash.content);
    }

    if (shouldUpdateRoute && chat) {
      await updateChatActiveRoute({ chatId: chat.id, activeRoute: routeForMessage });
      activeRoute = routeForMessage;
    }

    if (!chat && outgoingMessage?.role === "user") {
      titlePromise = generateTitleFromUserMessage({ message: outgoingMessage });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [
          ...convertToUIMessages(messagesFromDb),
          ...(outgoingMessage ? [outgoingMessage] : []),
        ];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (outgoingMessage?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: outgoingMessage.id,
            role: "user",
            parts: outgoingMessage.parts,
            attachments: [],
            createdAt: new Date(),
            routeUsed: routeForMessage,
          },
        ],
      });
    }

    const isReasoningModel =
      selectedChatModel.includes("reasoning") ||
      selectedChatModel.includes("thinking");

    const modelMessages = await convertToModelMessages(uiMessages);
    const selectedAgent =
      (routeForMessage
        ? await getAgentConfigByRoute(routeForMessage)
        : undefined) ?? defaultAgent;
    const isNamcAgent = selectedAgent.id === "namc";

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        if (parsedSlash?.isHelp) {
          const agents = await listAgentConfigs();
          const helpText = [
            "Available routes:",
            "",
            ...agents.map(
              (agent) => `- ${agent.route}: ${agent.description}`
            ),
            "",
            "Switch by typing /route or using the route picker above.",
          ].join("\n");

          streamPlainText(dataStream, helpText);

          if (titlePromise) {
            const title = await titlePromise;
            dataStream.write({ type: "data-chat-title", data: title });
            updateChatTitleById({ chatId: id, title });
          }
          return;
        }

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
          });

          streamPlainText(dataStream, namcOutput);

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
          | ReturnType<typeof requestSuggestions>;

        const toolImplementations: Record<AgentToolId, ToolDefinition> = {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({ session, dataStream }),
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
          }),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools: isReasoningModel
            ? []
            : selectedAgent.tools,
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
                    routeUsed: routeForMessage,
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
              routeUsed: routeForMessage,
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
