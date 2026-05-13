export function extractPublishedYear(input: string | number | null | undefined) {
  if (!input) return undefined;

  const str = String(input).trim();

  // Direct 4-digit number, e.g. "1990"
  if (/^\d{4}$/.test(str)) {
    return Number(str);
  }

  // ISO format, e.g. "1990-02-15" or "1990/02/15"
  const isoMatch = str.match(/^(\d{4})[-/]/);
  if (isoMatch) {
    return Number(isoMatch[1]);
  }

  // First 4 digit number in the string, e.g. "Published in 2004" or "c. 1998"
  const yearMatch = str.match(/\b(\d{4})\b/);
  if (yearMatch) {
    return Number(yearMatch[1]);
  }

  return undefined;
}
