function toSafeWholeSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return 0;
  if (seconds <= 0) return 0;
  return Math.floor(seconds);
}

export function formatDurationForDisplay(seconds: number) {
  const wholeSeconds = toSafeWholeSeconds(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const secs = wholeSeconds % 60;

  return `${hours}h ${minutes}m ${secs}s`;
}

export function formatDurationForInput(seconds: number) {
  const wholeSeconds = toSafeWholeSeconds(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const secs = wholeSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const DURATION_INPUT_REGEX = /^(\d+):([0-5]\d):([0-5]\d)$/;

export function parseDurationInputToSeconds(value: string): number | null {
  const trimmedValue = value.trim();
  const matches = trimmedValue.match(DURATION_INPUT_REGEX);

  if (!matches) return null;

  const [, hoursPart, minutesPart, secondsPart] = matches;

  return Number(hoursPart) * 3600 + Number(minutesPart) * 60 + Number(secondsPart);
}
