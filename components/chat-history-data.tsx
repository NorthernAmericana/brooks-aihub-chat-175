"use client";

import {
  endOfWeek,
  format,
  isSameWeek,
  parseISO,
  startOfWeek,
} from "date-fns";
import useSWRInfinite from "swr/infinite";
import type { User } from "next-auth";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";

type WeekGroup = {
  id: string;
  label: string;
  chats: Chat[];
};

export type MonthChatGroup = {
  id: string;
  label: string;
  weeks: WeekGroup[];
};

export type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

const toDate = (value: string | Date) =>
  value instanceof Date ? value : parseISO(value);

const getWeekLabel = (date: Date) => {
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  return `Week ${format(weekStart, "MM/dd/yyyy")} - ${format(weekEnd, "MM/dd/yyyy")}`;
};

export const groupChatsByDate = (chats: Chat[]): MonthChatGroup[] => {
  const sortedChats = [...chats].sort(
    (a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
  );

  const monthMap = new Map<string, MonthChatGroup>();

  for (const chat of sortedChats) {
    const chatDate = toDate(chat.createdAt);
    const monthId = format(chatDate, "yyyy-MM");
    const monthLabel = format(chatDate, "MMMM yyyy");

    let monthGroup = monthMap.get(monthId);
    if (!monthGroup) {
      monthGroup = {
        id: monthId,
        label: monthLabel,
        weeks: [],
      };
      monthMap.set(monthId, monthGroup);
    }

    const existingWeek = monthGroup.weeks.find((week) =>
      isSameWeek(toDate(week.chats[0].createdAt), chatDate)
    );

    if (existingWeek) {
      existingWeek.chats.push(chat);
      continue;
    }

    monthGroup.weeks.push({
      id: format(startOfWeek(chatDate), "yyyy-MM-dd"),
      label: getWeekLabel(chatDate),
      chats: [chat],
    });
  }

  return Array.from(monthMap.values());
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) {
    return `/api/history?limit=${PAGE_SIZE}`;
  }

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) {
    return null;
  }

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

export function useChatHistory(user?: User) {
  return useSWRInfinite<ChatHistory>(
    (pageIndex, previousPageData) => {
      if (!user) {
        return null;
      }

      return getChatHistoryPaginationKey(pageIndex, previousPageData);
    },
    fetcher,
    {
      fallbackData: [],
    }
  );
}
