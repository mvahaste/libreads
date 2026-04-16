type ErrorLike = {
  name?: unknown;
  message?: unknown;
};

const EXPECTED_DECODE_ERROR_NAMES = new Set(["NotFoundException", "NotFound"]);

const EXPECTED_DECODE_ERROR_MESSAGE_PARTS = ["no multiformat readers were able to detect the code"];

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Errors get minified in production builds, so previous name-based checks failed (instant camera error in production because no code was detected).
 * So far a combination of name and message checks seems to be working.
 */
export function isExpectedZxingDecodeError(error: unknown): boolean {
  const stringError = toNonEmptyString(error);

  if (stringError) {
    const normalized = stringError.toLowerCase();
    return EXPECTED_DECODE_ERROR_MESSAGE_PARTS.some((part) => normalized.includes(part));
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as ErrorLike;
  const name = toNonEmptyString(candidate.name);

  if (name && EXPECTED_DECODE_ERROR_NAMES.has(name)) {
    return true;
  }

  const message = toNonEmptyString(candidate.message);

  if (!message) {
    return false;
  }

  const normalizedMessage = message.toLowerCase();
  return EXPECTED_DECODE_ERROR_MESSAGE_PARTS.some((part) => normalizedMessage.includes(part));
}
