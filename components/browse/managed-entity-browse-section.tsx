"use client";

import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { authClient } from "@/lib/auth/auth-client";
import { type SortOption } from "@/lib/browse-params";
import { useTRPC } from "@/lib/trpc/client";
import { applyMappedFieldError } from "@/lib/utils/trpc-errors";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { LoadingSwap } from "../ui/loading-swap";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "../ui/responsive-dialog";
import { EntityBrowseSection } from "./entity-browse-section";

export type ManagedEntitySectionKey = "authors" | "series" | "genres" | "publishers";
export type ManagedEntityDuplicateErrorCode =
  | "AUTHOR_ALREADY_EXISTS"
  | "SERIES_ALREADY_EXISTS"
  | "GENRE_ALREADY_EXISTS"
  | "PUBLISHER_ALREADY_EXISTS";

type ManagedEntityMutationInput = Record<string, unknown>;

interface ManagedEntityBrowseItem {
  id: string;
  name: string;
  slug: string;
}

interface ManagedEntityBrowseSectionProps<TItem extends ManagedEntityBrowseItem> {
  sectionKey: ManagedEntitySectionKey;
  sortOptions: SortOption[];
  /** Returns tRPC queryOptions for the entity list endpoint */
  getQueryOptions: (
    trpc: ReturnType<typeof useTRPC>,
    params: { page: number; search: string; sort: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;
  mapItemHref: (item: TItem) => string;
  /** Returns tRPC mutationOptions for the entity update endpoint */
  getUpdateMutationOptions: (
    trpc: ReturnType<typeof useTRPC>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;
  /** Returns tRPC mutationOptions for the entity delete endpoint */
  getDeleteMutationOptions: (
    trpc: ReturnType<typeof useTRPC>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;
  getUpdateInput: (itemId: string, name: string) => ManagedEntityMutationInput;
  getDeleteInput: (itemId: string) => ManagedEntityMutationInput;
  duplicateErrorCode: ManagedEntityDuplicateErrorCode;
}

export function ManagedEntityBrowseSection<TItem extends ManagedEntityBrowseItem>({
  sectionKey,
  sortOptions,
  getQueryOptions,
  mapItemHref,
  getUpdateMutationOptions,
  getDeleteMutationOptions,
  getUpdateInput,
  getDeleteInput,
  duplicateErrorCode,
}: ManagedEntityBrowseSectionProps<TItem>) {
  const { data: session } = authClient.useSession();
  const tActions = useTranslations("common.actions");
  const tEntities = useTranslations("common.entities");
  const tEntityActions = useTranslations("browse.entity-actions");
  const tEntityManagement = useTranslations("browse.entity-management");
  const trpc = useTRPC();
  const { invalidateFormAndBrowse } = useBooksQueryInvalidation();

  const [editOpen, setEditOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<{ id: string; name: string } | null>(null);
  const [entityName, setEntityName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<{ id: string; name: string } | null>(null);

  const updateMutation = useMutation<unknown, Error, ManagedEntityMutationInput>(getUpdateMutationOptions(trpc));
  const deleteMutation = useMutation<unknown, Error, ManagedEntityMutationInput>(getDeleteMutationOptions(trpc));

  const { submit: submitUpdateEntity, isPending: editPending } = useSubmitMutation<unknown, ManagedEntityMutationInput>(
    {
      mutation: updateMutation,
      defaultErrorMessage: tEntityManagement("save-failed"),
      onSuccess: async () => {
        await invalidateFormAndBrowse();
        toast.success(tEntityManagement("update-success"));
        setEditOpen(false);
        setEditError(null);
        setEditingEntity(null);
        setEntityName("");
      },
      onError: (error) => {
        const isMapped = applyMappedFieldError({
          error,
          map: {
            [duplicateErrorCode]: {
              field: "name",
              message: tEntityManagement("duplicate"),
            },
          },
          setFieldError: (_field, message) => setEditError(message),
        });

        if (!isMapped) {
          setEditError(null);
        }

        return isMapped;
      },
    },
  );

  const { submit: submitDeleteEntity, isPending: deletePending } = useSubmitMutation<
    unknown,
    ManagedEntityMutationInput
  >({
    mutation: deleteMutation,
    defaultErrorMessage: tEntityManagement("delete-failed"),
    onSuccess: async () => {
      await invalidateFormAndBrowse();
      toast.success(tEntityManagement("delete-success"));
      setDeletingEntity(null);
    },
  });

  function openEditDialog(entity: { id: string; name: string }) {
    setEditingEntity({ id: entity.id, name: entity.name });
    setEntityName(entity.name);
    setEditError(null);
    setEditOpen(true);
  }

  async function handleSubmitUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = entityName.trim();
    if (!editingEntity || !trimmedName) {
      return;
    }

    await submitUpdateEntity(getUpdateInput(editingEntity.id, trimmedName));
  }

  async function handleDelete() {
    if (!deletingEntity) {
      return;
    }

    await submitDeleteEntity(getDeleteInput(deletingEntity.id));
  }

  const isAdmin = Boolean(session?.user.isAdmin);

  return (
    <>
      <EntityBrowseSection<TItem>
        sectionKey={sectionKey}
        sortOptions={sortOptions}
        getQueryOptions={getQueryOptions}
        mapItem={(item) => ({
          id: item.id,
          name: item.name,
          href: mapItemHref(item),
          actions: isAdmin
            ? {
                manageLabel: tEntityActions("manage", { entity: tEntities(sectionKey) }),
                edit: {
                  label: tActions("edit"),
                  onSelect: () => openEditDialog(item),
                },
                delete: {
                  label: tActions("delete"),
                  onSelect: () => setDeletingEntity({ id: item.id, name: item.name }),
                },
              }
            : undefined,
        })}
      />

      <ResponsiveDialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          if (editPending) {
            return;
          }

          if (!nextOpen) {
            setEditingEntity(null);
            setEntityName("");
            setEditError(null);
          }

          setEditOpen(nextOpen);
        }}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{tActions("edit")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{tEntityManagement("edit-description")}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form id={`${sectionKey}-edit-form`} onSubmit={handleSubmitUpdate} aria-busy={editPending}>
            <ResponsiveDialogBody className="space-y-4">
              <Field data-invalid={Boolean(editError)}>
                <FieldLabel htmlFor={`${sectionKey}-edit-name`}>{tEntityManagement("name")}</FieldLabel>
                <Input
                  id={`${sectionKey}-edit-name`}
                  value={entityName}
                  onChange={(e) => {
                    setEntityName(e.target.value);

                    if (editError) {
                      setEditError(null);
                    }
                  }}
                  placeholder={tEntityManagement("name-placeholder")}
                  maxLength={160}
                  disabled={editPending}
                />
                {editError ? <FieldError errors={[{ message: editError }]} /> : null}
              </Field>
            </ResponsiveDialogBody>
          </form>

          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button variant="outline" disabled={editPending}>
                {tActions("cancel")}
              </Button>
            </ResponsiveDialogClose>
            <Button type="submit" form={`${sectionKey}-edit-form`} disabled={editPending || !entityName.trim()}>
              <LoadingSwap isLoading={editPending}>{tActions("save")}</LoadingSwap>
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(deletingEntity)}
        onOpenChange={(nextOpen) => {
          if (deletePending) {
            return;
          }

          if (!nextOpen) {
            setDeletingEntity(null);
          }
        }}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{tActions("delete")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {deletingEntity ? tEntityManagement("delete-confirmation", { name: deletingEntity.name }) : ""}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button variant="outline" disabled={deletePending}>
                {tActions("cancel")}
              </Button>
            </ResponsiveDialogClose>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deletePending}>
              <LoadingSwap isLoading={deletePending}>{tActions("delete")}</LoadingSwap>
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
