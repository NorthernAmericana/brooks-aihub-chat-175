const MESSAGE_COUNT_KEY_PREFIX = "message_count_";
const NEXT_AD_THRESHOLD_KEY_PREFIX = "next_ad_threshold_";

const MIN_THRESHOLD = 5;
const MAX_THRESHOLD = 10;

const getStorageNumber = (key: string): number | null => {
  const value = window.localStorage.getItem(key);
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRandomThreshold = () =>
  Math.floor(Math.random() * (MAX_THRESHOLD - MIN_THRESHOLD + 1)) +
  MIN_THRESHOLD;

const ensureThreshold = (sessionId: string) => {
  const thresholdKey = `${NEXT_AD_THRESHOLD_KEY_PREFIX}${sessionId}`;
  const existingThreshold = getStorageNumber(thresholdKey);

  if (existingThreshold !== null) {
    return existingThreshold;
  }

  const threshold = getRandomThreshold();
  window.localStorage.setItem(thresholdKey, threshold.toString());
  return threshold;
};

export const shouldDisableAds = ({
  foundersAccess,
  pathname,
  isOnboarding,
}: {
  foundersAccess: boolean;
  pathname: string;
  isOnboarding: boolean;
}) => {
  if (foundersAccess || isOnboarding) {
    return true;
  }

  return /^\/mycarmindato(?:\/|$)/i.test(pathname);
};

export const trackMessageAndCheckAdGate = (sessionId: string): boolean => {
  const messageCountKey = `${MESSAGE_COUNT_KEY_PREFIX}${sessionId}`;
  const thresholdKey = `${NEXT_AD_THRESHOLD_KEY_PREFIX}${sessionId}`;

  const currentCount = getStorageNumber(messageCountKey) ?? 0;
  const nextCount = currentCount + 1;
  window.localStorage.setItem(messageCountKey, nextCount.toString());

  const threshold = ensureThreshold(sessionId);
  if (nextCount < threshold) {
    return false;
  }

  window.localStorage.setItem(messageCountKey, "0");
  window.localStorage.setItem(thresholdKey, getRandomThreshold().toString());
  return true;
};
