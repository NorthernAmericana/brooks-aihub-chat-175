export const DM_TEMP_RETENTION_HOURS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  48,
  72,
  168,
  720,
] as const;

export type DmTempRetentionHours = (typeof DM_TEMP_RETENTION_HOURS)[number];

export function isValidDmTempRetentionHours(
  value: number | undefined
): value is DmTempRetentionHours {
  if (!value) {
    return false;
  }

  return (DM_TEMP_RETENTION_HOURS as readonly number[]).includes(value);
}

export function getDmTempRetentionLabel(hours: DmTempRetentionHours): string {
  if (hours >= 1 && hours <= 23) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  if (hours === 24) {
    return "24 hours (1 day)";
  }

  if (hours === 48) {
    return "48 hours (2 days)";
  }

  if (hours === 72) {
    return "72 hours (3 days)";
  }

  if (hours === 168) {
    return "1 week";
  }

  return "1 month";
}
