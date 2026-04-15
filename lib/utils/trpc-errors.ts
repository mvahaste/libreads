export function getTrpcErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const maybeError = error as {
    message?: unknown;
    data?: { code?: unknown };
  };

  if (typeof maybeError.message === "string") {
    return maybeError.message;
  }

  if (typeof maybeError.data?.code === "string") {
    return maybeError.data.code;
  }

  return undefined;
}

interface MappedFieldError<TFieldName extends string> {
  field: TFieldName;
  message: string;
}

interface ApplyMappedFieldErrorParams<TFieldName extends string> {
  error: unknown;
  map: Partial<Record<string, MappedFieldError<TFieldName>>>;
  setFieldError: (field: TFieldName, message: string) => void;
}

export function applyMappedFieldError<TFieldName extends string>({
  error,
  map,
  setFieldError,
}: ApplyMappedFieldErrorParams<TFieldName>) {
  const errorCode = getTrpcErrorCode(error);

  if (!errorCode) {
    return false;
  }

  const mappedError = map[errorCode];

  if (!mappedError) {
    return false;
  }

  setFieldError(mappedError.field, mappedError.message);

  return true;
}
