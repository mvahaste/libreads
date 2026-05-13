import { API } from "@/lib/constants";

export function getImageUrl(imageId: string | null | undefined): string | undefined {
  return imageId ? `/api/images/${imageId}` : undefined;
}

export function getFallbackCoverUrl(title: string | undefined, subtitle: string | undefined, theme?: string): string {
  return `/api/images/fallback-cover?v=${API.FALLBACK_COVER_VERSION}&title=${encodeURIComponent(title ?? "")}&subtitle=${encodeURIComponent(subtitle ?? "")}&theme=${encodeURIComponent(theme ?? "light")}`;
}
