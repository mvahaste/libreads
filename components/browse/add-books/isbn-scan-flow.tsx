"use client";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CoverImage from "@/components/ui/cover-image";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { useTRPC } from "@/lib/trpc/client";
import { formatDurationForDisplay } from "@/lib/utils/duration";
import { normalizeAndValidateIsbn } from "@/lib/utils/isbn";
import { resolveMappedErrorMessage } from "@/lib/utils/trpc-errors";
import { isExpectedZxingDecodeError } from "@/lib/utils/zxing";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarcodeFormat, BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

export function IsbnScanFlow() {
  const t = useTranslations("browse.add-books.scan-flow");
  const tDetail = useTranslations("browse.detail");
  const tActions = useTranslations("common.actions");

  const trpc = useTRPC();
  const router = useRouter();
  const { invalidateFormAndBrowse } = useBooksQueryInvalidation();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [scanAttempt, setScanAttempt] = useState(0);
  const [isScannerStarting, setIsScannerStarting] = useState(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [invalidScanMessage, setInvalidScanMessage] = useState<string | null>(null);

  const [scannedIsbn, setScannedIsbn] = useState<string | null>(null);

  const hardcoverErrorMessageByCode = useMemo(
    () => ({
      INVALID_ISBN: t("invalid-isbn"),
      HARDCOVER_API_TOKEN_NOT_CONFIGURED: t("api-token-missing"),
      HARDCOVER_API_REQUEST_FAILED: t("api-error"),
      HARDCOVER_API_INVALID_RESPONSE: t("api-error"),
    }),
    [t],
  );

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraErrorMessage(t("camera-not-supported"));
      return;
    }

    stopScanner();
    setCameraErrorMessage(null);
    setInvalidScanMessage(null);
    setIsScannerStarting(true);

    try {
      const scanner = new BrowserMultiFormatReader();
      scanner.possibleFormats = [BarcodeFormat.EAN_13];

      const controls = await scanner.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error, activeControls) => {
          if (result) {
            const normalizedIsbn = normalizeAndValidateIsbn(result.getText());

            if (!normalizedIsbn) {
              setInvalidScanMessage(t("invalid-isbn-scan"));
              return;
            }

            setScannedIsbn(normalizedIsbn.value);
            setInvalidScanMessage(null);
            setCameraErrorMessage(null);
            activeControls.stop();
            return;
          }

          if (error && !isExpectedZxingDecodeError(error)) {
            console.error("Scanner decode error:", error);
            activeControls.stop();
            setCameraErrorMessage(t("camera-read-failed"));
          }
        },
      );

      controlsRef.current = controls;
    } catch (error) {
      const errorName = (error as { name?: string }).name;

      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        setCameraErrorMessage(t("camera-permission-denied"));
      } else {
        console.error("Scanner start failed:", error);
        setCameraErrorMessage(t("camera-start-failed"));
      }
    } finally {
      setIsScannerStarting(false);
    }
  }, [stopScanner, t]);

  useEffect(() => {
    if (scannedIsbn) {
      stopScanner();
      return;
    }

    void startScanner();

    return () => {
      stopScanner();
    };
  }, [scanAttempt, scannedIsbn, startScanner, stopScanner]);

  const isbnLookupQuery = useQuery({
    ...trpc.hardcover.searchByIsbn.queryOptions({ isbn: scannedIsbn ?? "" }),
    enabled: Boolean(scannedIsbn),
  });

  const matchedEdition: HardcoverEdition | null = isbnLookupQuery.data?.results[0] ?? null;

  const editionDetailsQuery = useQuery({
    ...trpc.hardcover.editionDetails.queryOptions({ id: matchedEdition?.id ?? -1 }),
    enabled: Boolean(scannedIsbn && matchedEdition),
  });

  const importMutation = useMutation(trpc.books.import.mutationOptions());

  const { submit: submitImport, isPending: isImportPending } = useSubmitMutation({
    mutation: importMutation,
    defaultErrorMessage: t("import-error"),
    errorMessageByCode: {
      BOOK_ALREADY_EXISTS: t("already-exists"),
      EDITION_NOT_FOUND: t("edition-not-found"),
      IMPORTED_ISBN_INVALID: t("import-invalid-isbn"),
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

  const isLookupLoading = isbnLookupQuery.isFetching && !isbnLookupQuery.data;
  const isDetailsLoading = editionDetailsQuery.isFetching && !editionDetailsQuery.data;

  const activeStepLabel = useMemo(() => {
    if (!scannedIsbn) {
      return t("step-scan");
    }
    return t("step-confirm");
  }, [scannedIsbn, t]);

  const resetToScan = useCallback(() => {
    stopScanner();
    setScannedIsbn(null);
    setCameraErrorMessage(null);
    setInvalidScanMessage(null);
    setScanAttempt((current) => current + 1);
  }, [stopScanner]);

  async function handleConfirmImport() {
    if (!matchedEdition) {
      return;
    }

    await submitImport({ editionId: matchedEdition.id });
  }

  function getTypeLabel(type: HardcoverEdition["bookType"] | undefined) {
    if (type === "AUDIOBOOK") return tDetail("audiobook");
    if (type === "EBOOK") return tDetail("ebook");
    if (type === "PHYSICAL") return tDetail("physical");
    return t("unknown");
  }

  function renderAlert({
    title,
    description,
    onRetry,
    destructive,
  }: {
    title: string;
    description: string;
    onRetry?: () => void;
    destructive?: boolean;
  }) {
    return (
      <Alert variant={destructive ? "destructive" : "default"}>
        <AlertCircleIcon />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        {onRetry ? (
          <AlertAction>
            <Button type="button" variant="outline" onClick={onRetry}>
              {t("retry")}
            </Button>
          </AlertAction>
        ) : null}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Badge variant="secondary">{activeStepLabel}</Badge>

      {!scannedIsbn && (
        <section className="space-y-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-semibold">{t("camera-title")}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t("camera-description")}</p>

            <div className="mt-3 overflow-hidden rounded-lg border">
              <video ref={videoRef} autoPlay playsInline muted className="bg-muted aspect-video w-full object-cover" />
            </div>

            {isScannerStarting && <p className="text-muted-foreground mt-3 text-sm">{t("camera-loading")}</p>}
            {!cameraErrorMessage && !isScannerStarting && (
              <p className="text-muted-foreground mt-3 text-sm">{t("camera-active")}</p>
            )}
          </div>

          {invalidScanMessage
            ? renderAlert({
                title: t("alert-invalid-title"),
                description: invalidScanMessage,
                destructive: true,
              })
            : null}

          {cameraErrorMessage
            ? renderAlert({
                title: t("alert-camera-title"),
                description: cameraErrorMessage,
                onRetry: () => {
                  setCameraErrorMessage(null);
                  setScanAttempt((current) => current + 1);
                },
                destructive: true,
              })
            : null}

          <div className="flex justify-end">
            <Button asChild type="button" variant="outline">
              <Link href="/browse/add-books">{tActions("cancel")}</Link>
            </Button>
          </div>
        </section>
      )}

      {scannedIsbn && (
        <section className="space-y-4">
          <div className="bg-card flex items-start justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="text-muted-foreground text-xs">{t("scanned-isbn")}</p>
              <p className="text-sm font-semibold">{scannedIsbn}</p>
            </div>
            <Button type="button" variant="outline" onClick={resetToScan}>
              {t("scan-again")}
            </Button>
          </div>

          {isLookupLoading && <p className="text-muted-foreground text-sm">{t("looking-up-isbn")}</p>}

          {isbnLookupQuery.error
            ? renderAlert({
                title: t("alert-lookup-title"),
                description: resolveMappedErrorMessage({
                  error: isbnLookupQuery.error,
                  map: hardcoverErrorMessageByCode,
                  fallback: t("api-error"),
                }),
                onRetry: () => {
                  void isbnLookupQuery.refetch();
                },
                destructive: true,
              })
            : null}

          {!isbnLookupQuery.error &&
            !isLookupLoading &&
            !matchedEdition &&
            renderAlert({
              title: t("alert-no-editions-title"),
              description: t("no-editions"),
            })}

          {isDetailsLoading && <p className="text-muted-foreground text-sm">{t("loading-details")}</p>}

          {editionDetailsQuery.error
            ? renderAlert({
                title: t("alert-details-title"),
                description: resolveMappedErrorMessage({
                  error: editionDetailsQuery.error,
                  map: hardcoverErrorMessageByCode,
                  fallback: t("api-error"),
                }),
                onRetry: () => {
                  void editionDetailsQuery.refetch();
                },
                destructive: true,
              })
            : null}

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
                              {series.position != null ? ` #${series.position}` : ""}
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
                <Button type="button" disabled={isImportPending} onClick={handleConfirmImport}>
                  <LoadingSwap isLoading={isImportPending}>{t("import-action")}</LoadingSwap>
                </Button>
                <Button asChild type="button" variant="outline" disabled={isImportPending}>
                  <Link href="/browse/add-books">{tActions("cancel")}</Link>
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
