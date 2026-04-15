"use client";

import { BrowseList } from "@/components/browse/browse-list";
import { BrowseSectionHeader } from "@/components/browse/browse-section-header";
import { BrowseToolbar } from "@/components/browse/browse-toolbar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
} from "@/components/ui/responsive-dialog";
import { useBooksQueryInvalidation } from "@/hooks/use-books-query-invalidation";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { commonSearchParams, tagSortOptions } from "@/lib/browse-params";
import { useTRPC } from "@/lib/trpc/client";
import { applyMappedFieldError } from "@/lib/utils/trpc-errors";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LucideEllipsisVertical, LucidePencilLine, LucideTrash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

interface TagItem {
  id: string;
  name: string;
}

export default function TagsPage() {
  const t = useTranslations("browse");
  const tEntities = useTranslations("common.entities");
  const tTags = useTranslations("browse.tags");
  const tActions = useTranslations("common.actions");
  const trpc = useTRPC();
  const { invalidateTagsState } = useBooksQueryInvalidation();

  const [params, setParams] = useQueryStates(commonSearchParams, { shallow: false });
  const [editOpen, setEditOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagName, setTagName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingTag, setDeletingTag] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery(
    trpc.books.allTags.queryOptions({
      page: params.page,
      search: params.q,
      sort: params.sort,
    }),
  );

  const tags = (data?.items ?? []) as TagItem[];

  const isEmpty = !isLoading && tags.length === 0;

  const updateTag = useMutation(trpc.books.updateTag.mutationOptions());
  const deleteTag = useMutation(trpc.books.deleteTag.mutationOptions());

  const { submit: submitUpdateTag, isPending: editPending } = useSubmitMutation({
    mutation: updateTag,
    defaultErrorMessage: tTags("save-failed"),
    onSuccess: async () => {
      await invalidateTagsState();
      toast.success(tTags("update-success"));
      setEditOpen(false);
      setEditError(null);
      setEditingTagId(null);
    },
    onError: (error) => {
      const isMapped = applyMappedFieldError({
        error,
        map: {
          TAG_ALREADY_EXISTS: {
            field: "name",
            message: tTags("duplicate"),
          },
        },
        setFieldError: (_field, message) => setEditError(message),
      });

      if (!isMapped) {
        setEditError(null);
      }

      return isMapped;
    },
  });

  const { submit: submitDeleteTag, isPending: isDeletePending } = useSubmitMutation({
    mutation: deleteTag,
    defaultErrorMessage: tTags("delete-failed"),
    onSuccess: async () => {
      await invalidateTagsState();
      toast.success(tTags("delete-success"));
      setDeletingTag(null);
    },
  });

  function openEditDialog(tag: TagItem) {
    setEditingTagId(tag.id);
    setTagName(tag.name);
    setEditError(null);
    setEditOpen(true);
  }

  async function handleSubmitTag(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = tagName.trim();
    if (!trimmedName) return;

    if (!editingTagId) return;

    await submitUpdateTag({
      tagId: editingTagId,
      name: trimmedName,
    });
  }

  async function handleDelete() {
    if (!deletingTag) return;

    await submitDeleteTag({ tagId: deletingTag.id });
  }

  return (
    <div>
      <BrowseSectionHeader title={tEntities("tags")} description={t("tags.description")} />

      <BrowseToolbar
        search={params.q}
        onSearchChange={(q) => setParams({ q, page: 1 })}
        searchPlaceholder={t("search.placeholder-tags")}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort })}
        sortOptions={tagSortOptions}
        total={data?.total}
        page={params.page}
        onPageChange={(page) => setParams({ page })}
      />

      <BrowseList variant="entity" isLoading={isLoading} isEmpty={isEmpty}>
        {tags.map((tag) => {
          return (
            <div
              key={tag.id}
              className="border-border bg-card animate-in fade-in flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <Link
                href={`/browse/my-books?tag=${encodeURIComponent(tag.name)}`}
                className="group flex min-w-0 flex-1 items-center gap-2"
              >
                <p className="text-foreground min-w-0 truncate text-sm font-medium transition-opacity group-hover:opacity-75">
                  {tag.name}
                </p>
              </Link>

              <div className="flex shrink-0 items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-xs" aria-label={tTags("manage")}>
                      <LucideEllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-auto min-w-28">
                    <DropdownMenuItem onSelect={() => openEditDialog(tag)}>
                      <LucidePencilLine />
                      {tTags("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeletingTag({ id: tag.id, name: tag.name })}
                    >
                      <LucideTrash2 />
                      {tTags("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </BrowseList>

      <ResponsiveDialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          if (editPending) return;

          if (!nextOpen) {
            setEditingTagId(null);
            setTagName("");
            setEditError(null);
          }

          setEditOpen(nextOpen);
        }}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{tTags("edit")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{tTags("dialog-description")}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <form id="edit-tag-form" onSubmit={handleSubmitTag} aria-busy={editPending}>
            <ResponsiveDialogBody className="space-y-4">
              <Field data-invalid={Boolean(editError)}>
                <FieldLabel htmlFor="edit-tag-name">{tTags("name")}</FieldLabel>
                <Input
                  id="edit-tag-name"
                  value={tagName}
                  onChange={(e) => {
                    setTagName(e.target.value);
                    if (editError) {
                      setEditError(null);
                    }
                  }}
                  placeholder={tTags("name-placeholder")}
                  maxLength={64}
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
            <Button type="submit" form="edit-tag-form" disabled={editPending || !tagName.trim()}>
              <LoadingSwap isLoading={editPending}>{tActions("save")}</LoadingSwap>
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={!!deletingTag}
        onOpenChange={(nextOpen) => {
          if (isDeletePending) return;
          if (!nextOpen) setDeletingTag(null);
        }}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{tTags("delete")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {deletingTag ? tTags("delete-confirmation", { name: deletingTag.name }) : ""}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button variant="outline" disabled={isDeletePending}>
                {tActions("cancel")}
              </Button>
            </ResponsiveDialogClose>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeletePending}>
              <LoadingSwap isLoading={isDeletePending}>{tTags("delete")}</LoadingSwap>
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
