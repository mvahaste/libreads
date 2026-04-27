import auth from "../locales/en/auth.json";
import books from "../locales/en/books.json";
import browse from "../locales/en/browse.json";
import common from "../locales/en/common.json";
import dashboard from "../locales/en/dashboard.json";
import errors from "../locales/en/errors.json";
import nav from "../locales/en/nav.json";
import notFound from "../locales/en/not-found.json";
import settings from "../locales/en/settings.json";
import statistics from "../locales/en/statistics.json";

type Messages = {
  common: typeof common;
  dashboard: typeof dashboard;
  auth: typeof auth;
  nav: typeof nav;
  books: typeof books;
  browse: typeof browse;
  statistics: typeof statistics;
  settings: typeof settings;
  errors: typeof errors;
  notFound: typeof notFound;
};

declare module "next-intl" {
  interface AppConfig {
    Messages: Messages;
  }
}
