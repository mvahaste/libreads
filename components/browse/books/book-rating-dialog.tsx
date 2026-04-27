"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils/cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LucideStar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod/v4";

interface BookRatingDialogProps {
  bookId: string;
  initialRating: number | null;
  className?: string;
}

function createRatingSchema() {
  return z.object({
    rating: z.coerce.number().min(0.5).max(5).multipleOf(0.5),
  });
}

type RatingFormValues = z.infer<ReturnType<typeof createRatingSchema>>;
type RatingFormInput = z.input<ReturnType<typeof createRatingSchema>>;

export default function BookRatingDialog({ bookId, initialRating, className }: BookRatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const t = useTranslations("browse.detail");

  const maxRating = 5;
  const rating = initialRating;
  const displayRating = rating ?? 0;

  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating - fullStars >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const content = (
    <RatingForm
      bookId={bookId}
      initialRating={rating ?? 0.5}
      onSuccess={() => {
        setOpen(false);
      }}
      onPendingChange={setIsPending}
    />
  );

  const trigger = (
    <Button variant="outline" className={cn("gap-1", className)}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <LucideStar key={`full-star-${i}`} className="h-4 w-4 fill-current text-yellow-400" />
      ))}

      {hasHalfStar && (
        <span className="relative inline-flex h-4 w-4">
          <LucideStar className="text-muted-foreground absolute inset-0 h-4 w-4" />
          <span className="absolute inset-0 w-1/2 overflow-hidden">
            <LucideStar className="h-4 w-4 fill-current text-yellow-400" />
          </span>
        </span>
      )}

      {Array.from({ length: emptyStars }).map((_, i) => (
        <LucideStar key={`empty-star-${i}`} className="text-muted-foreground h-4 w-4" />
      ))}
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
          <ResponsiveDialogTitle>{t("rate-book-title")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t("rate-book-description")}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {content}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function RatingForm({
  bookId,
  initialRating,
  onSuccess,
  onPendingChange,
}: {
  bookId: string;
  initialRating: number;
  onSuccess: (rating: number | null) => void;
  onPendingChange: (isPending: boolean) => void;
}) {
  const t = useTranslations("browse.detail");
  const tActions = useTranslations("common.actions");
  const tErrors = useTranslations("errors");
  const trpc = useTRPC();
  const { invalidateLibraryOverview } = useBooksQueryInvalidation();
  const router = useRouter();

  const schema = createRatingSchema();

  const form = useForm<RatingFormInput, unknown, RatingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rating: initialRating,
    },
  });

  useEffect(() => {
    form.reset({ rating: initialRating });
  }, [form, initialRating]);

  const { isSubmitting } = form.formState;
  const formId = `rating-form-${bookId}`;

  const rateBook = useMutation(trpc.books.rateBook.mutationOptions());
  const clearBookRating = useMutation(trpc.books.clearBookRating.mutationOptions());

  const { submit: submitRateBook, isPending: isRateBookPending } = useSubmitMutation({
    mutation: rateBook,
    defaultErrorMessage: tErrors("unknown"),
    onSuccess: async (_data, variables) => {
      await invalidateLibraryOverview();
      router.refresh();

      onSuccess(variables.rating);
    },
  });

  const { submit: submitClearBookRating, isPending: isClearRatingPending } = useSubmitMutation({
    mutation: clearBookRating,
    defaultErrorMessage: tErrors("unknown"),
    onSuccess: async () => {
      await invalidateLibraryOverview();
      router.refresh();

      onSuccess(null);
    },
  });

  const isPending = isSubmitting || isRateBookPending || isClearRatingPending;

  useEffect(() => {
    onPendingChange(isPending);
  }, [isPending, onPendingChange]);

  async function handleSubmit(values: RatingFormValues) {
    await submitRateBook({
      bookId,
      rating: values.rating,
    });
  }

  async function handleClearRating() {
    await submitClearBookRating({ bookId });
  }

  return (
    <>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" aria-busy={isPending}>
        <ResponsiveDialogBody>
          <FieldGroup>
            <Controller
              name="rating"
              control={form.control}
              render={({ field, fieldState }) => {
                const inputValue =
                  typeof field.value === "number" || typeof field.value === "string" ? field.value : "";

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t("rating")}</FieldLabel>
                    <Input
                      type="number"
                      min={0.5}
                      max={5}
                      step={0.5}
                      placeholder={t("rating-placeholder")}
                      disabled={isPending}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={inputValue}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </ResponsiveDialogBody>
      </form>

      <ResponsiveDialogFooter>
        <ResponsiveDialogClose asChild>
          <Button type="button" variant="outline" disabled={isPending}>
            {tActions("cancel")}
          </Button>
        </ResponsiveDialogClose>
        <Button type="button" variant="destructive" disabled={isPending} onClick={handleClearRating}>
          <LoadingSwap isLoading={isClearRatingPending}>{t("clear-rating")}</LoadingSwap>
        </Button>
        <Button form={formId} type="submit" disabled={isPending}>
          <LoadingSwap isLoading={isPending}>{tActions("save")}</LoadingSwap>
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}
