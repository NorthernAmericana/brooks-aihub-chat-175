export const RECENT_WINDOW_DAYS = 7;
export const RECENT_STATUS_DAYS = 3;

export type MemoryRecencyStatus = "recent" | "aging" | "outdated";

export function getMemoryRecencyStatus(ageInDays: number): MemoryRecencyStatus {
  if (ageInDays <= RECENT_STATUS_DAYS) {
    return "recent";
  }

  if (ageInDays <= RECENT_WINDOW_DAYS) {
    return "aging";
  }

  return "outdated";
}

