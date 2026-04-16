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
import { useCallback, useEffect, useRef, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface UseBookCoverUploadParams {
  form: UseFormReturn<EditBookFormValues>;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

const COVER_UPLOAD_URL = "/api/books/cover";

function getCoverCleanupUrl(imageId: string): string {
  const query = `?imageId=${encodeURIComponent(imageId)}`;
  return `${COVER_UPLOAD_URL}${query}`;
}

export function useBookCoverUpload({ form, t }: UseBookCoverUploadParams) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [selectedCoverPreviewUrl, setSelectedCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (selectedCoverPreviewUrl) {
        URL.revokeObjectURL(selectedCoverPreviewUrl);
      }
    };
  }, [selectedCoverPreviewUrl]);

  const cleanupUploadedCover = useCallback(async (imageId: string): Promise<void> => {
    try {
      await fetchWithTimeout(getCoverCleanupUrl(imageId), { method: "DELETE" }, 8000);
    } catch {
      // Ignore cleanup errors to avoid interrupting form submission retries.
    }
  }, []);

  const clearSelectedCoverSelection = useCallback(() => {
    setSelectedCoverFile(null);
    setSelectedCoverPreviewUrl(null);

    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }, []);

  const uploadBookCover = useMutation({
    mutationFn: (file: File) =>
      uploadFileAsFormData<BookCoverUploadSuccessResponse, BookCoverUploadErrorCode>(COVER_UPLOAD_URL, file, {
        timeoutMs: 12000,
        mapError: (code) => mapBookCoverUploadError(code, t),
      }),
  });

  const uploadSelectedCoverOnSubmit = useCallback(async (): Promise<string | null> => {
    if (!selectedCoverFile) {
      return null;
    }

    try {
      const payload = await uploadBookCover.mutateAsync(selectedCoverFile);
      return payload.imageId;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || t("cover-upload-error"));
      } else {
        toast.error(t("cover-upload-error"));
      }

      throw error;
    }
  }, [selectedCoverFile, t, uploadBookCover]);

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

    setSelectedCoverFile(file);
    setSelectedCoverPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  }

  function handleClearCover() {
    clearSelectedCoverSelection();
    form.setValue("coverId", null, { shouldDirty: true });
  }

  return {
    coverInputRef,
    handleCoverFileChange,
    handleClearCover,
    uploadSelectedCoverOnSubmit,
    cleanupUploadedCover,
    clearSelectedCoverSelection,
    hasSelectedCoverFile: selectedCoverFile !== null,
    selectedCoverPreviewUrl,
    isUploadingCover: uploadBookCover.isPending,
  };
}
