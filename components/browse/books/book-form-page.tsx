"use client";

import { BrowseSectionHeader } from "@/components/browse/browse-section-header";
import { Button } from "@/components/ui/button";
import CoverImage from "@/components/ui/cover-image";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import FormField from "@/components/ui/form-field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { BOOK_COVER } from "@/lib/constants";
import { useTRPC } from "@/lib/trpc/client";
import type { BookDetailsOutput } from "@/lib/trpc/routers/books";
import {
  type BuildBookMutationInputError,
  type EditBookFormValues,
  buildCreateBookMutationInput,
  buildUniqueConflictInput,
  buildUpdateBookMutationInput,
  createEditBookSchema,
  currentValuePlaceholder,
  encodeExistingRelationRef,
  getCreateDefaultValues,
  getDefaultValues,
  mergeOptionsWithSelected,
} from "@/lib/utils/browse/books/book-form-utils";
import { formatDurationForInput } from "@/lib/utils/duration";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LucidePlus, LucideUpload, LucideX } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  useBookTypeFieldErrorCleanup,
  useCreatableRelationItems,
  useSeriesDuplicateValidation,
  useUniqueConflictFieldErrors,
} from "./book-form-hooks";
import { RelationMultiSelectField, RelationSingleSelectField, SeriesEntryRow } from "./book-form-relation-fields";
import { useBookCoverUpload } from "./use-book-form-cover-upload";

interface BookFormPageProps {
  mode: "edit" | "create";
  cancelHref: string;
  book?: BookDetailsOutput;
  initialValues?: Partial<EditBookFormValues>;
  onSuccess?: (result: { id: string; slug: string }) => Promise<void> | void;
}

