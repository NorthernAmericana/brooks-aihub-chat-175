"use client";

const HINT_LOCK_KEY = "brooks-active-hint";

export const HINT_LOCK_CLAIM_EVENT = "brooks:hints:claim";
export const HINT_LOCK_RELEASE_EVENT = "brooks:hints:release";

export type HintLockPayload = {
  owner: string;
  claimedAt: number;
};

const parsePayload = (value: string | null): HintLockPayload | null => {
  if (!value) {
    return null;
  }

  try {
    const payload = JSON.parse(value) as Partial<HintLockPayload>;
    if (typeof payload.owner !== "string" || typeof payload.claimedAt !== "number") {
      return null;
    }
    return {
      owner: payload.owner,
      claimedAt: payload.claimedAt,
    };
  } catch {
    return null;
  }
};

const readHintLock = (): HintLockPayload | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return parsePayload(window.sessionStorage.getItem(HINT_LOCK_KEY));
};

export const hasActiveHintLock = (ignoreOwner?: string) => {
  const lock = readHintLock();
  if (!lock) {
    return false;
  }

  if (ignoreOwner && lock.owner === ignoreOwner) {
    return false;
  }

  return true;
};

export const claimHintLock = (owner: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: HintLockPayload = {
    owner,
    claimedAt: Date.now(),
  };

  window.sessionStorage.setItem(HINT_LOCK_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent<HintLockPayload>(HINT_LOCK_CLAIM_EVENT, { detail: payload }));
};

export const releaseHintLock = (owner: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const lock = readHintLock();
  if (!lock || lock.owner !== owner) {
    return;
  }

  window.sessionStorage.removeItem(HINT_LOCK_KEY);
  window.dispatchEvent(new CustomEvent<HintLockPayload>(HINT_LOCK_RELEASE_EVENT, { detail: lock }));
};

export const dismissBrooksHintState = () => {
  releaseHintLock("brooks-ai-hub-edge-hint");
};
