"use client";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { useTRPC } from "@/lib/trpc/client";
import {
  type ParsedRelationRef,
  type RelationRefPrefixes,
  encodeCreateRelationRef,
  encodeExistingRelationRef,
  normalizeEntityName,
  parseRelationRef,
} from "@/lib/utils/browse/books/relation-ref-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface BookTagsComboboxProps {
  bookId: string;
  initialTags: {
    id: string;
    name: string;
  }[];
}

const EXISTING_TAG_REF_PREFIX = "existing:";
const CREATE_TAG_REF_PREFIX = "create:";

const TAG_REF_PREFIXES: RelationRefPrefixes = {
  existing: EXISTING_TAG_REF_PREFIX,
  create: CREATE_TAG_REF_PREFIX,
};

type ParsedTagRef = ParsedRelationRef;

function parseTagRef(value: string | null | undefined): ParsedTagRef {
  return parseRelationRef(value, TAG_REF_PREFIXES);
}

function resolveTagLabel(value: string, tagsById: Map<string, { id: string; name: string }>): string {
  const parsed = parseTagRef(value);

  if (!parsed) {
    return "";
  }

  if (parsed.mode === "create") {
    return parsed.name;
  }

  return tagsById.get(parsed.id)?.name ?? "";
}

function buildCreatableTagItems(existingRefs: string[], query: string, takenNames: Set<string>) {
  const normalizedQuery = normalizeEntityName(query);
  const canCreate = normalizedQuery.length > 0 && !takenNames.has(normalizedQuery);
  const createValue = canCreate ? encodeCreateRelationRef(query, TAG_REF_PREFIXES) : null;

  return {
    items: createValue ? [createValue, ...existingRefs] : existingRefs,
    createValue,
  };
}

function normalizeTagRefKey(values: string[]) {
  const normalizedValues = new Set<string>();

  for (const value of values) {
    const parsed = parseTagRef(value);

    if (!parsed) {
      continue;
    }

    if (parsed.mode === "existing") {
      normalizedValues.add(encodeExistingRelationRef(parsed.id, TAG_REF_PREFIXES));
      continue;
    }

    const normalizedName = normalizeEntityName(parsed.name);

    if (normalizedName) {
      normalizedValues.add(encodeCreateRelationRef(normalizedName, TAG_REF_PREFIXES));
    }
  }

  return [...normalizedValues].sort().join(",");
}

function dedupeTagRefValues(values: string[], resolveLabel: (value: string) => string): string[] {
  const dedupedByName = new Map<string, string>();

  for (const value of values) {
    const parsed = parseTagRef(value);

    if (!parsed) {
      continue;
    }

    const label = resolveLabel(value);
    const normalizedLabel = normalizeEntityName(label);

    if (!normalizedLabel) {
      continue;
    }

    const existing = dedupedByName.get(normalizedLabel);

    if (!existing) {
      dedupedByName.set(normalizedLabel, value);
      continue;
    }

    const existingParsed = parseTagRef(existing);

    if (existingParsed?.mode === "create" && parsed.mode === "existing") {
      dedupedByName.set(normalizedLabel, value);
    }
  }

  return [...dedupedByName.values()];
}

