const DEFAULT_FETCH_TIMEOUT_MS = 10000;

export async function fetchWithTimeout(
  input: URL | RequestInfo,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
