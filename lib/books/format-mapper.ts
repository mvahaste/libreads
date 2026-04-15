import { BookType } from "@/generated/prisma/enums";

const AUDIO_KEYWORDS = ["audio", "audiobook"];
const EBOOK_KEYWORDS = ["kindle", "ebook", "e-book", "epub", "pdf", "nook"];

function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Maps a Hardcover edition_format string to one of the three BookType values.
 *
 * - Matches audiobook keywords -> AUDIOBOOK
 * - Matches ebook keywords -> EBOOK
 * - Else -> PHYSICAL
 */
export function mapEditionFormat(format: string | null | undefined): BookType {
  if (!format || format.trim() === "") {
    return "PHYSICAL";
  }

  const normalized = normalize(format);

  if (AUDIO_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return "AUDIOBOOK";
  }

  if (EBOOK_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return "EBOOK";
  }

  return "PHYSICAL";
}
