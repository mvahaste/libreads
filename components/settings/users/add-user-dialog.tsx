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
} from "@/components/ui/responsive-dialog";
import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { AUTH } from "@/lib/constants";
import { useTRPC } from "@/lib/trpc/client";
import { applyMappedFieldError } from "@/lib/utils/trpc-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";

import { FieldGroup } from "../../ui/field";
import FormField from "../../ui/form-field";
import { LoadingSwap } from "../../ui/loading-swap";

type AddUserFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function createAddUserSchema(t: ReturnType<typeof useTranslations>) {
  return z
    .object({
      name: z
        .string()
        .min(AUTH.NAME_MIN_LENGTH, t("minLength", { min: AUTH.NAME_MIN_LENGTH }))
        .max(AUTH.NAME_MAX_LENGTH, t("maxLength", { max: AUTH.NAME_MAX_LENGTH })),
      email: z.email(t("invalidEmail")),
      password: z
        .string()
        .min(AUTH.PASSWORD_MIN_LENGTH, t("minLength", { min: AUTH.PASSWORD_MIN_LENGTH }))
        .max(AUTH.PASSWORD_MAX_LENGTH, t("maxLength", { max: AUTH.PASSWORD_MAX_LENGTH })),
      confirmPassword: z
        .string()
        .min(AUTH.PASSWORD_MIN_LENGTH, t("minLength", { min: AUTH.PASSWORD_MIN_LENGTH }))
        .max(AUTH.PASSWORD_MAX_LENGTH, t("maxLength", { max: AUTH.PASSWORD_MAX_LENGTH })),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const tUsers = useTranslations("settings.users");
  const tFields = useTranslations("common.fields");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");
  const tErrors = useTranslations("errors");

  const schema = createAddUserSchema(tValidation);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createUser = useMutation(trpc.users.create.mutationOptions());

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting } = form.formState;
  const isPending = isSubmitting || createUser.isPending;

  const { submit: submitCreateUser } = useSubmitMutation({
    mutation: createUser,
    defaultErrorMessage: tErrors("unknown"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.users.list.queryKey() });
      toast.success(tUsers("addUserSuccess"));
      form.reset();
      onOpenChange(false);
    },
    onError: (error) =>
      applyMappedFieldError({
        error,
        map: {
          EMAIL_ALREADY_IN_USE: {
            field: "email",
            message: tErrors("auth.EMAIL_ALREADY_IN_USE"),
          },
        },
        setFieldError: (field, message) => form.setError(field, { message }),
      }),
  });

  async function onSubmit(values: AddUserFormValues) {
    await submitCreateUser({
      name: values.name,
      email: values.email,
      password: values.password,
    });
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isPending) return;
        if (!isOpen) form.reset();
        onOpenChange(isOpen);
      }}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{tUsers("addUserTitle")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{tUsers("addUserDescription")}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form id="add-user-form" onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
            <FieldGroup>
              <FormField
                control={form.control}
                disabled={isPending}
                name="name"
                label={tFields("name")}
                placeholder={tFields("namePlaceholder")}
              />
              <FormField
                control={form.control}
                disabled={isPending}
                name="email"
                label={tFields("email")}
                placeholder={tFields("emailPlaceholder")}
                type="email"
              />
              <FormField
                control={form.control}
                disabled={isPending}
                name="password"
                label={tFields("password")}
                placeholder={tFields("passwordPlaceholder")}
                type="password"
              />
              <FormField
                control={form.control}
                disabled={isPending}
                name="confirmPassword"
                label={tFields("confirmPassword")}
                placeholder={tFields("confirmPasswordPlaceholder")}
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
          <Button type="submit" form="add-user-form" disabled={isPending}>
            <LoadingSwap isLoading={isPending}>{tUsers("addUser")}</LoadingSwap>
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
