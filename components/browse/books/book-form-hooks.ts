import {
  type EditBookFormValues,
  type RelationOption,
  buildCreatableItems,
  normalizeEntityName,
  resolveRelationLabel,
  toLowercaseNameSet,
} from "@/lib/utils/browse/books/book-form-utils";
import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

type UniqueConflictField = "hardcoverId" | "isbn10" | "isbn13";
type UniqueConflictMessages = Record<UniqueConflictField, string>;
type UniqueConflictData = Partial<Record<UniqueConflictField, boolean>> | undefined;

const UNIQUE_CONFLICT_FIELDS: UniqueConflictField[] = ["hardcoverId", "isbn10", "isbn13"];

interface UseUniqueConflictFieldErrorsParams {
  form: UseFormReturn<EditBookFormValues>;
  conflictData: UniqueConflictData;
  messages: UniqueConflictMessages;
}

export function useUniqueConflictFieldErrors({ form, conflictData, messages }: UseUniqueConflictFieldErrorsParams) {
  useEffect(() => {
    for (const field of UNIQUE_CONFLICT_FIELDS) {
      const fieldError = form.getFieldState(field).error;

      if (conflictData?.[field]) {
        form.setError(field, { type: "conflict", message: messages[field] });
      } else if (fieldError?.type === "conflict") {
        form.clearErrors(field);
      }
    }
  }, [conflictData, form, messages]);
}

interface UseSeriesDuplicateValidationParams {
  form: UseFormReturn<EditBookFormValues>;
  seriesEntries: EditBookFormValues["seriesEntries"];
  seriesById: Map<string, string>;
  duplicateMessage: string;
}

export function useSeriesDuplicateValidation({
  form,
  seriesEntries,
  seriesById,
  duplicateMessage,
}: UseSeriesDuplicateValidationParams) {
  useEffect(() => {
    const seenSeries = new Set<string>();

    for (let index = 0; index < seriesEntries.length; index += 1) {
      const entry = seriesEntries[index];
      const seriesPath = `seriesEntries.${index}.seriesRef` as const;
      const seriesError = form.getFieldState(seriesPath).error;

      if (seriesError?.type === "duplicate") {
        form.clearErrors(seriesPath);
      }

      const key = normalizeEntityName(resolveRelationLabel(entry.seriesRef ?? "", seriesById));

      if (!key) {
        continue;
      }

      if (seenSeries.has(key)) {
        form.setError(seriesPath, {
          type: "duplicate",
          message: duplicateMessage,
        });
        continue;
      }

      seenSeries.add(key);
    }
  }, [duplicateMessage, form, seriesById, seriesEntries]);
}

interface UseBookTypeFieldErrorCleanupParams {
  form: UseFormReturn<EditBookFormValues>;
  type: EditBookFormValues["type"];
}

export function useBookTypeFieldErrorCleanup({ form, type }: UseBookTypeFieldErrorCleanupParams) {
  useEffect(() => {
    if (type === "AUDIOBOOK") {
      form.clearErrors("pageCount");
      return;
    }

    form.clearErrors("audioSeconds");
  }, [form, type]);
}

interface UseCreatableRelationItemsParams {
  options: RelationOption[];
  existingRefs: string[];
  query: string;
  selectedValues: string[];
  byId: Map<string, string>;
}

export function useCreatableRelationItems({
  options,
  existingRefs,
  query,
  selectedValues,
  byId,
}: UseCreatableRelationItemsParams) {
  const takenNames = useMemo(() => {
    const names = toLowercaseNameSet(options);

    for (const value of selectedValues) {
      const label = resolveRelationLabel(value, byId);

      if (label) {
        names.add(normalizeEntityName(label));
      }
    }

    return names;
  }, [byId, options, selectedValues]);

  return useMemo(() => buildCreatableItems(existingRefs, query, takenNames), [existingRefs, query, takenNames]);
}
