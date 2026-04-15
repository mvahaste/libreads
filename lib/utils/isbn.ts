export type IsbnType = "ISBN10" | "ISBN13";

export type NormalizedIsbn = {
  type: IsbnType;
  value: string;
};

export function sanitizeIsbnInput(value: string): string {
  return value.toUpperCase().replace(/[^0-9X]/g, "");
}

export function isIsbn10Format(value: string): boolean {
  return /^[0-9]{9}[0-9X]$/.test(value);
}

export function isIsbn13Format(value: string): boolean {
  return /^[0-9]{13}$/.test(value);
}

export function isValidIsbn10Checksum(value: string): boolean {
  if (!isIsbn10Format(value)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 10; index += 1) {
    const weight = 10 - index;
    const char = value[index];
    const digit = char === "X" ? 10 : Number(char);

    sum += weight * digit;
  }

  return sum % 11 === 0;
}

export function isValidIsbn13Checksum(value: string): boolean {
  if (!isIsbn13Format(value)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 12; index += 1) {
    const digit = Number(value[index]);
    sum += index % 2 === 0 ? digit : digit * 3;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  return expectedCheckDigit === Number(value[12]);
}

export function normalizeAndValidateIsbn(value: string): NormalizedIsbn | null {
  const cleaned = sanitizeIsbnInput(value);

  if (cleaned.length === 13 && isValidIsbn13Checksum(cleaned)) {
    return { type: "ISBN13", value: cleaned };
  }

  if (cleaned.length === 10 && isValidIsbn10Checksum(cleaned)) {
    return { type: "ISBN10", value: cleaned };
  }

  return null;
}
