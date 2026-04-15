"use client";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type EditBookFormValues,
  type RelationOption,
  buildCreatableItems,
  currentValuePlaceholder,
  dedupeRelationRefValues,
  normalizeEntityName,
  parseRelationRef,
  resolveRelationLabel,
  toLowercaseNameSet,
} from "@/lib/utils/browse/books/book-form-utils";
import { LucideX } from "lucide-react";
import { type Control, Controller } from "react-hook-form";

type DetailTranslator = ReturnType<typeof import("next-intl").useTranslations>;

interface RelationItemListProps {
  createValue: string | null;
  byId: Map<string, string>;
  noneLabel: string;
  createOptionLabel: (name: string) => string;
}

function RelationItemList({ createValue, byId, noneLabel, createOptionLabel }: RelationItemListProps) {
  return (
    <>
      <ComboboxEmpty>{noneLabel}</ComboboxEmpty>
      <ComboboxList className="pointer-events-auto">
        {(value) => {
          const parsed = parseRelationRef(value);

          if (!parsed) {
            return null;
          }

          const label =
            value === createValue && parsed.mode === "create"
              ? createOptionLabel(parsed.name)
              : resolveRelationLabel(value, byId);

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
    </>
  );
}

interface RelationSingleSelectFieldProps {
  control: Control<EditBookFormValues>;
  name: "publisherRef";
  label: string;
  placeholder: string;
  items: string[];
  createValue: string | null;
  byId: Map<string, string>;
  disabled: boolean;
  onSearchChange: (query: string) => void;
  onSelectionCommitted: () => void;
  t: DetailTranslator;
}

export function RelationSingleSelectField({
  control,
  name,
  label,
  placeholder,
  items,
  createValue,
  byId,
  disabled,
  onSearchChange,
  onSelectionCommitted,
  t,
}: RelationSingleSelectFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <Combobox
            autoHighlight
            items={items}
            itemToStringLabel={(value) => resolveRelationLabel(value, byId)}
            itemToStringValue={(value) => resolveRelationLabel(value, byId)}
            value={field.value || null}
            onValueChange={(value) => {
              field.onChange(value ?? "");
              onSelectionCommitted();
            }}
            disabled={disabled}
          >
            <ComboboxInput
              placeholder={placeholder}
              disabled={disabled}
              showClear={Boolean(field.value)}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <ComboboxContent>
              <RelationItemList
                createValue={createValue}
                byId={byId}
                noneLabel={t("none")}
                createOptionLabel={(value) => t("create-option", { value })}
              />
            </ComboboxContent>
          </Combobox>
        </Field>
      )}
    />
  );
}

interface RelationMultiSelectFieldProps {
  control: Control<EditBookFormValues>;
  name: "authorRefs" | "genreRefs";
  label: string;
  placeholder: string;
  items: string[];
  createValue: string | null;
  byId: Map<string, string>;
  disabled: boolean;
  onSearchChange: (query: string) => void;
  onSelectionCommitted: () => void;
  t: DetailTranslator;
}

export function RelationMultiSelectField({
  control,
  name,
  label,
  placeholder,
  items,
  createValue,
  byId,
  disabled,
  onSearchChange,
  onSelectionCommitted,
  t,
}: RelationMultiSelectFieldProps) {
  const anchor = useComboboxAnchor();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <Combobox
            multiple
            autoHighlight
            items={items}
            itemToStringLabel={(value) => resolveRelationLabel(value, byId)}
            itemToStringValue={(value) => resolveRelationLabel(value, byId)}
            value={field.value}
            onValueChange={(value) => {
              const next = dedupeRelationRefValues(value as string[], (item) => resolveRelationLabel(item, byId));
              field.onChange(next);
              onSelectionCommitted();
            }}
            disabled={disabled}
          >
            <ComboboxChips ref={anchor}>
              <ComboboxValue>
                {(values) => (
                  <>
                    {(values as string[]).map((value) => {
                      const resolvedLabel = resolveRelationLabel(value, byId);

                      if (!resolvedLabel) {
                        return null;
                      }

                      return <ComboboxChip key={value}>{resolvedLabel}</ComboboxChip>;
                    })}
                    <ComboboxChipsInput
                      placeholder={placeholder}
                      disabled={disabled}
                      onChange={(event) => onSearchChange(event.target.value)}
                    />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
              <RelationItemList
                createValue={createValue}
                byId={byId}
                noneLabel={t("none")}
                createOptionLabel={(value) => t("create-option", { value })}
              />
            </ComboboxContent>
          </Combobox>
        </Field>
      )}
    />
  );
}