export default function BookTagsCombobox({ bookId, initialTags }: BookTagsComboboxProps) {
  const t = useTranslations("browse.tags");
  const tDetail = useTranslations("browse.detail");
  const trpc = useTRPC();
  const { invalidateTagsState } = useBooksQueryInvalidation();
  const router = useRouter();
  const anchor = useComboboxAnchor();
  const [tagQuery, setTagQuery] = useState("");

  const initialTagRefs = useMemo(
    () => initialTags.map((tag) => encodeExistingRelationRef(tag.id, TAG_REF_PREFIXES)),
    [initialTags],
  );
  const [selectedTagRefs, setSelectedTagRefs] = useState<string[]>(initialTagRefs);

  useEffect(() => {
    setSelectedTagRefs(initialTagRefs);
  }, [initialTagRefs]);

  const {
    data: tags = [],
    isLoading: isTagsLoading,
    isFetching: isTagsFetching,
  } = useQuery(trpc.books.myTags.queryOptions());

  const allTags = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();

    for (const tag of tags) {
      byId.set(tag.id, tag);
    }

    for (const tag of initialTags) {
      if (!byId.has(tag.id)) {
        byId.set(tag.id, tag);
      }
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [initialTags, tags]);

  const tagsById = useMemo(() => {
    return new Map(allTags.map((tag) => [tag.id, tag]));
  }, [allTags]);

  const existingTagRefs = useMemo(
    () => allTags.map((tag) => encodeExistingRelationRef(tag.id, TAG_REF_PREFIXES)),
    [allTags],
  );

  const takenTagNames = useMemo(() => {
    const names = new Set(allTags.map((tag) => normalizeEntityName(tag.name)));

    for (const value of selectedTagRefs) {
      const parsed = parseTagRef(value);

      if (parsed?.mode !== "create") {
        continue;
      }

      names.add(normalizeEntityName(parsed.name));
    }

    return names;
  }, [allTags, selectedTagRefs]);

  const { items: tagItemRefs, createValue: createTagRef } = useMemo(
    () => buildCreatableTagItems(existingTagRefs, tagQuery, takenTagNames),
    [existingTagRefs, tagQuery, takenTagNames],
  );

  const initialKey = useMemo(() => normalizeTagRefKey(initialTagRefs), [initialTagRefs]);
  const [lastSavedKey, setLastSavedKey] = useState(initialKey);
  const [failedSaveKey, setFailedSaveKey] = useState<string | null>(null);

  useEffect(() => {
    setLastSavedKey(initialKey);
    setFailedSaveKey(null);
  }, [initialKey]);

  const selectedKey = useMemo(() => normalizeTagRefKey(selectedTagRefs), [selectedTagRefs]);
  const isDirty = lastSavedKey !== selectedKey;

  const invalidateTags = useCallback(async () => {
    await invalidateTagsState();
  }, [invalidateTagsState]);

  const setBookTags = useMutation(trpc.books.setBookTags.mutationOptions());

  const { submit: submitBookTags, isPending: isSavingTags } = useSubmitMutation({
    mutation: setBookTags,
    defaultErrorMessage: t("save-selection-error"),
    errorMessageByCode: {
      BOOK_NOT_IN_LIBRARY: t("book-not-in-library"),
    },
    onSuccess: async () => {
      await invalidateTags();
      router.refresh();
      toast.success(t("save-selection-success"));
    },
  });

  const isDisabled = isTagsLoading || isTagsFetching || isSavingTags;

  useEffect(() => {
    if (!isDirty || isSavingTags) {
      return;
    }

    const saveKey = normalizeTagRefKey(selectedTagRefs);

    if (failedSaveKey === saveKey) {
      return;
    }

    const tags = selectedTagRefs
      .map((value) => parseTagRef(value))
      .filter((value): value is Exclude<ParsedTagRef, null> => Boolean(value))
      .map((value) =>
        value.mode === "existing"
          ? ({ mode: "existing", id: value.id } as const)
          : ({ mode: "create", name: value.name } as const),
      );

    const timeoutId = window.setTimeout(() => {
      void submitBookTags({
        bookId,
        tags,
      }).then((result) => {
        if (result) {
          setFailedSaveKey(null);
          setLastSavedKey(saveKey);
        } else {
          setFailedSaveKey(saveKey);
        }
      });
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bookId, failedSaveKey, isDirty, isSavingTags, selectedTagRefs, submitBookTags]);

  return (
    <div className="flex w-full flex-wrap items-start gap-2 sm:w-auto">
      <Combobox
        multiple
        autoHighlight
        items={tagItemRefs}
        itemToStringLabel={(value) => resolveTagLabel(value, tagsById)}
        itemToStringValue={(value) => resolveTagLabel(value, tagsById)}
        value={selectedTagRefs}
        onValueChange={(values) => {
          const dedupedValues = dedupeTagRefValues(values as string[], (value) => resolveTagLabel(value, tagsById));

          setFailedSaveKey(null);
          setSelectedTagRefs(dedupedValues);
          setTagQuery("");
        }}
        disabled={isDisabled}
      >
        <ComboboxChips ref={anchor} className="w-full sm:w-80">
          <ComboboxValue>
            {(values) => (
              <Fragment>
                {values.map((value: string) => {
                  const label = resolveTagLabel(value, tagsById);

                  if (!label) {
                    return null;
                  }

                  return <ComboboxChip key={value}>{label}</ComboboxChip>;
                })}
                <ComboboxChipsInput
                  placeholder={tDetail("tags")}
                  disabled={isDisabled}
                  onChange={(event) => setTagQuery(event.target.value)}
                />
              </Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{t("none")}</ComboboxEmpty>
          <ComboboxList>
            {(value) => {
              const parsed = parseTagRef(value);

              if (!parsed) {
                return null;
              }

              const label =
                value === createTagRef && parsed.mode === "create"
                  ? t("create-option", { value: parsed.name })
                  : resolveTagLabel(value, tagsById);

              if (!label) {
                return null;
              }

              return (
                <ComboboxItem key={value} value={value}>
                  {label}
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
