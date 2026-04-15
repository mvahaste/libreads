"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { useTRPC } from "@/lib/trpc/client";
import {
  formatDurationForInput,
  parseDurationInputToSeconds,
  secondsToHoursMinutesSeconds,
} from "@/lib/utils/duration";
import { useMutation } from "@tanstack/react-query";
import { LucideBookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BookProgressDialogProps {
  bookId: string;
  progressType: "PAGES" | "TIME" | "PERCENTAGE";
  currentProgress: number;
  pageCount: number | null;
  audioSeconds: number | null;
}

export default function BookProgressDialog({
  bookId,
  progressType,
  currentProgress,
  pageCount,
  audioSeconds,
}: BookProgressDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const t = useTranslations("browse.detail");
  const tBrowse = useTranslations("browse");

  const content = (
    <ProgressForm
      key={`${bookId}:${progressType}:${currentProgress}`}
      bookId={bookId}
      progressType={progressType}
      currentProgress={currentProgress}
      pageCount={pageCount}
      audioSeconds={audioSeconds}
      pageLabel={tBrowse("pagination.page")}
      onSuccess={() => setOpen(false)}
      onPendingChange={setIsPending}
    />
  );

  const trigger = (
    <Button variant="outline">
      <LucideBookmark />
      {t("update-progress")}
    </Button>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) {
          return;
        }

        setOpen(nextOpen);
      }}
    >
      <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("update-progress-title")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t("update-progress-description")}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {content}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function ProgressForm({
  bookId,
  progressType,
  currentProgress,
  pageCount,
  audioSeconds,
  pageLabel,
  onSuccess,
  onPendingChange,
}: {
  bookId: string;
  progressType: "PAGES" | "TIME" | "PERCENTAGE";
  currentProgress: number;
  pageCount: number | null;
  audioSeconds: number | null;
  pageLabel: string;
  onSuccess: () => void;
  onPendingChange: (isPending: boolean) => void;
}) {
  const t = useTranslations("browse.detail");
  const tActions = useTranslations("common.actions");
  const trpc = useTRPC();
  const { invalidateLibraryState } = useBooksQueryInvalidation();
  const router = useRouter();

  const [progress, setProgress] = useState(() =>
    progressType === "TIME" ? formatDurationForInput(currentProgress) : String(currentProgress),
  );
  const formId = `progress-form-${bookId}`;

  const setReadingProgress = useMutation(trpc.books.setReadingProgress.mutationOptions());

  const { submit: submitSetProgress, isPending } = useSubmitMutation<
    { autoCompleted: boolean },
    { bookId: string; progress: number }
  >({
    submitAsync: async (variables) => {
      const data = await setReadingProgress.mutateAsync(variables as never);
      return data as { autoCompleted: boolean };
    },
    isPending: setReadingProgress.isPending,
    defaultErrorMessage: t("update-progress-error"),
    onSuccess: async (data) => {
      await invalidateLibraryState();
      router.refresh();

      if (data.autoCompleted) {
        toast.success(t("update-progress-completed"));
      } else {
        toast.success(t("update-progress-success"));
      }

      onSuccess();
    },
  });

  useEffect(() => {
    onPendingChange(isPending);
  }, [isPending, onPendingChange]);

  function getProgressValue(): number {
    if (progressType === "TIME") {
      const parsed = parseDurationInputToSeconds(progress);
      return parsed ?? Number.NaN;
    }
    return Number(progress) || 0;
  }

  function getMaxProgress(): number {
    switch (progressType) {
      case "PAGES":
        return pageCount ?? 100;
      case "TIME":
        return audioSeconds ?? 100;
      case "PERCENTAGE":
        return 100;
    }
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    const value = getProgressValue();
    if (!Number.isFinite(value) || value < 0 || value > getMaxProgress()) return;

    await submitSetProgress({
      bookId,
      progress: value,
    });
  }

  return (
    <>
      <ResponsiveDialogBody>
        <form id={formId} onSubmit={handleSubmit} className="space-y-4" aria-busy={isPending}>
          <div className="space-y-2">
            <Label htmlFor="progress">
              {progressType === "PAGES" && pageLabel}
              {progressType === "TIME" && t("progress-time-label")}
              {progressType === "PERCENTAGE" && t("progress-percentage-label")}
            </Label>
            {progressType === "PAGES" && (
              <div className="flex items-center gap-2">
                <Input
                  id="progress"
                  type="number"
                  min={0}
                  max={pageCount ?? undefined}
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder={t("progress-placeholder")}
                  disabled={isPending}
                  required
                />
                {pageCount && <span className="text-muted-foreground text-sm whitespace-nowrap">/ {pageCount}</span>}
              </div>
            )}
            {progressType === "TIME" && (
              <div className="flex items-center gap-2">
                <Input
                  id="progress"
                  type="text"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder={t("progress-time-placeholder")}
                  pattern="\d+:[0-5]\d:[0-5]\d"
                  disabled={isPending}
                  required
                />
                {audioSeconds != null && (
                  <span className="text-muted-foreground text-sm whitespace-nowrap">
                    / {secondsToHoursMinutesSeconds(audioSeconds)}
                  </span>
                )}
              </div>
            )}
            {progressType === "PERCENTAGE" && (
              <div className="flex items-center gap-2">
                <Input
                  id="progress"
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder={t("progress-placeholder")}
                  disabled={isPending}
                  required
                />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
            )}
          </div>
        </form>
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter>
        <ResponsiveDialogClose asChild>
          <Button type="button" variant="outline" disabled={isPending}>
            {tActions("cancel")}
          </Button>
        </ResponsiveDialogClose>
        <Button type="submit" form={formId} disabled={isPending}>
          <LoadingSwap isLoading={isPending}>{t("update-progress")}</LoadingSwap>
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}