interface SeriesEntryLabels {
  seriesExisting: string;
  seriesExistingPlaceholder: string;
  seriesPosition: string;
  seriesPositionPlaceholder: string;
  removeSeriesEntry: string;
}

interface SeriesEntryRowProps {
  control: Control<EditBookFormValues>;
  index: number;
  fieldId: string;
  query: string;
  seriesOptions: RelationOption[];
  seriesExistingRefs: string[];
  seriesById: Map<string, string>;
  isBusy: boolean;
  isFormOptionsLoading: boolean;
  onQueryChange: (fieldId: string, query: string) => void;
  onRemove: () => void;
  editBookSeriesName?: string;
  editBookSeriesPosition?: number | null;
  labels: SeriesEntryLabels;
  t: DetailTranslator;
}

export function SeriesEntryRow({
  control,
  index,
  fieldId,
  query,
  seriesOptions,
  seriesExistingRefs,
  seriesById,
  isBusy,
  isFormOptionsLoading,
  onQueryChange,
  onRemove,
  editBookSeriesName,
  editBookSeriesPosition,
  labels,
  t,
}: SeriesEntryRowProps) {
  return (
    <div className="rounded-lg border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`seriesEntries.${index}.seriesRef` as const}
          control={control}
          render={({ field, fieldState }) => {
            const takenNames = toLowercaseNameSet(seriesOptions);
            const parsedCurrent = parseRelationRef(field.value);

            if (parsedCurrent?.mode === "create") {
              takenNames.add(normalizeEntityName(parsedCurrent.name));
            }

            const { items, createValue } = buildCreatableItems(seriesExistingRefs, query, takenNames);

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{labels.seriesExisting}</FieldLabel>
                <Combobox
                  autoHighlight
                  items={items}
                  itemToStringLabel={(value) => resolveRelationLabel(value, seriesById)}
                  itemToStringValue={(value) => resolveRelationLabel(value, seriesById)}
                  value={field.value || null}
                  onValueChange={(value) => {
                    field.onChange(value ?? "");
                    onQueryChange(fieldId, "");
                  }}
                  disabled={isBusy || isFormOptionsLoading}
                >
                  <ComboboxInput
                    placeholder={currentValuePlaceholder(editBookSeriesName, labels.seriesExistingPlaceholder)}
                    showClear={Boolean(field.value)}
                    disabled={isBusy || isFormOptionsLoading}
                    onChange={(event) => onQueryChange(fieldId, event.target.value)}
                  />
                  <ComboboxContent>
                    <RelationItemList
                      createValue={createValue}
                      byId={seriesById}
                      noneLabel={t("none")}
                      createOptionLabel={(value) => t("create-option", { value })}
                    />
                  </ComboboxContent>
                </Combobox>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />

        <Controller
          name={`seriesEntries.${index}.position` as const}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{labels.seriesPosition}</FieldLabel>
              <Input
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isBusy}
                placeholder={currentValuePlaceholder(editBookSeriesPosition, labels.seriesPositionPlaceholder)}
                inputMode="decimal"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={onRemove}>
          <LucideX />
          {labels.removeSeriesEntry}
        </Button>
      </div>
    </div>
  );
}
