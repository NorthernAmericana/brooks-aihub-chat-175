import { ChatSDKError } from "@/lib/errors";
import { rethrowChatSdkErrorOrWrapDbError } from "@/lib/db/query-error-handling";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw new Error("Expected function to throw");
}

const schemaGuardError = new ChatSDKError(
  "offline:database",
  "Missing required Chat columns: sessionType"
);

const passthroughThrown = assertThrows(() =>
  rethrowChatSdkErrorOrWrapDbError({
    error: schemaGuardError,
    operation: "get chat by id",
  })
);

assert(
  passthroughThrown === schemaGuardError,
  "Expected schema-guard ChatSDKError to be rethrown unchanged"
);
assert(
  passthroughThrown instanceof ChatSDKError &&
    passthroughThrown.type === "offline" &&
    passthroughThrown.surface === "database",
  "Expected schema-guard ChatSDKError code to remain offline:database"
);

const wrappedThrown = assertThrows(() =>
  rethrowChatSdkErrorOrWrapDbError({
    error: {
      code: "42P01",
      message: 'relation "Chat" does not exist',
    },
    operation: "get chat by id",
  })
);

assert(
  wrappedThrown instanceof ChatSDKError,
  "Expected unknown DB error to be wrapped as ChatSDKError"
);

if (wrappedThrown instanceof ChatSDKError) {
  assert(
    wrappedThrown.type === "bad_request" && wrappedThrown.surface === "database",
    "Expected wrapped unknown error code to be bad_request:database"
  );
  assert(
    wrappedThrown.cause ===
      'get chat by id failed (code: 42P01): relation "Chat" does not exist',
    "Expected wrapped unknown DB error to include code and message in cause"
  );
}

console.log("✅ query error handling tests passed");
