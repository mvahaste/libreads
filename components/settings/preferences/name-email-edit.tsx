"use client";

import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { authClient } from "@/lib/auth/auth-client";
import { AUTH } from "@/lib/constants";
import { useTRPC } from "@/lib/trpc/client";
import { applyMappedFieldError } from "@/lib/utils/trpc-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LucideSave } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";

import { Button } from "../../ui/button";
import { FieldGroup } from "../../ui/field";
import FormField from "../../ui/form-field";
import { LoadingSwap } from "../../ui/loading-swap";

interface NameEditProps {
  defaultName: string;
  defaultEmail: string;
}

function createSchema(t: ReturnType<typeof useTranslations>) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(AUTH.NAME_MIN_LENGTH, t("minLength", { min: AUTH.NAME_MIN_LENGTH }))
      .max(AUTH.NAME_MAX_LENGTH, t("maxLength", { max: AUTH.NAME_MAX_LENGTH })),
    email: z.email(t("invalidEmail")),
  });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

export default function NameEmailEdit({ defaultName, defaultEmail }: NameEditProps) {
  const router = useRouter();
  const { data: session, refetch } = authClient.useSession();

  const tFields = useTranslations("common.fields");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");
  const tSettings = useTranslations("settings.preferences");
  const tErrors = useTranslations("errors");

  const schema = createSchema(tValidation);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateUser = useMutation(trpc.users.update.mutationOptions());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
    },
  });

  const { isSubmitting, isDirty } = form.formState;
  const isPending = isSubmitting || updateUser.isPending;

  const { submit: submitUserUpdate } = useSubmitMutation({
    mutation: updateUser,
    defaultErrorMessage: tErrors("unknown"),
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

  async function onSubmit(values: FormValues) {
    if (!session) return;

    const dirty = form.formState.dirtyFields;
    const payload: Record<string, string> = {};
    if (dirty.name) payload.name = values.name;
    if (dirty.email) payload.email = values.email;

    if (Object.keys(payload).length === 0) {
      return;
    }

    const result = await submitUserUpdate({
      userId: session.user.id,
      data: payload,
    });

    if (!result) {
      return;
    }

    await queryClient.invalidateQueries({ queryKey: trpc.users.list.queryKey() });

    toast.success(tSettings("profileUpdateSuccess"));

    form.reset({ name: values.name, email: values.email });

    await refetch({ query: { disableCookieCache: true } });

    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
      <FieldGroup>
        <FormField
          control={form.control}
          disabled={isPending}
          name="email"
          label={tFields("email")}
          placeholder={defaultEmail}
          type="email"
          className="sm:max-w-xs"
        />
        <FormField
          control={form.control}
          disabled={isPending}
          name="name"
          label={tFields("name")}
          placeholder={defaultName}
          className="sm:max-w-xs"
        />

        <Button type="submit" className="w-full sm:w-fit" disabled={!isDirty || isPending}>
          <LoadingSwap isLoading={isPending}>
            <span className="flex items-center gap-1.5">
              <LucideSave className="size-4" />
              {tActions("saveChanges")}
            </span>
          </LoadingSwap>
        </Button>
      </FieldGroup>
    </form>
  );
}
