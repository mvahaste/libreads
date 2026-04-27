"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ReadThroughStatus } from "@/generated/prisma/enums";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { READ_THROUGH_STATUS_COLORS } from "@/lib/books/status-colors";
import { useTRPC } from "@/lib/trpc/client";
import { cn } from "@/lib/utils/cn";
import { useMutation } from "@tanstack/react-query";
import { LucideTrash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ReadThroughItem = {
  id: string;
  status: ReadThroughStatus;
  startedAt: string;
  stoppedAt: string | null;
};

interface BookReadThroughHistoryProps {
  readThroughs: ReadThroughItem[];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function canDeleteReadThrough(status: ReadThroughItem["status"]) {
  return status === ReadThroughStatus.COMPLETED || status === ReadThroughStatus.ABANDONED;
}

export default function BookReadThroughHistory({ readThroughs }: BookReadThroughHistoryProps) {
  const t = useTranslations("browse.detail");
  const tStatus = useTranslations("common.readingStatus");
  const tActions = useTranslations("common.actions");

  const trpc = useTRPC();
  const router = useRouter();
  const { invalidateLibraryState } = useBooksQueryInvalidation();

  const [pendingDelete, setPendingDelete] = useState<ReadThroughItem | null>(null);

  const deleteReadThrough = useMutation(trpc.books.deleteReadThrough.mutationOptions());

  const { submit: submitDelete, isPending } = useSubmitMutation({
    mutation: deleteReadThrough,
    defaultErrorMessage: t("delete-read-through-error"),
    onSuccess: async () => {
      await invalidateLibraryState();
      router.refresh();
      toast.success(t("delete-read-through-success"));
    },
  });

  async function handleConfirmDelete() {
    if (!pendingDelete || isPending) return;

    const deleting = pendingDelete;
    const result = await submitDelete({ readThroughId: deleting.id });

    if (result) {
      setPendingDelete(null);
    }
  }

  if (readThroughs.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-muted-foreground mb-2 text-[0.625rem] font-bold tracking-wider uppercase">
        {t("read-throughs")}
      </h4>
      <div className="space-y-3">
        {readThroughs.map((readThrough, index) => {
          const canDelete = canDeleteReadThrough(readThrough.status);
          const num = readThroughs.length - index;

          return (
            <div
              key={readThrough.id}
              className="border-border bg-card flex min-w-0 flex-col gap-1 rounded-lg border p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-foreground text-sm font-medium">{t("read-through-label", { count: num })}</p>

                {canDelete && (
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label={t("delete-read-through")}
                    onClick={() => setPendingDelete(readThrough)}
                  >
                    <LucideTrash2 />
                  </Button>
                )}
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">{t("started")}:</span> {formatDate(readThrough.startedAt)}
              </p>
              {readThrough.stoppedAt && (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t("stopped")}:</span> {formatDate(readThrough.stoppedAt)}
                </p>
              )}
              <p className="text-sm">
                <span className="text-muted-foreground">{t("status")}:</span>{" "}
                <Badge className={cn("text-xs", READ_THROUGH_STATUS_COLORS[readThrough.status])}>
                  {tStatus(readThrough.status)}
                </Badge>
              </p>
            </div>
          );
        })}
      </div>

      <ResponsiveDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!isPending && !open) {
            setPendingDelete(null);
          }
        }}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("delete-read-through")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{t("delete-read-through-description")}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                {tActions("cancel")}
              </Button>
            </ResponsiveDialogClose>
            <Button variant="destructive" disabled={isPending} onClick={() => void handleConfirmDelete()}>
              <LoadingSwap isLoading={isPending}>{t("delete-read-through")}</LoadingSwap>
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
