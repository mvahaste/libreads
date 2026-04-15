import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { BOOK_COVER } from "@/lib/constants";
import {
  type BookCoverUploadErrorCode,
  type BookCoverUploadSuccessResponse,
  mapBookCoverUploadError,
} from "@/lib/utils/browse/books/book-form-cover-utils";
import { type EditBookFormValues } from "@/lib/utils/browse/books/book-form-utils";
import { fetchWithTimeout } from "@/lib/utils/fetch";
import { uploadFileAsFormData, validateUploadFile } from "@/lib/utils/file-upload-client";
import { useMutation } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

export type BookCoverUploadScope =
  | {
      mode: "book";
      bookId: string;
    }
  | {
      mode: "temporary";
    };

interface UseBookCoverUploadParams {
  scope: BookCoverUploadScope;
  form: UseFormReturn<EditBookFormValues>;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

function getCoverUploadUrl(scope: BookCoverUploadScope): string {
  if (scope.mode === "book") {
    return `/api/books/${scope.bookId}/cover`;
  }

  return "/api/books/cover-temp";
}

function getCoverCleanupUrl(scope: BookCoverUploadScope, imageId: string): string {
  const query = `?imageId=${encodeURIComponent(imageId)}`;

  if (scope.mode === "book") {
    return `/api/books/${scope.bookId}/cover${query}`;
  }

  return `/api/books/cover-temp${query}`;
}

export function useBookCoverUpload({ scope, form, t }: UseBookCoverUploadParams) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [temporaryCoverIds, setTemporaryCoverIds] = useState<string[]>([]);

  const cleanupTemporaryCover = useCallback(
    async (imageId: string): Promise<void> => {
      try {
        await fetchWithTimeout(getCoverCleanupUrl(scope, imageId), { method: "DELETE" }, 8000);
      } catch {
        // Ignore cleanup errors to avoid interrupting form interactions.
      }
    },
    [scope],
  );

  const cleanupAllTemporaryCovers = useCallback(() => {
    const pendingTemporaryCoverIds = [...temporaryCoverIds];
    setTemporaryCoverIds([]);

    for (const imageId of pendingTemporaryCoverIds) {
      void cleanupTemporaryCover(imageId);
    }
  }, [cleanupTemporaryCover, temporaryCoverIds]);

  const clearTemporaryCoverTracking = useCallback(() => {
    setTemporaryCoverIds([]);
  }, []);

  const uploadBookCover = useMutation({
    mutationFn: (file: File) =>
      uploadFileAsFormData<BookCoverUploadSuccessResponse, BookCoverUploadErrorCode>(getCoverUploadUrl(scope), file, {
        timeoutMs: 12000,
        mapError: (code) => mapBookCoverUploadError(code, t),
      }),
  });

  const { submit: submitCoverUpload, isPending: isUploadingCover } = useSubmitMutation({
    mutation: uploadBookCover,
    defaultErrorMessage: t("cover-upload-error"),
    onSuccess: (payload) => {
      const previousCoverId = form.getValues("coverId");

      if (previousCoverId && temporaryCoverIds.includes(previousCoverId)) {
        setTemporaryCoverIds((prev) => prev.filter((id) => id !== previousCoverId));
        void cleanupTemporaryCover(previousCoverId);
      }

      setTemporaryCoverIds((prev) => (prev.includes(payload.imageId) ? prev : [...prev, payload.imageId]));
      form.setValue("coverId", payload.imageId, { shouldDirty: true });
      toast.success(t("cover-upload-success"));
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message || t("cover-upload-error"));
      } else {
        toast.error(t("cover-upload-error"));
      }

      return true;
    },
  });

  function handleCoverFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateUploadFile(file, {
      acceptedTypes: BOOK_COVER.ACCEPTED_TYPES,
      maxSize: BOOK_COVER.MAX_SIZE,
    });

    if (validationError) {
      toast.error(validationError === "INVALID_FILE_TYPE" ? t("cover-invalid-type") : t("cover-too-large"));
      e.target.value = "";
      return;
    }

    void submitCoverUpload(file);
    e.target.value = "";
  }

  function handleClearCover() {
    const currentCoverId = form.getValues("coverId");

    if (currentCoverId && temporaryCoverIds.includes(currentCoverId)) {
      setTemporaryCoverIds((prev) => prev.filter((id) => id !== currentCoverId));
      void cleanupTemporaryCover(currentCoverId);
    }

    form.setValue("coverId", null, { shouldDirty: true });
  }

  return {
    coverInputRef,
    handleCoverFileChange,
    handleClearCover,
    cleanupAllTemporaryCovers,
    clearTemporaryCoverTracking,
    isUploadingCover,
  };
}
