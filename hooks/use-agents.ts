import useSWR from "swr";
import type { AgentManifest } from "@/lib/ai/agents/registry";
import { fetcher } from "@/lib/utils";

export const agentsKey = "/api/agents";

export function useAgents() {
  return useSWR<AgentManifest[]>(agentsKey, fetcher);
}
