"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { motion } from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { RouteSuggestion } from "@/lib/routes/types";
import { normalizeRouteKey } from "@/lib/routes/utils";
import {
  formatSlashAction,
  getStoredSlashActions,
  normalizeSlash,
  parseSlashAction,
  rememberSlashAction,
  type SlashAction,
} from "@/lib/suggested-actions";
import type { ChatMessage } from "@/lib/types";
import { fetcher, getTextFromMessage } from "@/lib/utils";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  messages: UIMessage[];
};

type RoutesResponse = {
  routes: RouteSuggestion[];
};

const defaultPromptsByAgentId = new Map([
  ["brooks-bears", "help me calm down"],
  ["my-car-mind", "log this trip"],
  ["my-flower-ai", "check-in"],
  ["namc", "brainstorm a scene"],
]);

const createActionKey = (action: { slash: string; prompt: string }) =>
  `${normalizeSlash(action.slash)}::${action.prompt.toLowerCase()}`;

function PureSuggestedActions({
  chatId,
  sendMessage,
  messages,
}: SuggestedActionsProps) {
  const { data: routeData } = useSWR<RoutesResponse>("/api/routes", fetcher);
  const agentConfigs = useMemo(
    () =>
      (routeData?.routes ?? []).filter(
        (agent) => agent.kind === "official" && agent.id !== "default"
      ),
    [routeData]
  );
  const [storedActions, setStoredActions] = useState<SlashAction[]>([]);

  useEffect(() => {
    setStoredActions(getStoredSlashActions());
  }, []);

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

      const parsed = parseSlashAction(text, agentConfigs);
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
  }, [agentConfigs, messages]);

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
      agentConfigs.forEach((agent) => {
        const prompt = defaultPromptsByAgentId.get(agent.id);
        if (!prompt) {
          return;
        }

        addAction({
          slash: agent.slash,
          prompt,
          lastUsedAt: 0,
        });
      });
    }

    return combined.slice(0, 4).map(formatSlashAction);
  }, [agentConfigs, rememberedActions, storedActions]);

  const displaySuggestedAction = (suggestedAction: string) => {
    const parsed = parseSlashAction(suggestedAction, agentConfigs);
    if (!parsed) {
      return suggestedAction;
    }

    const agent = agentConfigs.find(
      (config) =>
        normalizeRouteKey(config.slash) === normalizeRouteKey(parsed.slash)
    );
    if (!agent) {
      return suggestedAction;
    }

    const suffix = parsed.prompt ? ` ${parsed.prompt}` : "";
    return `${agent.label} · /${agent.slash}/${suffix}`;
  };

  return (
    <div
      className="grid w-full gap-1 sm:grid-cols-2"
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
            className="h-auto w-full whitespace-normal px-2 py-1 text-left text-[0.65rem]"
            onClick={(suggestion) => {
              const parsed = parseSlashAction(suggestion, agentConfigs);
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
