import { TRPCError } from "@trpc/server";

type PrismaKnownRequestErrorLike = {
  code: string;
  meta?: {
    target?: unknown;
  };
};

function asPrismaKnownRequestErrorLike(error: unknown): PrismaKnownRequestErrorLike | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const value = error as Record<string, unknown>;

  if (typeof value.code !== "string") {
    return null;
  }

  const meta = typeof value.meta === "object" && value.meta !== null ? (value.meta as { target?: unknown }) : undefined;

  return {
    code: value.code,
    meta,
  };
}

function extractUniqueTargets(error: PrismaKnownRequestErrorLike): string[] {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.map((entry) => String(entry));
  }

  if (typeof target === "string") {
    return [target];
  }

  return [];
}

function hasUniqueTarget(targets: string[], fieldName: string): boolean {
  return targets.some((target) => target === fieldName || target.includes(fieldName));
}

export function mapUniqueConstraintError(error: unknown, fieldMessageMap: Record<string, string>): TRPCError | null {
  const prismaError = asPrismaKnownRequestErrorLike(error);

  if (!prismaError || prismaError.code !== "P2002") {
    return null;
  }

  const targets = extractUniqueTargets(prismaError);

  for (const [field, message] of Object.entries(fieldMessageMap)) {
    if (hasUniqueTarget(targets, field)) {
      return new TRPCError({ code: "CONFLICT", message });
    }
  }

  return null;
}
