import type { PaginatedResult } from "@vittamhub/types";

export function buildPaginatedResult<T>(items: T[], totalItems: number, page: number, pageSize: number): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

/** Postgres OFFSET/LIMIT from a 1-indexed page — swap for cursor pagination first if a table needs infinite scroll past ~10k rows. */
export function paginationToOffset(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
