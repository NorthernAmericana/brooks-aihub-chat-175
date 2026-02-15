import { getSession } from "next-auth/react";

const SESSION_POLL_INTERVAL_MS = 200;
const DEFAULT_SESSION_TIMEOUT_MS = 3000;

export async function waitForAuthenticatedSession(
  timeoutMs = DEFAULT_SESSION_TIMEOUT_MS
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const session = await getSession();

    if (session) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_INTERVAL_MS));
  }

  return false;
}
