import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { ALLOWED_LOCALES, AllowedLocale } from "./constants";

export default getRequestConfig(async () => {
  const store = await cookies();

  let locale = store.get("locale")?.value;

  if (!locale || !ALLOWED_LOCALES.includes(locale as AllowedLocale)) {
    locale = "en";
  }

  return {
    locale,
    messages: {
      common: (await import(`../locales/${locale}/common.json`)).default,
      auth: (await import(`../locales/${locale}/auth.json`)).default,
      nav: (await import(`../locales/${locale}/nav.json`)).default,
      books: (await import(`../locales/${locale}/books.json`)).default,
      browse: (await import(`../locales/${locale}/browse.json`)).default,
      settings: (await import(`../locales/${locale}/settings.json`)).default,
      errors: (await import(`../locales/${locale}/errors.json`)).default,
      notFound: (await import(`../locales/${locale}/not-found.json`)).default,
    },
  };
});
