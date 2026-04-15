import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { authClient } from "@/lib/auth/auth-client";
import { AUTH } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { LucideSave } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";

import { Button } from "../../ui/button";
import { FieldGroup } from "../../ui/field";
import FormField from "../../ui/form-field";
import { LoadingSwap } from "../../ui/loading-swap";

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

function createSchema(t: ReturnType<typeof useTranslations>) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(AUTH.PASSWORD_MIN_LENGTH, t("minLength", { min: AUTH.PASSWORD_MIN_LENGTH }))
        .max(AUTH.PASSWORD_MAX_LENGTH, t("maxLength", { max: AUTH.PASSWORD_MAX_LENGTH })),
      newPassword: z
        .string()
        .min(AUTH.PASSWORD_MIN_LENGTH, t("minLength", { min: AUTH.PASSWORD_MIN_LENGTH }))
        .max(AUTH.PASSWORD_MAX_LENGTH, t("maxLength", { max: AUTH.PASSWORD_MAX_LENGTH })),
      confirmNewPassword: z
        .string()
        .min(AUTH.PASSWORD_MIN_LENGTH, t("minLength", { min: AUTH.PASSWORD_MIN_LENGTH }))
        .max(AUTH.PASSWORD_MAX_LENGTH, t("maxLength", { max: AUTH.PASSWORD_MAX_LENGTH })),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: t("passwordMismatch"),
      path: ["confirmNewPassword"],
    });
}

export default function ChangePassword() {
  const tValidation = useTranslations("common.validation");
  const tFields = useTranslations("common.fields");
  const tActions = useTranslations("common.actions");
  const tResults = useTranslations("common.results");
  const tErrors = useTranslations("errors");

  const schema = createSchema(tValidation);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  const { submit: submitChangePassword, isPending: isChangePasswordPending } = useSubmitMutation<void, FormValues>({
    submitAsync: async (values) => {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (error) {
        throw error;
      }
    },
    defaultErrorMessage: tErrors("unknown"),
    onSuccess: () => {
      toast.success(tResults("passwordChanged"));
      form.reset();
    },
    onError: (error) => {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : "UNKNOWN";

      const message = getAuthErrorMessage(code, tErrors);

      if (code === "INVALID_PASSWORD") {
        form.setError("currentPassword", { message });
      } else {
        toast.error(message);
      }

      return true;
    },
  });

  const isPending = isSubmitting || isChangePasswordPending;

  async function onSubmit(values: FormValues) {
    await submitChangePassword(values);
  }

  return (
    <form id="change-password-form" onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
      <FieldGroup>
        <FormField
          control={form.control}
          disabled={isPending}
          name="currentPassword"
          label={tFields("currentPassword")}
          placeholder={tFields("currentPasswordPlaceholder")}
          type="password"
          className="sm:max-w-xs"
        />
        <FormField
          control={form.control}
          disabled={isPending}
          name="newPassword"
          label={tFields("newPassword")}
          placeholder={tFields("newPasswordPlaceholder")}
          type="password"
          className="sm:max-w-xs"
        />
        <FormField
          control={form.control}
          disabled={isPending}
          name="confirmNewPassword"
          label={tFields("confirmNewPassword")}
          placeholder={tFields("confirmNewPasswordPlaceholder")}
          type="password"
          className="sm:max-w-xs"
        />

        <Button type="submit" className="w-full sm:w-fit" disabled={isPending}>
          <LoadingSwap isLoading={isPending}>
            <span className="flex items-center gap-1.5">
              <LucideSave /> {tActions("changePassword")}
            </span>
          </LoadingSwap>
        </Button>
      </FieldGroup>
    </form>
  );
}
