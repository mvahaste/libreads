"use client";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { authClient } from "@/lib/auth/auth-client";
import { AUTH } from "@/lib/constants";
import { useTRPC } from "@/lib/trpc/client";
import { applyMappedFieldError } from "@/lib/utils/trpc-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LucideAlertTriangle, LucideTrash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v4";

import { FieldGroup } from "../../ui/field";
import FormField from "../../ui/form-field";
import { LoadingSwap } from "../../ui/loading-swap";

type FormValues = {
  password: string;
};

function createSchema(t: ReturnType<typeof useTranslations>) {
  return z.object({
    password: z
      .string()
      .min(AUTH.PASSWORD_MIN_LENGTH, t("minLength", { min: AUTH.PASSWORD_MIN_LENGTH }))
      .max(AUTH.PASSWORD_MAX_LENGTH, t("maxLength", { max: AUTH.PASSWORD_MAX_LENGTH })),
  });
}

export function DangerSection() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const t = useTranslations("settings.danger");
  const tFields = useTranslations("common.fields");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");

  const isMobile = useIsMobile();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const schema = createSchema(tValidation);

  const trpc = useTRPC();
  const deleteUser = useMutation(trpc.users.delete.mutationOptions());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
    },
  });

  const { isSubmitting } = form.formState;
  const { submit: submitDeleteUser, isPending: isDeletePending } = useSubmitMutation({
    mutation: deleteUser,
    defaultErrorMessage: tErrors("unknown"),
    onSuccess: async () => {
      router.replace("/auth/sign-in");
      router.refresh();
    },
    onError: (error) =>
      applyMappedFieldError({
        error,
        map: {
          INVALID_PASSWORD: {
            field: "password",
            message: tErrors("auth.INVALID_PASSWORD"),
          },
          UNAUTHORIZED: {
            field: "password",
            message: tErrors("auth.INVALID_PASSWORD"),
          },
        },
        setFieldError: (field, message) =>
          form.setError(field, {
            message,
          }),
      }),
  });
  const isPending = isSubmitting || isDeletePending;

  async function onSubmit(values: FormValues) {
    if (!session) return;

    await submitDeleteUser({
      userId: session.user.id,
      password: values.password,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="bg-destructive/10 flex size-10 shrink-0 items-center justify-center rounded-md">
                <LucideAlertTriangle className="text-destructive size-5" />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">{t("deleteAccountAndData")}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {t("deleteAccountAndDataDescription")}
                </p>
              </div>
            </div>
            <ResponsiveDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                if (isPending) return;
                if (!open) form.reset();
                setDeleteDialogOpen(open);
              }}
            >
              <ResponsiveDialogTrigger asChild>
                <Button variant="destructive" className="shrink-0 sm:self-center">
                  <LucideTrash2 className="size-4" />
                  {t("deleteAccount")}
                </Button>
              </ResponsiveDialogTrigger>
              <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>{t("deleteAccountConfirmation")}</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>{t("deleteAccountConfirmationDescription")}</ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <ResponsiveDialogBody mobilePadded={isMobile}>
                  <form id="delete-account-form" onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
                    <FieldGroup>
                      <FormField
                        control={form.control}
                        disabled={isPending}
                        name="password"
                        label={tFields("currentPassword")}
                        placeholder={tFields("currentPasswordPlaceholder")}
                        type="password"
                      />
                    </FieldGroup>
                  </form>
                </ResponsiveDialogBody>
                <ResponsiveDialogFooter>
                  <ResponsiveDialogClose asChild>
                    <Button variant="outline" type="button" disabled={isPending}>
                      {tActions("cancel")}
                    </Button>
                  </ResponsiveDialogClose>
                  <Button type="submit" form="delete-account-form" variant="destructive" disabled={isPending}>
                    <LoadingSwap isLoading={isPending}>{t("deleteAccount")}</LoadingSwap>
                  </Button>
                </ResponsiveDialogFooter>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
