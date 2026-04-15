"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { useTRPC } from "@/lib/trpc/client";
import { cn } from "@/lib/utils/cn";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  LucideBookCheck,
  LucideBookMarked,
  LucideBookOpen,
  LucideCheck,
  LucideChevronDown,
  LucideCircleX,
  type LucideIcon,
  LucidePause,
  LucideRefreshCw,
  LucideTrash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ReadingStatus = {
  WANT_TO_READ: "WANT_TO_READ",
  READING: "READING",
  COMPLETED: "COMPLETED",
  PAUSED: "PAUSED",
  ABANDONED: "ABANDONED",
} as const;

type ReadingStatus = (typeof ReadingStatus)[keyof typeof ReadingStatus];

const STATUSES = [
  ReadingStatus.WANT_TO_READ,
  ReadingStatus.READING,
  ReadingStatus.COMPLETED,
  ReadingStatus.PAUSED,
  ReadingStatus.ABANDONED,
] as const;

const STATUS_ICONS: Record<ReadingStatus, LucideIcon> = {
  [ReadingStatus.WANT_TO_READ]: LucideBookMarked,
  [ReadingStatus.READING]: LucideBookOpen,
  [ReadingStatus.COMPLETED]: LucideBookCheck,
  [ReadingStatus.PAUSED]: LucidePause,
  [ReadingStatus.ABANDONED]: LucideCircleX,
};

const STATUS_COLORS: Record<ReadingStatus, string> = {
  [ReadingStatus.WANT_TO_READ]:
    "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30",
  [ReadingStatus.READING]:
    "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30",
  [ReadingStatus.COMPLETED]:
    "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30",
  [ReadingStatus.PAUSED]:
    "bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/30",
  [ReadingStatus.ABANDONED]:
    "bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30",
};

interface BookStatusButtonProps {
  bookId: string;
  initialStatus: ReadingStatus | null;
}

export default function BookStatusButton({ bookId, initialStatus }: BookStatusButtonProps) {
  const t = useTranslations("browse.reading-status");
  const tDetail = useTranslations("browse.detail");
  const tActions = useTranslations("common.actions");
  const tErrors = useTranslations("errors");

  const trpc = useTRPC();
  const { invalidateLibraryState } = useBooksQueryInvalidation();
  const router = useRouter();

  const [status, setStatus] = useState<ReadingStatus | null>(initialStatus);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const { data: libraryEntryStats } = useQuery({
    ...trpc.books.getLibraryEntryStats.queryOptions({ bookId }),
    enabled: removeDialogOpen && status !== null,
  });

  const setBookStatus = useMutation(trpc.books.setBookStatus.mutationOptions());

  const removeBook = useMutation(trpc.books.removeBookFromLibrary.mutationOptions());

  const { submit: submitStatus, isPending: isStatusPending } = useSubmitMutation({
    mutation: setBookStatus,
    defaultErrorMessage: tDetail("set-status-error"),
    onSuccess: async () => {
      await invalidateLibraryState();
      router.refresh();
    },
  });

  const { submit: submitRemoveBook, isPending: isRemovePending } = useSubmitMutation({
    mutation: removeBook,
    defaultErrorMessage: tErrors("unknown"),
    onSuccess: async () => {
      await invalidateLibraryState();
      router.refresh();
    },
  });

  const isActionPending = isStatusPending || isRemovePending;

  async function handleSetStatus(newStatus: ReadingStatus) {
    const previousStatus = status;

    const result = await submitStatus({ bookId, status: newStatus });

    if (!result) {
      setStatus(previousStatus);
      return;
    }

    setStatus(result.status as ReadingStatus | null);
  }

  async function handleRemove() {
    if (isRemovePending) {
      return;
    }

    const previousStatus = status;
    setStatus(null);
    setRemoveDialogOpen(false);

    const result = await submitRemoveBook({ bookId });

    if (!result) {
      setStatus(previousStatus);
      return;
    }

    toast.success(tDetail("remove-from-library-success"));
  }

  const CurrentIcon = status ? STATUS_ICONS[status] : null;

  return (
    <>
      {status ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(buttonVariants({ size: "default" }), STATUS_COLORS[status])}
              disabled={isActionPending}
            >
              {CurrentIcon && <CurrentIcon />}
              {t(status)}
              <LucideChevronDown />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuGroup>
              <StatusItems currentStatus={status} onSelect={handleSetStatus} disabled={isActionPending} />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isActionPending}
              onSelect={() => setRemoveDialogOpen(true)}
            >
              <LucideTrash2 />
              {tDetail("remove-from-library")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <ButtonGroup>
          <Button
            variant="outline"
            disabled={isActionPending}
            onClick={() => {
              void handleSetStatus(ReadingStatus.WANT_TO_READ);
            }}
          >
            <LucideBookMarked />
            {t("WANT_TO_READ")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isActionPending}>
                <LucideChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <StatusItems currentStatus={null} onSelect={handleSetStatus} disabled={isActionPending} />
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      )}

      <RemoveConfirmation
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onConfirm={handleRemove}
        isPending={isRemovePending}
        stats={libraryEntryStats}
        tDetail={tDetail}
        tActions={tActions}
      />
    </>
  );
}

function StatusItems({
  currentStatus,
  onSelect,
  disabled,
}: {
  currentStatus: ReadingStatus | null;
  onSelect: (status: ReadingStatus) => void;
  disabled: boolean;
}) {
  const t = useTranslations("browse.reading-status");
  const tDetail = useTranslations("browse.detail");

  return (
    <>
      {STATUSES.map((s) => {
        const isReadAgain =
          s === ReadingStatus.READING &&
          (currentStatus === ReadingStatus.COMPLETED || currentStatus === ReadingStatus.ABANDONED);
        const Icon = isReadAgain ? LucideRefreshCw : STATUS_ICONS[s];
        const label = isReadAgain ? tDetail("read-again") : t(s);
        return (
          <DropdownMenuItem key={s} disabled={disabled} onSelect={() => void onSelect(s)}>
            <Icon />
            {label}
            {s === currentStatus && <LucideCheck className="ml-auto" />}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

function RemoveConfirmation({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  stats,
  tDetail,
  tActions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  stats:
    | {
        tagCount: number;
        hasRating: boolean;
        hasNotes: boolean;
      }
    | null
    | undefined;
  tDetail: ReturnType<typeof useTranslations>;
  tActions: ReturnType<typeof useTranslations>;
}) {
  const statsDescription = stats
    ? `${tDetail("remove-from-library-description")} ${tDetail("remove-data-warning", {
        tags: stats.tagCount,
      })}`
    : tDetail("remove-from-library-description");

  return (
    <ResponsiveDialog open={open} onOpenChange={(isOpen) => !isPending && onOpenChange(isOpen)}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{tDetail("remove-from-library")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{statsDescription}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              {tActions("cancel")}
            </Button>
          </ResponsiveDialogClose>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            <LoadingSwap isLoading={isPending}>{tDetail("remove-from-library")}</LoadingSwap>
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
