import { API } from "@/lib/constants";

/**
 * Get the URL for an internally stored image by its ID.
 */
export function getImageUrl(imageId: string | null | undefined): string | undefined {
  return imageId ? `/api/images/${imageId}` : undefined;
}

/**
 * Get the URL for a dynamically generated fallback book cover.
 */
export function getFallbackCoverUrl(title: string | undefined, subtitle: string | undefined, theme?: string): string {
  return `/api/images/fallback-cover?v=${API.FALLBACK_COVER_VERSION}&title=${encodeURIComponent(title ?? "")}&subtitle=${encodeURIComponent(subtitle ?? "")}&theme=${encodeURIComponent(theme ?? "light")}`;
}
