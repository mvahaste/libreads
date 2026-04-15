export type ParsedRelationRef =
  | {
      mode: "existing";
      id: string;
    }
  | {
      mode: "create";
      name: string;
    }
  | null;

export type RelationRefPrefixes = {
  existing: string;
  create: string;
};

export function normalizeEntityName(value: string): string {
  return value.trim().toLowerCase();
}

export function encodeExistingRelationRef(id: string, prefixes: RelationRefPrefixes): string {
  return `${prefixes.existing}${id}`;
}

export function encodeCreateRelationRef(name: string, prefixes: RelationRefPrefixes): string {
  return `${prefixes.create}${name.trim()}`;
}

export function parseRelationRef(
  value: string | null | undefined,
  prefixes: RelationRefPrefixes,
  fallbackToExisting = false,
): ParsedRelationRef {
  const text = value?.trim() ?? "";

  if (!text) {
    return null;
  }

  if (text.startsWith(prefixes.existing)) {
    const id = text.slice(prefixes.existing.length).trim();
    return id.length > 0 ? { mode: "existing", id } : null;
  }

  if (text.startsWith(prefixes.create)) {
    const name = text.slice(prefixes.create.length).trim();
    return name.length > 0 ? { mode: "create", name } : null;
  }

  if (fallbackToExisting) {
    return { mode: "existing", id: text };
  }

  return null;
}
