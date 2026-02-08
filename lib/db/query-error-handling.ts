import { ChatSDKError } from "../errors";

export function getDbErrorDetails(error: unknown) {
  const databaseError = error as {
    code?: string;
    message?: string;
  };

  return {
    code:
      typeof databaseError?.code === "string" ? databaseError.code : undefined,
    message:
      typeof databaseError?.message === "string"
        ? databaseError.message
        : undefined,
  };
}

export function buildDbOperationCause({
  operation,
  code,
  message,
}: {
  operation: string;
  code?: string;
  message?: string;
}) {
  return `${operation} failed${code ? ` (code: ${code})` : ""}${message ? `: ${message}` : ""}`;
}

export function rethrowChatSdkErrorOrWrapDbError({
  error,
  operation,
}: {
  error: unknown;
  operation: string;
}): never {
  if (error instanceof ChatSDKError) {
    throw error;
  }

  const details = getDbErrorDetails(error);

  throw new ChatSDKError(
    "bad_request:database",
    buildDbOperationCause({
      operation,
      code: details.code,
      message: details.message,
    })
  );
}