export function BookFormPage({ mode, cancelHref, book, initialValues, onSuccess }: BookFormPageProps) {
  const isEditMode = mode === "edit";
  const editBook = isEditMode ? book : undefined;

  if (isEditMode && !editBook) {
    throw new Error("Edit book form requires a book.");
  }

  const t = useTranslations("browse.detail");
  const tActions = useTranslations("common.actions");
  const trpc = useTRPC();
  const { invalidateFormAndBrowse } = useBooksQueryInvalidation();
  const router = useRouter();
  const pageContentRef = useRef<HTMLDivElement>(null);

  const [publisherQuery, setPublisherQuery] = useState("");
  const [authorQuery, setAuthorQuery] = useState("");
  const [genreQuery, setGenreQuery] = useState("");
  const [seriesQueryByFieldId, setSeriesQueryByFieldId] = useState<Record<string, string>>({});

  const editBookSchema = createEditBookSchema({
    titleRequired: t("title-required"),
    isbn10Invalid: t("book-isbn10-invalid"),
    isbn13Invalid: t("book-isbn13-invalid"),
  });

  const defaultValues = useMemo(() => {
    if (isEditMode && editBook) {
      return getDefaultValues(editBook);
    }

    return getCreateDefaultValues(initialValues);
  }, [editBook, initialValues, isEditMode]);

  const form = useForm<EditBookFormValues>({
    resolver: zodResolver(editBookSchema),
    defaultValues,
  });

  const coverUploadScope = useMemo(
    () => (editBook ? ({ mode: "book", bookId: editBook.id } as const) : ({ mode: "temporary" } as const)),
    [editBook],
  );

  const {
    coverInputRef,
    handleCoverFileChange,
    handleClearCover,
    cleanupAllTemporaryCovers,
    clearTemporaryCoverTracking,
    isUploadingCover,
  } = useBookCoverUpload({
    scope: coverUploadScope,
    form,
    t,
  });

  const cleanupTemporaryCoversOnUnmountRef = useRef(cleanupAllTemporaryCovers);

  useEffect(() => {
    cleanupTemporaryCoversOnUnmountRef.current = cleanupAllTemporaryCovers;
  }, [cleanupAllTemporaryCovers]);

  useEffect(() => {
    return () => {
      if (!isEditMode) {
        cleanupTemporaryCoversOnUnmountRef.current();
      }
    };
  }, [isEditMode]);

  const {
    fields: seriesFields,
    append: appendSeries,
    remove: removeSeries,
  } = useFieldArray({
    control: form.control,
    name: "seriesEntries",
  });

  const { data: formOptions, isLoading: isFormOptionsLoading } = useQuery(trpc.books.bookFormOptions.queryOptions());

  const authorOptions = useMemo(
    () => mergeOptionsWithSelected(formOptions?.authors ?? [], editBook?.authors ?? []),
    [editBook, formOptions?.authors],
  );
  const genreOptions = useMemo(
    () => mergeOptionsWithSelected(formOptions?.genres ?? [], editBook?.genres ?? []),
    [editBook, formOptions?.genres],
  );
  const publisherOptions = useMemo(
    () => mergeOptionsWithSelected(formOptions?.publishers ?? [], editBook?.publisher ? [editBook.publisher] : []),
    [editBook, formOptions?.publishers],
  );
  const seriesOptions = useMemo(
    () => mergeOptionsWithSelected(formOptions?.series ?? [], editBook?.series ?? []),
    [editBook, formOptions?.series],
  );

  const authorsById = useMemo(() => new Map(authorOptions.map((author) => [author.id, author.name])), [authorOptions]);
  const genresById = useMemo(() => new Map(genreOptions.map((genre) => [genre.id, genre.name])), [genreOptions]);
  const publishersById = useMemo(
    () => new Map(publisherOptions.map((publisher) => [publisher.id, publisher.name])),
    [publisherOptions],
  );
  const seriesById = useMemo(() => new Map(seriesOptions.map((series) => [series.id, series.name])), [seriesOptions]);

  const publisherExistingRefs = useMemo(
    () => publisherOptions.map((publisher) => encodeExistingRelationRef(publisher.id)),
    [publisherOptions],
  );
  const authorExistingRefs = useMemo(
    () => authorOptions.map((author) => encodeExistingRelationRef(author.id)),
    [authorOptions],
  );
  const genreExistingRefs = useMemo(
    () => genreOptions.map((genre) => encodeExistingRelationRef(genre.id)),
    [genreOptions],
  );
  const seriesExistingRefs = useMemo(
    () => seriesOptions.map((series) => encodeExistingRelationRef(series.id)),
    [seriesOptions],
  );

  const watchedType = useWatch({ control: form.control, name: "type" });
  const watchedHardcoverId = useWatch({ control: form.control, name: "hardcoverId" });
  const watchedIsbn10 = useWatch({ control: form.control, name: "isbn10" });
  const watchedIsbn13 = useWatch({ control: form.control, name: "isbn13" });
  const watchedPublisherRef = useWatch({ control: form.control, name: "publisherRef" });
  const watchedAuthorRefs = useWatch({ control: form.control, name: "authorRefs", defaultValue: [] });
  const watchedGenreRefs = useWatch({ control: form.control, name: "genreRefs", defaultValue: [] });
  const watchedSeriesEntries = useWatch({ control: form.control, name: "seriesEntries", defaultValue: [] });

  const uniqueConflictInput = useMemo(
    () =>
      buildUniqueConflictInput({
        hardcoverId: watchedHardcoverId ?? "",
        isbn10: watchedIsbn10 ?? "",
        isbn13: watchedIsbn13 ?? "",
      }),
    [watchedHardcoverId, watchedIsbn10, watchedIsbn13],
  );
  const deferredUniqueConflictInput = useDeferredValue(uniqueConflictInput);

  const uniqueFieldConflicts = useQuery({
    ...trpc.books.bookFormConflicts.queryOptions({
      excludeBookId: editBook?.id,
      ...deferredUniqueConflictInput,
    }),
  });

  const { items: publisherItemRefs, createValue: publisherCreateRef } = useCreatableRelationItems({
    options: publisherOptions,
    existingRefs: publisherExistingRefs,
    query: publisherQuery,
    selectedValues: [watchedPublisherRef ?? ""],
    byId: publishersById,
  });

  const { items: authorItemRefs, createValue: authorCreateRef } = useCreatableRelationItems({
    options: authorOptions,
    existingRefs: authorExistingRefs,
    query: authorQuery,
    selectedValues: watchedAuthorRefs,
    byId: authorsById,
  });

  const { items: genreItemRefs, createValue: genreCreateRef } = useCreatableRelationItems({
    options: genreOptions,
    existingRefs: genreExistingRefs,
    query: genreQuery,
    selectedValues: watchedGenreRefs,
    byId: genresById,
  });

  function resetTransientState() {
    setPublisherQuery("");
    setAuthorQuery("");
    setGenreQuery("");
    setSeriesQueryByFieldId({});
  }

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const uniqueConflictMessages = useMemo(
    () => ({
      hardcoverId: t("book-hardcover-id-exists"),
      isbn10: t("book-isbn10-exists"),
      isbn13: t("book-isbn13-exists"),
    }),
    [t],
  );

  useUniqueConflictFieldErrors({
    form,
    conflictData: uniqueFieldConflicts.data,
    messages: uniqueConflictMessages,
  });

  useSeriesDuplicateValidation({
    form,
    seriesEntries: watchedSeriesEntries,
    seriesById,
    duplicateMessage: t("series-duplicate-entry"),
  });

  useBookTypeFieldErrorCleanup({
    form,
    type: watchedType,
  });

  const updateBook = useMutation(trpc.books.updateBook.mutationOptions());
  const createBook = useMutation(trpc.books.createBook.mutationOptions());

  async function handleSuccessfulSubmit(result: { id: string; slug: string }) {
    await invalidateFormAndBrowse();
    toast.success(isEditMode ? t("edit-book-success") : t("create-book-success"));
    clearTemporaryCoverTracking();
    form.reset(defaultValues);
    resetTransientState();
    await onSuccess?.(result);
    router.replace(`/browse/books/${result.slug}`);
  }

  const { submit: submitUpdateBook, isPending: isUpdatePending } = useSubmitMutation({
    mutation: updateBook,
    defaultErrorMessage: t("edit-book-error"),
    errorMessageByCode: {
      BOOK_SLUG_EXISTS: t("book-slug-exists"),
      BOOK_HARDCOVER_ID_EXISTS: t("book-hardcover-id-exists"),
      BOOK_ISBN10_EXISTS: t("book-isbn10-exists"),
      BOOK_ISBN13_EXISTS: t("book-isbn13-exists"),
      DUPLICATE_SERIES_ENTRY: t("series-duplicate-entry"),
    },
    onSuccess: async (result) => {
      await handleSuccessfulSubmit(result);
    },
  });

  const { submit: submitCreateBook, isPending: isCreatePending } = useSubmitMutation({
    mutation: createBook,
    defaultErrorMessage: t("create-book-error"),
    errorMessageByCode: {
      BOOK_SLUG_EXISTS: t("book-slug-exists"),
      BOOK_HARDCOVER_ID_EXISTS: t("book-hardcover-id-exists"),
      BOOK_ISBN10_EXISTS: t("book-isbn10-exists"),
      BOOK_ISBN13_EXISTS: t("book-isbn13-exists"),
      DUPLICATE_SERIES_ENTRY: t("series-duplicate-entry"),
    },
    onSuccess: async (result) => {
      await handleSuccessfulSubmit(result);
    },
  });

  const { isSubmitting: isFormSubmitting } = form.formState;
  const isSubmitting = isFormSubmitting || isUpdatePending || isCreatePending;
  const isBusy = isSubmitting || isUploadingCover;
  const descriptionFieldId = `${mode}-book-description`;
  const descriptionErrorId = `${mode}-book-description-error`;
  const typeFieldId = `${mode}-book-type`;
  const typeErrorId = `${mode}-book-type-error`;
  const selectedCoverId = useWatch({ control: form.control, name: "coverId" });
  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedSubtitle = useWatch({ control: form.control, name: "subtitle" });
  const watchedPublishYear = useWatch({ control: form.control, name: "publishYear" });
  const watchedFormat = useWatch({ control: form.control, name: "format" });
  const watchedPageCount = useWatch({ control: form.control, name: "pageCount" });
  const watchedAudioSecondsInput = useWatch({ control: form.control, name: "audioSeconds" });
  const placeholders = useMemo(() => {
    const fromCurrent = (value: string | number | null | undefined, fallback: string) => {
      if (!isEditMode) {
        return fallback;
      }

      return currentValuePlaceholder(value, fallback);
    };

    return {
      title: fromCurrent(editBook?.title, t("title-placeholder")),
      hardcoverId: fromCurrent(editBook?.hardcoverId, t("hardcover-id-placeholder")),
      subtitle: fromCurrent(editBook?.subtitle, t("subtitle-placeholder")),
      description: fromCurrent(editBook?.description, t("description-placeholder")),
      publishYear: fromCurrent(editBook?.publishYear, t("year-placeholder")),
      format: fromCurrent(editBook?.format, t("format-placeholder")),
      pageCount: fromCurrent(editBook?.pageCount, t("pages-placeholder")),
      audioDuration: fromCurrent(
        editBook?.audioSeconds != null ? formatDurationForInput(editBook.audioSeconds) : null,
        t("duration-placeholder"),
      ),
      isbn10: fromCurrent(editBook?.isbn10, t("isbn10")),
      isbn13: fromCurrent(editBook?.isbn13, t("isbn13")),
      publisher: fromCurrent(editBook?.publisher?.name, t("publisher-select-placeholder")),
      authors: fromCurrent(
        editBook?.authors.map((author) => author.name).join(", "),
        t("authors-existing-placeholder"),
      ),
      genres: fromCurrent(editBook?.genres.map((genre) => genre.name).join(", "), t("genres-existing-placeholder")),
    };
  }, [editBook, isEditMode, t]);

  const previewTitle = useMemo(() => {
    const nextTitle = watchedTitle?.trim();

    if (nextTitle) {
      return nextTitle;
    }

    return editBook?.title || t("unknown-title");
  }, [editBook?.title, t, watchedTitle]);

  const previewSubtitle = useMemo(() => {
    const nextSubtitle = watchedSubtitle?.trim();

    if (nextSubtitle) {
      return nextSubtitle;
    }

    return editBook?.subtitle || undefined;
  }, [editBook?.subtitle, watchedSubtitle]);

  const previewMetaParts = useMemo(() => {
    const parts: string[] = [];
    const publishYear = watchedPublishYear?.toString().trim();
    const format = watchedFormat?.trim();
    const pageCount = watchedPageCount?.toString().trim();
    const audioDuration = watchedAudioSecondsInput?.trim();

    if (publishYear) {
      parts.push(publishYear);
    }

    if (format) {
      parts.push(format);
    }

    if (watchedType === "AUDIOBOOK") {
      if (audioDuration) {
        parts.push(audioDuration);
      }
    } else if (pageCount) {
      parts.push(`${pageCount} ${t("pages").toLowerCase()}`);
    }

    return parts;
  }, [t, watchedAudioSecondsInput, watchedFormat, watchedPageCount, watchedPublishYear, watchedType]);

  async function handleSubmit(values: EditBookFormValues) {
    const buildArgs = {
      values,
      authorsById,
      genresById,
      messages: {
        durationFormatError: t("duration-format-error"),
        seriesPositionError: t("series-position-error"),
      },
    };

    if (isEditMode && editBook) {
      const result = buildUpdateBookMutationInput({
        bookId: editBook.id,
        ...buildArgs,
      });

      if ("error" in result) {
        const fieldError = result.error;
        form.setError(fieldError.field as BuildBookMutationInputError["field"], {
          type: "validate",
          message: fieldError.message,
        });
        return;
      }

      await submitUpdateBook(result.input);
      return;
    }

    const result = buildCreateBookMutationInput(buildArgs);

    if ("error" in result) {
      const fieldError = result.error;
      form.setError(fieldError.field as BuildBookMutationInputError["field"], {
        type: "validate",
        message: fieldError.message,
      });
      return;
    }

    await submitCreateBook(result.input);
  }

  return (
    <div ref={pageContentRef}>
      <BrowseSectionHeader
        title={isEditMode ? t("edit-book") : t("create-book")}
        description={isEditMode ? t("edit-book-description") : t("create-book-description")}
      />

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="space-y-3 rounded-lg border p-4">
              <CoverImage
                width={256}
                height={384}
                localCoverId={selectedCoverId ?? undefined}
                title={previewTitle}
                subtitle={previewSubtitle}
                className="mx-auto h-56"
              />
              <div className="space-y-1 text-sm">
                <p className="text-foreground text-base leading-tight font-semibold">{previewTitle}</p>
                {previewSubtitle && <p className="text-muted-foreground leading-snug">{previewSubtitle}</p>}
                {previewMetaParts.length > 0 && <p className="text-muted-foreground">{previewMetaParts.join(" · ")}</p>}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-muted-foreground text-sm font-semibold">{t("cover")}</h3>
              <input
                type="file"
                className="hidden"
                ref={coverInputRef}
                accept={BOOK_COVER.ACCEPTED_EXTENSIONS}
                onChange={handleCoverFileChange}
              />
              <Button type="button" variant="outline" disabled={isBusy} onClick={() => coverInputRef.current?.click()}>
                <LucideUpload />
                <LoadingSwap isLoading={isUploadingCover}>
                  {selectedCoverId ? t("replace-cover") : t("upload-cover")}
                </LoadingSwap>
              </Button>
              <Button type="button" variant="outline" disabled={isBusy || !selectedCoverId} onClick={handleClearCover}>
                <LucideX />
                {t("clear-cover")}
              </Button>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="space-y-4">
              <FieldGroup>
                <FormField
                  control={form.control}
                  disabled={isBusy}
                  name="title"
                  label={t("title")}
                  placeholder={placeholders.title}
                />

                <FormField
                  control={form.control}
                  disabled={isBusy}
                  name="subtitle"
                  label={t("subtitle")}
                  placeholder={placeholders.subtitle}
                />

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={descriptionFieldId}>{t("description")}</FieldLabel>
                      <Textarea
                        {...field}
                        id={descriptionFieldId}
                        placeholder={placeholders.description}
                        disabled={isBusy}
                        rows={5}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? descriptionErrorId : undefined}
                      />
                      {fieldState.error && <FieldError id={descriptionErrorId} errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </section>

            <Separator />

            <section className="space-y-4">
              <FieldGroup>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Controller
                    name="type"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={typeFieldId}>{t("type")}</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isBusy}>
                          <SelectTrigger id={typeFieldId} aria-invalid={fieldState.invalid}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PHYSICAL">{t("physical")}</SelectItem>
                            <SelectItem value="EBOOK">{t("ebook")}</SelectItem>
                            <SelectItem value="AUDIOBOOK">{t("audiobook")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.error && <FieldError id={typeErrorId} errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    disabled={isBusy}
                    name="format"
                    label={t("format")}
                    placeholder={placeholders.format}
                  />

                  <FormField
                    control={form.control}
                    disabled={isBusy}
                    name="publishYear"
                    label={t("year")}
                    placeholder={placeholders.publishYear}
                    type="number"
                  />
                </div>
              </FieldGroup>
            </section>

            <Separator />

            <section className="space-y-4">
              <FieldGroup>
                {watchedType !== "AUDIOBOOK" && (
                  <FormField
                    control={form.control}
                    disabled={isBusy}
                    name="pageCount"
                    label={t("pages")}
                    placeholder={placeholders.pageCount}
                    type="number"
                  />
                )}

                {watchedType === "AUDIOBOOK" && (
                  <FormField
                    control={form.control}
                    disabled={isBusy}
                    name="audioSeconds"
                    label={t("audio-duration")}
                    placeholder={placeholders.audioDuration}
                    type="text"
                    pattern="\d+:[0-5]\d:[0-5]\d"
                    inputMode="numeric"
                  />
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    disabled={isBusy}
                    name="isbn13"
                    label={t("isbn13")}
                    placeholder={placeholders.isbn13}
                  />
                  <FormField
                    control={form.control}
                    disabled={isBusy}
                    name="isbn10"
                    label={t("isbn10")}
                    placeholder={placeholders.isbn10}
                  />
                  <FormField
                    control={form.control}
                    disabled={isBusy}
                    name="hardcoverId"
                    label={t("hardcover-id")}
                    placeholder={placeholders.hardcoverId}
                    type="number"
                    inputMode="numeric"
                  />
                </div>
              </FieldGroup>
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="text-muted-foreground text-sm font-semibold">{t("relations")}</h3>

              <RelationSingleSelectField
                control={form.control}
                name="publisherRef"
                label={t("publisher")}
                placeholder={placeholders.publisher}
                items={publisherItemRefs}
                createValue={publisherCreateRef}
                byId={publishersById}
                disabled={isBusy || isFormOptionsLoading}
                onSearchChange={setPublisherQuery}
                onSelectionCommitted={() => setPublisherQuery("")}
                t={t}
              />

              <RelationMultiSelectField
                control={form.control}
                name="authorRefs"
                label={t("authors-existing")}
                placeholder={placeholders.authors}
                items={authorItemRefs}
                createValue={authorCreateRef}
                byId={authorsById}
                disabled={isBusy || isFormOptionsLoading}
                onSearchChange={setAuthorQuery}
                onSelectionCommitted={() => setAuthorQuery("")}
                t={t}
              />

              <RelationMultiSelectField
                control={form.control}
                name="genreRefs"
                label={t("genres-existing")}
                placeholder={placeholders.genres}
                items={genreItemRefs}
                createValue={genreCreateRef}
                byId={genresById}
                disabled={isBusy || isFormOptionsLoading}
                onSearchChange={setGenreQuery}
                onSelectionCommitted={() => setGenreQuery("")}
                t={t}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FieldLabel>{t("series")}</FieldLabel>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() =>
                      appendSeries({
                        seriesRef: "",
                        position: "",
                      })
                    }
                  >
                    <LucidePlus />
                    {t("add-series-entry")}
                  </Button>
                </div>

                {seriesFields.length === 0 && <p className="text-muted-foreground text-sm">{t("no-series-entries")}</p>}

                <div className="space-y-3">
                  {seriesFields.map((seriesField, index) => (
                    <SeriesEntryRow
                      key={seriesField.id}
                      control={form.control}
                      index={index}
                      fieldId={seriesField.id}
                      query={seriesQueryByFieldId[seriesField.id] ?? ""}
                      seriesOptions={seriesOptions}
                      seriesExistingRefs={seriesExistingRefs}
                      seriesById={seriesById}
                      isBusy={isBusy}
                      isFormOptionsLoading={isFormOptionsLoading}
                      onQueryChange={(fieldId, query) =>
                        setSeriesQueryByFieldId((prev) => ({
                          ...prev,
                          [fieldId]: query,
                        }))
                      }
                      onRemove={() => {
                        setSeriesQueryByFieldId((prev) => {
                          const next = { ...prev };
                          delete next[seriesField.id];
                          return next;
                        });
                        removeSeries(index);
                      }}
                      editBookSeriesName={editBook?.series[index]?.name}
                      editBookSeriesPosition={editBook?.series[index]?.position}
                      labels={{
                        seriesExisting: t("title"),
                        seriesExistingPlaceholder: t("series-existing-placeholder"),
                        seriesPosition: t("series-position"),
                        seriesPositionPlaceholder: t("series-position-placeholder"),
                        removeSeriesEntry: t("remove-series-entry"),
                      }}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          <Button asChild variant="outline" type="button" disabled={isBusy}>
            <Link href={cancelHref}>{tActions("cancel")}</Link>
          </Button>
          <Button type="submit" disabled={isBusy}>
            <LoadingSwap isLoading={isBusy}>
              {isEditMode ? tActions("saveChanges") : t("create-book-action")}
            </LoadingSwap>
          </Button>
        </div>
      </form>
    </div>
  );
}
