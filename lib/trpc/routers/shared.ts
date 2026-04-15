import { TRPCError } from "@trpc/server";

type ProcedureErrorHandlingOptions = {
  shouldRethrow?: (error: unknown) => boolean;
  mapError?: (error: unknown) => TRPCError | null;
  logLabel?: string;
  internalMessage?: string;
};

type PaginationArgs = {
  skip: number;
  take: number;
};

type PaginatedListQueryOptions<TItem, TMapped = TItem> = {
  page: number;
  pageSize: number;
  findMany: (pagination: PaginationArgs) => Promise<TItem[]>;
  count: () => Promise<number>;
  mapItem?: (item: TItem) => TMapped;
};

/**
 * Standardized procedure error handling for router query/mutation bodies.
 */
export async function withProcedureErrorHandling<T>(
  execute: () => Promise<T>,
  options: ProcedureErrorHandlingOptions,
): Promise<T> {
  try {
    return await execute();
  } catch (error) {
    if (error instanceof TRPCError || options.shouldRethrow?.(error)) {
      throw error;
    }

    const mappedError = options.mapError?.(error);

    if (mappedError) {
      throw mappedError;
    }

    if (!options.internalMessage) {
      throw error;
    }

    if (options.logLabel) {
      console.error(`${options.logLabel}:`, error);
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: options.internalMessage,
    });
  }
}

/**
 * Shared findMany/count pagination flow for list queries.
 */
export async function runPaginatedListQuery<TItem, TMapped = TItem>(
  options: PaginatedListQueryOptions<TItem, TMapped>,
): Promise<{ items: TMapped[]; total: number }> {
  const { page, pageSize, findMany, count, mapItem } = options;

  const [items, total] = await Promise.all([
    findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    count(),
  ]);

  return {
    items: mapItem ? items.map(mapItem) : (items as unknown as TMapped[]),
    total,
  };
}
