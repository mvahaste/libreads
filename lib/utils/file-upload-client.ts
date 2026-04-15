import { fetchWithTimeout } from "@/lib/utils/fetch";

export type UploadValidationError = "INVALID_FILE_TYPE" | "FILE_TOO_LARGE";

export function validateUploadFile(
  file: File,
  options: {
    acceptedTypes: readonly string[];
    maxSize: number;
  },
): UploadValidationError | null {
  if (!options.acceptedTypes.includes(file.type)) {
    return "INVALID_FILE_TYPE";
  }

  if (file.size > options.maxSize) {
    return "FILE_TOO_LARGE";
  }

  return null;
}

export async function uploadFileAsFormData<TSuccess, TErrorCode extends string>(
  url: string,
  file: File,
  options: {
    timeoutMs: number;
    mapError: (code: TErrorCode | undefined) => string;
  },
): Promise<TSuccess> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      body: formData,
    },
    options.timeoutMs,
  );

  if (!response.ok) {
    let code: TErrorCode | undefined;

    try {
      const payload = (await response.json()) as { code?: TErrorCode };
      code = payload.code;
    } catch {
      code = undefined;
    }

    throw new Error(options.mapError(code));
  }

  return response.json() as Promise<TSuccess>;
}
