export const NAMC_INSTALL_VERIFICATION_STATUSES = [
  "installed",
  "unknown",
  "needs-recheck",
] as const;

export type NamcInstallVerificationStatus =
  (typeof NAMC_INSTALL_VERIFICATION_STATUSES)[number];

export const NAMC_INSTALL_VERIFICATION_MAX_AGE_MS =
  1000 * 60 * 60 * 24 * 7;

export function isNamcInstallVerificationStatus(
  value: unknown
): value is NamcInstallVerificationStatus {
  return (
    typeof value === "string" &&
    (NAMC_INSTALL_VERIFICATION_STATUSES as readonly string[]).includes(value)
  );
}

export function hasNamcGateActivity(record?: {
  openedAt?: Date | null;
  completedAt?: Date | null;
} | null) {
  return Boolean(record?.openedAt || record?.completedAt);
}

export function isNamcVerificationFresh(
  checkedAt: Date | null | undefined,
  now = Date.now()
) {
  if (!checkedAt) {
    return false;
  }
  return now - checkedAt.getTime() <= NAMC_INSTALL_VERIFICATION_MAX_AGE_MS;
}
