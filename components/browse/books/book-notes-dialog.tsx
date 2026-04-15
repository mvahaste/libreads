"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { LucideNotebookPen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface BookNotesDialogProps {
  bookId: string;
  initialNotes: string | null;
}

export default function BookNotesDialog({ bookId, initialNotes }: BookNotesDialogProps) {
  const t = useTranslations("browse.detail");
  const tActions = useTranslations("common.actions");
  const trpc = useTRPC();
  const { invalidateLibraryOverview } = useBooksQueryInvalidation();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const formId = `book-notes-form-${bookId}`;
  const hasNotes = (initialNotes ?? "").trim().length > 0;

  const setBookNotes = useMutation(trpc.books.setBookNotes.mutationOptions());

  const { submit: submitBookNotes, isPending } = useSubmitMutation({
    mutation: setBookNotes,
    defaultErrorMessage: t("save-notes-error"),
    onSuccess: async (_result, variables) => {
      await invalidateLibraryOverview();
      router.refresh();
      toast.success(variables.notes.trim().length === 0 ? t("clear-notes") : t("save-notes-success"));
      setOpen(false);
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitBookNotes({ bookId, notes });
  }

  async function handleClear() {
    await submitBookNotes({ bookId, notes: "" });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }

    if (nextOpen) {
      setNotes(initialNotes ?? "");
    }
    setOpen(nextOpen);
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline">
          <LucideNotebookPen />
          {hasNotes ? t("edit-note") : t("add-note")}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("book-notes-title")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t("book-notes-description")}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form id={formId} onSubmit={handleSubmit} aria-busy={isPending}>
          <ResponsiveDialogBody>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("book-notes-placeholder")}
              rows={8}
              disabled={isPending}
            />
          </ResponsiveDialogBody>
        </form>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {tActions("cancel")}
            </Button>
          </ResponsiveDialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleClear}
            disabled={isPending || notes.trim().length === 0}
          >
            <LoadingSwap isLoading={isPending}>{t("clear-notes")}</LoadingSwap>
          </Button>
          <Button type="submit" form={formId} disabled={isPending}>
            <LoadingSwap isLoading={isPending}>{tActions("save")}</LoadingSwap>
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
