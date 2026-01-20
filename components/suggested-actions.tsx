"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { motion } from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";
import { useAgents } from "@/hooks/use-agents";
import {
  formatSlashAction,
  getStoredSlashActions,
  normalizeRoute,
  parseSlashAction,
  rememberSlashAction,
  type SlashAction,
} from "@/lib/suggested-actions";
import type { ChatMessage } from "@/lib/types";
import { getTextFromMessage } from "@/lib/utils";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  messages: UIMessage[];
};

const defaultPromptsByAgentId = new Map([
  ["brooks-bears", "help me calm down"],
  ["my-car-mind", "log this trip"],
  ["my-flower-ai", "check-in"],
  ["namc", "brainstorm a scene"],
]);

const createActionKey = (action: { route: string; prompt: string }) =>
  `${normalizeRoute(action.route)}::${action.prompt.toLowerCase()}`;

function PureSuggestedActions({
  chatId,
  sendMessage,
  messages,
}: SuggestedActionsProps) {
  const { data: agentConfigs = [] } = useAgents();
  const availableAgents = useMemo(
    () => agentConfigs.filter((agent) => agent.id !== "default"),
    [agentConfigs]
  );
  const [storedActions, setStoredActions] = useState<SlashAction[]>([]);

  useEffect(() => {
    setStoredActions(getStoredSlashActions());
  }, [messages]);

  const rememberedActions = useMemo(() => {
    const results: SlashAction[] = [];
    const seen = new Set<string>();

    for (const message of [...messages].reverse()) {
      if (message.role !== "user") {
        continue;
      }

      const text = getTextFromMessage(message).trim();
      if (!text) {
        continue;
      }

      const parsed = parseSlashAction(text, availableAgents);
      if (!parsed) {
        continue;
      }

      const key = createActionKey(parsed);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      results.push({
        ...parsed,
        lastUsedAt: 0,
      });

      if (results.length >= 6) {
        break;
      }
    }

    return results;
  }, [availableAgents, messages]);

  const suggestedActions = useMemo(() => {
    const combined: SlashAction[] = [];
    const seen = new Set<string>();

    const addAction = (action: SlashAction) => {
      const key = createActionKey(action);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      combined.push(action);
    };

    const sortedStored = [...storedActions].sort(
      (a, b) => b.lastUsedAt - a.lastUsedAt
    );
    sortedStored.forEach(addAction);
    rememberedActions.forEach(addAction);

    if (combined.length < 4) {
      availableAgents.forEach((agent) => {
        const prompt = defaultPromptsByAgentId.get(agent.id);
        if (!prompt) {
          return;
        }

        addAction({
          route: agent.route,
          prompt,
          lastUsedAt: 0,
        });
      });
    }

    return combined.slice(0, 4).map(formatSlashAction);
  }, [availableAgents, rememberedActions, storedActions]);

  const displaySuggestedAction = (suggestedAction: string) => {
    const parsed = parseSlashAction(suggestedAction, availableAgents);
    if (!parsed) {
      return suggestedAction;
    }

    const agent = availableAgents.find(
      (config) =>
        normalizeRoute(config.route) === normalizeRoute(parsed.route)
    );
    if (!agent) {
      return suggestedAction;
    }

    const suffix = parsed.prompt ? ` ${parsed.prompt}` : "";
    return `${agent.displayName} · ${agent.route}${suffix}`;
  };

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              const parsed = parseSlashAction(suggestion, availableAgents);
              if (parsed) {
                setStoredActions(rememberSlashAction(parsed));
              }

              window.history.pushState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {displaySuggestedAction(suggestedAction)}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    const prevLastId = prevProps.messages.at(-1)?.id;
    const nextLastId = nextProps.messages.at(-1)?.id;
    if (prevLastId !== nextLastId) {
      return false;
    }

    return true;
  }
);
