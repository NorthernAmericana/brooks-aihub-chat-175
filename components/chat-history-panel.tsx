"use client";

import Link from "next/link";
import type { User } from "next-auth";
import { useMemo } from "react";
import { useChatHistory } from "@/components/chat-history-data";

export function ChatHistoryPanel({
  user,
  currentChatId,
}: {
  user?: User;
  currentChatId: string;
}) {
  const { data, isLoading } = useChatHistory(user);

  const chats = useMemo(
    () =>
      (data?.flatMap((page) => page.chats) ?? [])
        .filter((chat) => chat.id !== currentChatId)
        .slice(0, 8),
    [currentChatId, data]
  );

  if (!user) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
        Sign in to view your chat history.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
        Loading history...
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
        No past chats yet.
      </div>
    );
  }

  return (
    <div className="grid w-full gap-2" data-testid="chat-history-panel">
      {chats.map((chat) => (
        <Link
          className="rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground transition hover:border-border hover:text-foreground"
          href={`/chat/${chat.id}`}
          key={chat.id}
        >
          {chat.title}
        </Link>
      ))}
    </div>
  );
}
