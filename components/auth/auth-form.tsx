"use client";

import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { authClient } from "@/lib/auth/auth-client";
import { AUTH } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";

import { Button } from "../ui/button";
import { FieldGroup } from "../ui/field";
import FormField from "../ui/form-field";
import { LoadingSwap } from "../ui/loading-swap";

type AuthMode = "signUp" | "signIn";

type FormValues = {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
};

function createSchema(mode: AuthMode, t: ReturnType<typeof useTranslations>) {
  const email = z.email(t("invalidEmail"));

  const password = z
    .string()
    .min(AUTH.PASSWORD_MIN_LENGTH, t("minLength", { min: AUTH.PASSWORD_MIN_LENGTH }))
    .max(AUTH.PASSWORD_MAX_LENGTH, t("maxLength", { max: AUTH.PASSWORD_MAX_LENGTH }));

  if (mode === "signIn") {
    return z.object({
      email,
      password,
    });
  }

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(AUTH.NAME_MIN_LENGTH, t("minLength", { min: AUTH.NAME_MIN_LENGTH }))
        .max(AUTH.NAME_MAX_LENGTH, t("maxLength", { max: AUTH.NAME_MAX_LENGTH })),
      email,
      password,
      confirmPassword: password,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

interface AuthFormProps {
  mode: AuthMode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === "signUp";
  const router = useRouter();

  const tCommon = useTranslations("common");
  const tValidation = useTranslations("common.validation");
  const tErrors = useTranslations("errors");

  const schema = createSchema(mode, tValidation);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  const { submit: submitAuth, isPending: isAuthPending } = useSubmitMutation<void, FormValues>({
    submitAsync: async (values) => {
      if (mode === "signUp") {
        const { error } = await authClient.signUp.email({
          name: values.name!,
          email: values.email,
          password: values.password,
        });

        if (error) {
          throw error;
        }
      } else {
        const { error } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });

        if (error) {
          throw error;
        }
      }
    },
    defaultErrorMessage: tErrors("unknown"),
    onSuccess: () => {
      router.push("/");
    },
    onError: (error) => {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : "UNKNOWN";

      toast.error(getAuthErrorMessage(code, tErrors));
      return true;
    },
  });

  const isPending = isSubmitting || isAuthPending;

  async function onSubmit(values: FormValues) {
    await submitAuth(values);
  }

  const formId = `${mode}-form`;

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
      <FieldGroup>
        {isSignUp && (
          <FormField
            control={form.control}
            disabled={isPending}
            name="name"
            label={tCommon("fields.name")}
            placeholder={tCommon("fields.namePlaceholder")}
          />
        )}

        <FormField
          control={form.control}
          disabled={isPending}
          name="email"
          label={tCommon("fields.email")}
          placeholder={tCommon("fields.emailPlaceholder")}
          type="email"
        />

        <FormField
          control={form.control}
          disabled={isPending}
          name="password"
          label={tCommon("fields.password")}
          placeholder={tCommon("fields.passwordPlaceholder")}
          type="password"
        />

        {isSignUp && (
          <FormField
            control={form.control}
            disabled={isPending}
            name="confirmPassword"
            label={tCommon("fields.confirmPassword")}
            placeholder={tCommon("fields.confirmPasswordPlaceholder")}
            type="password"
          />
        )}

        <Button type="submit" disabled={isPending}>
          <LoadingSwap isLoading={isPending}>{tCommon(`actions.${mode}`)}</LoadingSwap>
        </Button>

        {/* {isSignUpEnabled && (
            <p className="text-muted-foreground text-center font-medium">
              {isSignUp ? tAuth("links.alreadyHaveAccount") : tAuth("links.dontHaveAccount")}

              <Link href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"} className="ml-1 underline">
                {tCommon(`actions.${isSignUp ? "signIn" : "signUp"}`)}
              </Link>
            </p>
          )} */}
      </FieldGroup>
    </form>
  );
}
