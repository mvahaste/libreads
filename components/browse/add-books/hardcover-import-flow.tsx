"use client";

import { BrowseSearchInput } from "@/components/browse/browse-search-input";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CoverImage from "@/components/ui/cover-image";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { useTRPC } from "@/lib/trpc/client";
import { formatDurationForDisplay } from "@/lib/utils/duration";
import { resolveMappedErrorMessage } from "@/lib/utils/trpc-errors";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const HARDCOVER_PER_PAGE = 10;

type HardcoverWork = {
  id: number;
  title: string;
  subtitle?: string;
  authorNames: string[];
  image?: string;
  releaseYear?: number;
};

type HardcoverEdition = {
  id: number;
  title: string;
  subtitle?: string;
  bookType?: "PHYSICAL" | "EBOOK" | "AUDIOBOOK";
  format?: string;
  audioSeconds?: number;
  pages?: number;
  releaseYear?: number;
  isbn10?: string;
  isbn13?: string;
  publisher?: { id: number; name: string };
  authors: { id: number; name: string }[];
  image?: { url: string };
  workId: number;
};

function includesText(value: string | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

export function HardcoverImportFlow() {
  const t = useTranslations("browse.add-books.import-flow");
  const tBrowse = useTranslations("browse");
  const tDetail = useTranslations("browse.detail");
  const tActions = useTranslations("common.actions");

  const trpc = useTRPC();
  const router = useRouter();
  const { invalidateFormAndBrowse } = useBooksQueryInvalidation();

  const [workQuery, setWorkQuery] = useState("");
  const [workPage, setWorkPage] = useState(1);
  const [selectedWork, setSelectedWork] = useState<HardcoverWork | null>(null);
  const [editionQuery, setEditionQuery] = useState("");
  const [selectedEdition, setSelectedEdition] = useState<HardcoverEdition | null>(null);

  const normalizedWorkQuery = workQuery.trim();
  const normalizedEditionQuery = editionQuery.trim().toLowerCase();

  const hardcoverErrorMessageByCode = useMemo(
    () => ({
      HARDCOVER_API_TOKEN_NOT_CONFIGURED: t("api-token-missing"),
      HARDCOVER_API_REQUEST_FAILED: t("api-error"),
      HARDCOVER_API_INVALID_RESPONSE: t("api-error"),
    }),
    [t],
  );

  const workSearchQuery = useQuery({
    ...trpc.hardcover.search.queryOptions({
      q: normalizedWorkQuery,
      page: workPage,
      perPage: HARDCOVER_PER_PAGE,
    }),
    enabled: normalizedWorkQuery.length > 0,
  });

  const workEditionsQuery = useQuery({
    ...trpc.hardcover.workEditions.queryOptions({ workId: selectedWork?.id ?? -1 }),
    enabled: Boolean(selectedWork),
  });

  const editionDetailsQuery = useQuery({
    ...trpc.hardcover.editionDetails.queryOptions({ id: selectedEdition?.id ?? -1 }),
    enabled: Boolean(selectedEdition),
  });

  const filteredEditions = useMemo(() => {
    const editions = workEditionsQuery.data?.results ?? [];
    if (!normalizedEditionQuery) return editions;

    return editions.filter((edition) => {
      if (includesText(edition.title, normalizedEditionQuery)) return true;
      if (includesText(edition.subtitle, normalizedEditionQuery)) return true;
      if (includesText(edition.format, normalizedEditionQuery)) return true;
      if (includesText(edition.isbn10, normalizedEditionQuery)) return true;
      if (includesText(edition.isbn13, normalizedEditionQuery)) return true;
      if (includesText(edition.publisher?.name, normalizedEditionQuery)) return true;

      return edition.authors.some((author) => includesText(author.name, normalizedEditionQuery));
    });
  }, [normalizedEditionQuery, workEditionsQuery.data?.results]);

  const importMutation = useMutation(trpc.books.import.mutationOptions());

  const { submit: submitImport, isPending: isImportPending } = useSubmitMutation({
    mutation: importMutation,
    defaultErrorMessage: t("import-error"),
    errorMessageByCode: {
      BOOK_ALREADY_EXISTS: t("already-exists"),
      EDITION_NOT_FOUND: t("edition-not-found"),
      HARDCOVER_API_TOKEN_NOT_CONFIGURED: t("api-token-missing"),
      HARDCOVER_API_REQUEST_FAILED: t("api-error"),
      HARDCOVER_API_INVALID_RESPONSE: t("api-error"),
      IMPORT_FAILED: t("import-error"),
    },
    onSuccess: async (result) => {
      await invalidateFormAndBrowse();
      toast.success(t("import-success"));
      router.replace(`/browse/books/${result.slug}`);
    },
  });

  const activeStepLabel = useMemo(() => {
    if (!selectedWork) return t("step-work");
    if (!selectedEdition) return t("step-edition");
    return t("step-confirm");
  }, [selectedEdition, selectedWork, t]);

  const pageInfo = workSearchQuery.data;
  const pageSize = pageInfo?.perPage ?? HARDCOVER_PER_PAGE;
  const total = pageInfo?.found ?? 0;
  const page = pageInfo?.page ?? workPage;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isWorkSearchLoading = workSearchQuery.isFetching && !workSearchQuery.data;
  const isEditionsLoading = workEditionsQuery.isFetching && !workEditionsQuery.data;
  const isDetailsLoading = editionDetailsQuery.isFetching && !editionDetailsQuery.data;

  async function handleConfirmImport() {
    if (!selectedEdition) {
      return;
    }

    await submitImport({ editionId: selectedEdition.id });
  }

  function resetFromWorkSelection() {
    setSelectedWork(null);
    setSelectedEdition(null);
    setEditionQuery("");
  }

  function resetFromEditionSelection() {
    setSelectedEdition(null);
  }

  function getTypeLabel(type: HardcoverEdition["bookType"] | undefined) {
    if (type === "AUDIOBOOK") return tDetail("audiobook");
    if (type === "EBOOK") return tDetail("ebook");
    if (type === "PHYSICAL") return tDetail("physical");
    return t("unknown");
  }

  function renderErrorAlert({
    title,
    description,
    actions,
    inlineActions = false,
  }: {
    title: string;
    description: string;
    actions?: ReactNode;
    inlineActions?: boolean;
  }) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        {actions ? (
          <AlertAction
            className={
              inlineActions ? "static mt-3 flex flex-wrap gap-2 group-has-[>svg]/alert:col-start-2" : undefined
            }
          >
            {actions}
          </AlertAction>
        ) : null}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Badge variant="secondary">{activeStepLabel}</Badge>

      {!selectedWork && (
        <section className="space-y-4">
          <BrowseSearchInput
            value={workQuery}
            onChange={(value) => {
              setWorkQuery(value);
              setWorkPage(1);
            }}
            placeholder={t("search-work-placeholder")}
          />

          {normalizedWorkQuery.length === 0 && <p className="text-muted-foreground text-sm">{t("search-to-begin")}</p>}

          {normalizedWorkQuery.length > 0 && isWorkSearchLoading && (
            <p className="text-muted-foreground text-sm">{t("loading-works")}</p>
          )}

          {workSearchQuery.error &&
            renderErrorAlert({
              title: t("alert-work-search-title"),
              description: resolveMappedErrorMessage({
                error: workSearchQuery.error,
                map: hardcoverErrorMessageByCode,
                fallback: t("api-error"),
              }),
              actions: (
                <Button type="button" variant="outline" onClick={() => workSearchQuery.refetch()}>
                  {t("retry")}
                </Button>
              ),
            })}

          {!workSearchQuery.error && normalizedWorkQuery.length > 0 && !isWorkSearchLoading && (
            <>
              {workSearchQuery.data && workSearchQuery.data.results.length > 0 ? (
                <div className="space-y-3">
                  {workSearchQuery.data.results.map((result) => (
                    <div
                      key={result.id}
                      className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <CoverImage
                          width={80}
                          height={120}
                          title={result.title}
                          subtitle={result.subtitle}
                          imageUrl={result.image}
                          className="h-24"
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{result.title}</p>
                          {result.subtitle && <p className="text-muted-foreground text-xs">{result.subtitle}</p>}
                          <p className="text-muted-foreground text-xs">
                            {result.authorNames.join(", ") || t("unknown")}
                          </p>
                          {result.releaseYear && <p className="text-muted-foreground text-xs">{result.releaseYear}</p>}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setSelectedWork(result);
                          setSelectedEdition(null);
                          setEditionQuery("");
                        }}
                      >
                        {t("select-work")}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t("no-works")}</p>
              )}

              {total > 0 && (
                <div className="flex min-h-9 items-center justify-between gap-2">
                  <p className="text-muted-foreground text-sm">
                    {tBrowse("pagination.showing", {
                      from: (page - 1) * pageSize + 1,
                      to: Math.min(page * pageSize, total),
                      total,
                    })}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={page <= 1 || workSearchQuery.isFetching}
                      onClick={() => setWorkPage((current) => Math.max(1, current - 1))}
                    >
                      {tBrowse("pagination.previous")}
                    </Button>
                    <span className="text-muted-foreground px-2 text-sm">
                      {page} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={page >= totalPages || workSearchQuery.isFetching}
                      onClick={() => setWorkPage((current) => Math.min(totalPages, current + 1))}
                    >
                      {tBrowse("pagination.next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {selectedWork && !selectedEdition && (
        <section className="space-y-4">
          <div className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-muted-foreground text-xs">{t("selected-work")}</p>
              <p className="text-sm font-semibold">{selectedWork.title}</p>
              {selectedWork.subtitle && <p className="text-muted-foreground text-xs">{selectedWork.subtitle}</p>}
              <p className="text-muted-foreground text-xs">{selectedWork.authorNames.join(", ") || t("unknown")}</p>
            </div>
            <Button type="button" variant="outline" onClick={resetFromWorkSelection}>
              {t("change-work")}
            </Button>
          </div>

          <BrowseSearchInput
            value={editionQuery}
            onChange={setEditionQuery}
            placeholder={t("search-edition-placeholder")}
          />

          {isEditionsLoading && <p className="text-muted-foreground text-sm">{t("loading-editions")}</p>}

          {workEditionsQuery.error &&
            renderErrorAlert({
              title: t("alert-editions-title"),
              description: resolveMappedErrorMessage({
                error: workEditionsQuery.error,
                map: hardcoverErrorMessageByCode,
                fallback: t("api-error"),
              }),
              actions: (
                <>
                  <Button type="button" variant="outline" onClick={() => workEditionsQuery.refetch()}>
                    {t("retry")}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetFromWorkSelection}>
                    {t("back-to-search")}
                  </Button>
                </>
              ),
              inlineActions: true,
            })}

          {!workEditionsQuery.error && !isEditionsLoading && (
            <>
              {(workEditionsQuery.data?.results.length ?? 0) === 0 && (
                <p className="text-muted-foreground text-sm">{t("no-editions")}</p>
              )}

              {workEditionsQuery.data && workEditionsQuery.data.results.length > 0 && filteredEditions.length === 0 && (
                <p className="text-muted-foreground text-sm">{t("no-editions-filtered")}</p>
              )}

              <div className="space-y-3">
                {filteredEditions.map((edition) => (
                  <div
                    key={edition.id}
                    className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <CoverImage
                        width={80}
                        height={120}
                        title={edition.title}
                        subtitle={edition.subtitle}
                        imageUrl={edition.image?.url}
                        className="h-24"
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{edition.title}</p>
                        {edition.subtitle && <p className="text-muted-foreground text-xs">{edition.subtitle}</p>}

                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{getTypeLabel(edition.bookType)}</Badge>
                          {edition.format && <Badge variant="outline">{edition.format}</Badge>}
                          {edition.releaseYear && <Badge variant="outline">{edition.releaseYear}</Badge>}
                        </div>

                        <p className="text-muted-foreground text-xs">
                          {edition.authors.map((author) => author.name).join(", ")}
                        </p>

                        <p className="text-muted-foreground text-xs">
                          {edition.pages
                            ? `${edition.pages} ${tDetail("pages").toLowerCase()}`
                            : edition.audioSeconds
                              ? formatDurationForDisplay(edition.audioSeconds)
                              : t("unknown")}
                        </p>

                        {(edition.isbn13 || edition.isbn10) && (
                          <p className="text-muted-foreground text-xs">{edition.isbn13 ?? edition.isbn10}</p>
                        )}
                      </div>
                    </div>

                    <Button type="button" variant="secondary" onClick={() => setSelectedEdition(edition)}>
                      {t("select-edition")}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {selectedWork && selectedEdition && (
        <section className="space-y-4">
          <div className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-muted-foreground text-xs">{t("selected-work")}</p>
              <p className="text-sm font-semibold">{selectedWork.title}</p>
            </div>
            <Button type="button" variant="outline" onClick={resetFromWorkSelection}>
              {t("change-work")}
            </Button>
          </div>

          <div className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-muted-foreground text-xs">{t("selected-edition")}</p>
              <p className="text-sm font-semibold">{selectedEdition.title}</p>
              {selectedEdition.subtitle && <p className="text-muted-foreground text-xs">{selectedEdition.subtitle}</p>}
            </div>
            <Button type="button" variant="outline" onClick={resetFromEditionSelection}>
              {t("change-edition")}
            </Button>
          </div>

          {isDetailsLoading && <p className="text-muted-foreground text-sm">{t("loading-details")}</p>}

          {editionDetailsQuery.error &&
            renderErrorAlert({
              title: t("alert-details-title"),
              description: resolveMappedErrorMessage({
                error: editionDetailsQuery.error,
                map: hardcoverErrorMessageByCode,
                fallback: t("api-error"),
              }),
              actions: (
                <>
                  <Button type="button" variant="outline" onClick={() => editionDetailsQuery.refetch()}>
                    {t("retry")}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetFromEditionSelection}>
                    {t("back-to-editions")}
                  </Button>
                </>
              ),
              inlineActions: true,
            })}

          {!editionDetailsQuery.error && editionDetailsQuery.data && (
            <>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t("confirm-title")}</p>
                <p className="text-muted-foreground mt-1 text-xs">{t("confirm-description")}</p>

                <div className="mt-4 grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
                  <div>
                    <CoverImage
                      width={160}
                      height={240}
                      title={editionDetailsQuery.data.title}
                      subtitle={editionDetailsQuery.data.subtitle}
                      imageUrl={editionDetailsQuery.data.image?.url}
                      className="h-48"
                    />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-base font-semibold">{editionDetailsQuery.data.title}</p>
                      {editionDetailsQuery.data.subtitle && (
                        <p className="text-muted-foreground">{editionDetailsQuery.data.subtitle}</p>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <p>
                        <span className="text-muted-foreground">{t("authors")}: </span>
                        {editionDetailsQuery.data.authors.map((author) => author.name).join(", ") || t("unknown")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("publisher")}: </span>
                        {editionDetailsQuery.data.publisher?.name ?? t("unknown")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("year")}: </span>
                        {editionDetailsQuery.data.releaseYear ?? t("unknown")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("type")}: </span>
                        {getTypeLabel(editionDetailsQuery.data.type)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("format")}: </span>
                        {editionDetailsQuery.data.format ?? t("unknown")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("pages")}: </span>
                        {editionDetailsQuery.data.pages ?? t("unknown")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("duration")}: </span>
                        {editionDetailsQuery.data.audioSeconds
                          ? formatDurationForDisplay(editionDetailsQuery.data.audioSeconds)
                          : t("unknown")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("isbn13")}: </span>
                        {editionDetailsQuery.data.isbn13 ?? t("unknown")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("isbn10")}: </span>
                        {editionDetailsQuery.data.isbn10 ?? t("unknown")}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">{t("genres")}</p>
                      <div className="flex flex-wrap gap-1">
                        {editionDetailsQuery.data.genres.length > 0 ? (
                          editionDetailsQuery.data.genres.map((genre) => (
                            <Badge key={genre.id} variant="outline">
                              {genre.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">{t("unknown")}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">{t("series")}</p>
                      {editionDetailsQuery.data.series.length > 0 ? (
                        <ul className="space-y-1 text-xs">
                          {editionDetailsQuery.data.series.map((series) => (
                            <li key={series.id}>
                              {series.name}
                              {series.position > 0 ? ` #${series.position}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-xs">{t("no-series")}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" disabled={isImportPending} onClick={resetFromEditionSelection}>
                  {t("back-to-editions")}
                </Button>
                <Button type="button" disabled={isImportPending} onClick={handleConfirmImport}>
                  <LoadingSwap isLoading={isImportPending}>{t("import-action")}</LoadingSwap>
                </Button>
                <Button type="button" variant="outline" disabled={isImportPending} onClick={resetFromWorkSelection}>
                  {tActions("cancel")}
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
