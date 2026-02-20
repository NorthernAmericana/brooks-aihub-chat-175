export type SpotifyUiErrorCode =
  | "spotify_unauthorized"
  | "spotify_premium_required"
  | "spotify_no_active_device"
  | "spotify_forbidden"
  | "spotify_request_failed";

export class SpotifyApiError extends Error {
  readonly status: number;
  readonly code: SpotifyUiErrorCode;
  readonly details?: unknown;

  constructor(input: {
    message: string;
    status: number;
    code: SpotifyUiErrorCode;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "SpotifyApiError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
  }

  toResponseBody() {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
      },
    };
  }
}

export function toSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function toSpotifyUpstreamUnavailableError(input: {
  source: string;
  operation: string;
  error: unknown;
  message?: string;
}) {
  return new SpotifyApiError({
    status: 503,
    code: "spotify_request_failed",
    message:
      input.message ??
      "Spotify is temporarily unavailable. Please try again in a moment.",
    details: {
      source: input.source,
      operation: input.operation,
      upstreamStatus: "unavailable",
      reason: toSafeErrorMessage(input.error),
    },
  });
}
