const NICKNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const PUBLIC_NICKNAME_MIN_LENGTH = 3;
export const PUBLIC_NICKNAME_MAX_LENGTH = 24;

const RESERVED_PUBLIC_NICKNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "commons",
  "dm",
  "help",
  "me",
  "moderator",
  "root",
  "settings",
  "support",
  "system",
]);

export function normalizePublicNickname(value: string): string {
  return value.trim();
}

export function validatePublicNickname(value: string): string | null {
  const nickname = normalizePublicNickname(value);

  if (nickname.length < PUBLIC_NICKNAME_MIN_LENGTH) {
    return `Nickname must be at least ${PUBLIC_NICKNAME_MIN_LENGTH} characters.`;
  }

  if (nickname.length > PUBLIC_NICKNAME_MAX_LENGTH) {
    return `Nickname must be at most ${PUBLIC_NICKNAME_MAX_LENGTH} characters.`;
  }

  if (!NICKNAME_PATTERN.test(nickname)) {
    return "Nickname may only contain letters, numbers, and underscores.";
  }

  if (RESERVED_PUBLIC_NICKNAMES.has(nickname.toLowerCase())) {
    return "That nickname is reserved. Choose a different one.";
  }

  return null;
}
