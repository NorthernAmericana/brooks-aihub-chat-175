"use client";

import useSWR from "swr";
import { fetcher, fetchWithErrorHandlers } from "@/lib/utils";

const memoriesCountKey = "/api/memories/count";

type MemoriesCountResponse = {
  count: number;
};

type CreateMemoryPayload = {
  content: string;
};

type MarkMemoriesReadPayload = {
  ids?: string[];
};

export function useMemoriesCount() {
  const { data, mutate, isLoading } = useSWR<MemoriesCountResponse>(
    memoriesCountKey,
    fetcher,
    {
      fallbackData: { count: 0 },
    }
  );

  const createMemory = async (payload: CreateMemoryPayload) => {
    await fetchWithErrorHandlers("/api/memories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await mutate();
  };

  const markMemoriesRead = async (payload: MarkMemoriesReadPayload = {}) => {
    await fetchWithErrorHandlers("/api/memories", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await mutate();
  };

  return {
    count: data?.count ?? 0,
    isLoading,
    refresh: () => mutate(),
    createMemory,
    markMemoriesRead,
  };
}
