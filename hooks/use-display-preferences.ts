"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Entity types that support display mode preferences.
 * Display mode is stored per entity type (not per view),
 * so editions show the same display mode on My Books, Editions catalog, etc.
 */
export type DisplayEntityType = "edition" | "work";

/**
 * Available display modes for book/work cards.
 */
export type DisplayMode = "default" | "list" | "compact" | "cover";

const DEFAULT_DISPLAY_MODE: DisplayMode = "default";

function getStorageKey(entityType: DisplayEntityType): string {
  return `display-mode:${entityType}`;
}

function getSnapshot(entityType: DisplayEntityType): DisplayMode {
  if (typeof window === "undefined") return DEFAULT_DISPLAY_MODE;
  const value = localStorage.getItem(getStorageKey(entityType));
  if (value === "default" || value === "list" || value === "compact" || value === "cover") return value;
  return DEFAULT_DISPLAY_MODE;
}

// Listeners per entity type
const listeners = new Map<DisplayEntityType, Set<() => void>>();

function subscribe(entityType: DisplayEntityType, listener: () => void) {
  if (!listeners.has(entityType)) {
    listeners.set(entityType, new Set());
  }
  listeners.get(entityType)!.add(listener);
  return () => {
    listeners.get(entityType)!.delete(listener);
  };
}

function emitChange(entityType: DisplayEntityType) {
  listeners.get(entityType)?.forEach((listener) => listener());
}

/**
 * Hook to read and write display mode preferences per entity type.
 * Persists to localStorage and syncs across components using the same entity type.
 */
export function useDisplayPreferences(entityType: DisplayEntityType) {
  const displayMode = useSyncExternalStore(
    (listener) => subscribe(entityType, listener),
    () => getSnapshot(entityType),
    () => DEFAULT_DISPLAY_MODE,
  );

  const setDisplayMode = useCallback(
    (mode: DisplayMode) => {
      localStorage.setItem(getStorageKey(entityType), mode);
      emitChange(entityType);
    },
    [entityType],
  );

  return [displayMode, setDisplayMode] as const;
}
