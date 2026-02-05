"use client";

import Link from "next/link";
import { useMemo } from "react";
import { groupChatsByDate, useChatHistory } from "@/components/chat-history-data";
import { LoaderIcon } from "@/components/icons";
import type { Chat } from "@/lib/db/schema";
import { getChatRouteKey } from "@/lib/voice";

const isBrooksBearsRouteKey = (routeKey: string) =>
  routeKey.startsWith("brooksbears") || routeKey.startsWith("brooks-bears");

const isVideoCallSession = (chat: Chat) => chat.sessionType === "video-call";

const isBrooksBearsChat = (chat: Chat) =>
  isBrooksBearsRouteKey(getChatRouteKey(chat)) && !isVideoCallSession(chat);

export function BrooksBearsHistoryPanel({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const { data, setSize, isValidating, isLoading } = useChatHistory();

  const filteredChats = useMemo(() => {
    const chatsFromHistory =
      data?.flatMap((paginatedChatHistory) => paginatedChatHistory.chats) ?? [];
    return chatsFromHistory.filter(isBrooksBearsChat);
  }, [data]);

  const groupedChats = useMemo(
    () => groupChatsByDate(filteredChats),
    [filteredChats]
  );

  const hasReachedEnd = data
    ? data.some((page) => page.hasMore === false)
    : false;

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm text-white/60">
        Login to save and revisit BrooksBears chats.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm text-white/60">
        Loading BrooksBears history...
      </div>
    );
  }

  if (!filteredChats.length) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/60">
        Your BrooksBears chats will show up here once you start chatting.
      </div>
    );
  }

  const renderChatGroup = (chats: Chat[]) => {
    if (!chats.length) {
      return null;
    }

    return (
      <div>
        <div className="flex flex-col gap-2">
          {chats.map((chat) => (
            <Link
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:border-white/30 hover:bg-white/10"
              href={`/chat/${chat.id}`}
              key={chat.id}
            >
              <div className="font-semibold text-white">{chat.title}</div>
              <div className="text-xs text-white/50">
                {getChatRouteKey(chat)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6">
      {groupedChats.map((monthGroup) => (
        <div className="flex flex-col gap-4" key={monthGroup.id}>
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {monthGroup.label}
          </div>
          {monthGroup.weeks.map((weekGroup) => (
            <div className="flex flex-col gap-2" key={weekGroup.id}>
              <div className="px-2 py-1 text-xs uppercase tracking-[0.2em] text-white/40">
                {weekGroup.label}
              </div>
              {renderChatGroup(weekGroup.chats)}
            </div>
          ))}
        </div>
      ))}

      <div>
        {hasReachedEnd ? (
          <div className="flex items-center justify-center gap-2 text-sm text-white/50">
            You have reached the end of your BrooksBears history.
          </div>
        ) : (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10"
            disabled={isValidating}
            onClick={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
            type="button"
          >
            <div className={isValidating ? "animate-spin" : ""}>
              <LoaderIcon />
            </div>
            {isValidating ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
