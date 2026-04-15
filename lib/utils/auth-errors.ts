type ErrorTranslator = ReturnType<typeof import("next-intl").useTranslations>;

export function getAuthErrorMessage(code: string | undefined, t: ErrorTranslator) {
  switch (code) {
    case "ACCOUNT_NOT_FOUND":
      return t("auth.ACCOUNT_NOT_FOUND");

    case "USER_NOT_FOUND":
      return t("auth.USER_NOT_FOUND");

    case "INVALID_EMAIL_OR_PASSWORD":
      return t("auth.INVALID_EMAIL_OR_PASSWORD");

    case "INVALID_EMAIL":
      return t("auth.INVALID_EMAIL");

    case "INVALID_PASSWORD":
      return t("auth.INVALID_PASSWORD");

    case "PASSWORD_TOO_LONG":
      return t("auth.PASSWORD_TOO_LONG");

    case "PASSWORD_TOO_SHORT":
      return t("auth.PASSWORD_TOO_SHORT");

    case "USER_ALREADY_EXISTS":
      return t("auth.USER_ALREADY_EXISTS");

    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return t("auth.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL");

    case "SIGN_UP_DISABLED":
      return t("auth.SIGN_UP_DISABLED");

    case "EMAIL_ALREADY_IN_USE":
      return t("auth.EMAIL_ALREADY_IN_USE");

    default:
      return t("unknown");
  }
}
