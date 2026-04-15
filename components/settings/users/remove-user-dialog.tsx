"use client";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { useTRPC } from "@/lib/trpc/client";
import type { RouterOutput } from "@/lib/trpc/routers/_app";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { LoadingSwap } from "../../ui/loading-swap";

type UserListItem = RouterOutput["users"]["list"][number];

interface RemoveUserDialogProps {
  user: UserListItem | null;
  onClose: () => void;
}

export function RemoveUserDialog({ user, onClose }: RemoveUserDialogProps) {
  const tUsers = useTranslations("settings.users");
  const tActions = useTranslations("common.actions");
  const tErrors = useTranslations("errors");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteUser = useMutation(trpc.users.delete.mutationOptions());

  const { submit: submitDeleteUser, isPending } = useSubmitMutation({
    mutation: deleteUser,
    defaultErrorMessage: tErrors("unknown"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.users.list.queryKey() });
      onClose();
      toast.success(tUsers("removeUserSuccess"));
    },
  });

  async function handleRemove() {
    if (!user) return;

    await submitDeleteUser({ userId: user.id });
  }

  return (
    <ResponsiveDialog
      open={!!user}
      onOpenChange={(isOpen) => {
        if (isPending) return;
        if (!isOpen) onClose();
      }}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{tUsers("removeUser")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {tUsers("removeUserConfirmation", { name: user?.name ?? "" })}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {tActions("cancel")}
            </Button>
          </ResponsiveDialogClose>
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleRemove}>
            <LoadingSwap isLoading={isPending}>{tUsers("removeUser")}</LoadingSwap>
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
