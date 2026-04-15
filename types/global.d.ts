import auth from "../locales/en/auth.json";
import books from "../locales/en/books.json";
import browse from "../locales/en/browse.json";
import common from "../locales/en/common.json";
import errors from "../locales/en/errors.json";
import nav from "../locales/en/nav.json";
import notFound from "../locales/en/not-found.json";
import settings from "../locales/en/settings.json";

type Messages = {
  common: typeof common;
  auth: typeof auth;
  nav: typeof nav;
  books: typeof books;
  browse: typeof browse;
  settings: typeof settings;
  errors: typeof errors;
  notFound: typeof notFound;
};

declare module "next-intl" {
  interface AppConfig {
    Messages: Messages;
  }
}
