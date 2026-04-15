"use client";

import { getTrpcErrorCode } from "@/lib/utils/trpc-errors";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface MutationLike<TData, TVariables> {
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
}

interface UseSubmitMutationOptions<TData, TVariables> {
  mutation?: MutationLike<TData, TVariables>;
  submitAsync?: (variables: TVariables) => Promise<TData>;
  isPending?: boolean;
  defaultErrorMessage: string;
  errorMessageByCode?: Partial<Record<string, string>>;
  getErrorCode?: (error: unknown) => string | null;
  onSuccess?: (data: TData, variables: TVariables) => Promise<void> | void;
  onError?: (error: unknown, variables: TVariables) => Promise<boolean | void> | boolean | void;
}

export function useSubmitMutation<TData, TVariables>({
  mutation,
  submitAsync,
  isPending,
  defaultErrorMessage,
  errorMessageByCode,
  getErrorCode,
  onSuccess,
  onError,
}: UseSubmitMutationOptions<TData, TVariables>) {
  const [isSubmitPending, setIsSubmitPending] = useState(false);

  const submit = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      const runSubmit = mutation?.mutateAsync ?? submitAsync;

      if (!runSubmit) {
        throw new Error("useSubmitMutation requires either mutation or submitAsync");
      }

      setIsSubmitPending(true);

      try {
        const data = await runSubmit(variables);
        await onSuccess?.(data, variables);

        return data;
      } catch (error) {
        const handled = await onError?.(error, variables);

        if (handled) {
          return null;
        }

        const errorCode = getErrorCode?.(error) ?? getTrpcErrorCode(error);
        if (errorCode && errorMessageByCode?.[errorCode]) {
          toast.error(errorMessageByCode[errorCode]);
          return null;
        }

        toast.error(defaultErrorMessage);

        return null;
      } finally {
        setIsSubmitPending(false);
      }
    },
    [defaultErrorMessage, errorMessageByCode, getErrorCode, mutation, onError, onSuccess, submitAsync],
  );

  return {
    submit,
    isPending: mutation?.isPending ?? isPending ?? isSubmitPending,
  };
}
