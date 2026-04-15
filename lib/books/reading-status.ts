import z from "zod/v4";

export const READING_STATUS_VALUES = ["WANT_TO_READ", "READING", "COMPLETED", "PAUSED", "ABANDONED"] as const;

export const READING_STATUS_FILTER_VALUES = ["", ...READING_STATUS_VALUES] as const;

export type ReadingStatusValue = (typeof READING_STATUS_VALUES)[number];
export type ReadingStatusFilterValue = (typeof READING_STATUS_FILTER_VALUES)[number];

export const readingStatusFilterSchema = z.enum(READING_STATUS_FILTER_VALUES).default("");
