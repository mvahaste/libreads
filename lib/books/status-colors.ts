import type { ReadThroughStatus, ReadingStatus } from "@/generated/prisma/enums";

export const READING_STATUS_COLORS = {
  WANT_TO_READ:
    "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30",
  READING:
    "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30",
  COMPLETED:
    "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30",
  PAUSED:
    "bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/30",
  ABANDONED:
    "bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30",
} as const satisfies Record<ReadingStatus, string>;

export const READ_THROUGH_STATUS_COLORS = {
  READING: READING_STATUS_COLORS.READING,
  PAUSED: READING_STATUS_COLORS.PAUSED,
  COMPLETED: READING_STATUS_COLORS.COMPLETED,
  ABANDONED: READING_STATUS_COLORS.ABANDONED,
} as const satisfies Record<ReadThroughStatus, string>;
