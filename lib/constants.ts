import { LucideBookOpen, LucideChartColumn, LucideIcon, LucideSettings, LucideTarget } from "lucide-react";

import nav from "../locales/en/nav.json";

export type AllowedLocale = "en" | "et";

export const ALLOWED_LOCALES = ["en", "et"] as const;

export const AUTH = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 32,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  SESSION_COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  SESSION_CACHE_VERSION: "2",
  SESSION_TOKEN_COOKIE_NAME: "session_token",
  SESSION_DATA_COOKIE_NAME: "session_data",
} as const;

export const API = {
  FALLBACK_COVER_VERSION: 2,
  HARDCOVER_API_URL: "https://api.hardcover.app/v1/graphql",
  HARDCOVER_GENRE_TAG_CATEGORY_ID: 1,
};

/** Default page size for paginated browse views */
export const DEFAULT_PAGE_SIZE = 24;

export const AVATAR = {
  MAX_SIZE: 1_000_000, // 1 MB
  ACCEPTED_TYPES: ["image/jpeg", "image/png"] as readonly string[],
  ACCEPTED_EXTENSIONS: "image/jpeg, image/png",
} as const;

export const BOOK_COVER = {
  MAX_SIZE: 5_000_000, // 5 MB
  MAX_WIDTH: 512,
  MAX_HEIGHT: 512,
  ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp"] as readonly string[],
  ACCEPTED_EXTENSIONS: "image/jpeg, image/png, image/webp",
} as const;

export type NavLink = {
  key: keyof typeof nav;
  icon: LucideIcon;
  url: string;
};

export const NAV_LINKS: NavLink[] = [
  {
    key: "browse",
    icon: LucideBookOpen,
    url: "/browse/my-books",
  },
  {
    key: "statistics",
    icon: LucideChartColumn,
    url: "/statistics",
  },
  {
    key: "goals",
    icon: LucideTarget,
    url: "/goals",
  },
  {
    key: "settings",
    icon: LucideSettings,
    url: "/settings/preferences",
  },
] as const;
