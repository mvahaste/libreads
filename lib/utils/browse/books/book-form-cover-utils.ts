export type BookCoverUploadErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_FORM_DATA"
  | "NO_FILE_UPLOADED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED";

export type BookCoverUploadErrorResponse = {
  code?: BookCoverUploadErrorCode;
};

export type BookCoverUploadSuccessResponse = {
  imageId: string;
};

type Translator = ReturnType<typeof import("next-intl").useTranslations>;

export function mapBookCoverUploadError(code: BookCoverUploadErrorCode | undefined, t: Translator) {
  switch (code) {
    case "INVALID_FILE_TYPE":
      return t("cover-invalid-type");
    case "FILE_TOO_LARGE":
      return t("cover-too-large");
    case "UNAUTHORIZED":
    case "INVALID_FORM_DATA":
    case "NO_FILE_UPLOADED":
    case "UPLOAD_FAILED":
    default:
      return t("cover-upload-error");
  }
}
