import type { ProgressType } from "@/generated/prisma/enums";

export function getMaxProgressForDisplay(params: {
  progressType: ProgressType;
  pageCount: number | null;
  audioSeconds: number | null;
}): number {
  switch (params.progressType) {
    case "PAGES":
      return params.pageCount ?? 100;
    case "TIME":
      return params.audioSeconds ?? 100;
    case "PERCENTAGE":
      return 100;
  }
}

export function getProgressPercent(params: {
  progress: number;
  progressType: ProgressType;
  pageCount: number | null;
  audioSeconds: number | null;
}): number {
  const maxProgress = getMaxProgressForDisplay(params);

  if (!Number.isFinite(params.progress) || !Number.isFinite(maxProgress) || maxProgress <= 0) {
    return 0;
  }

  const ratio = params.progress / maxProgress;
  const clampedRatio = Math.min(1, Math.max(0, ratio));

  return Math.round(clampedRatio * 100);
}
