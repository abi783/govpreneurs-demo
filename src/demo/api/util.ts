// DEMO: small helpers for API handlers. Add to this file; do not rename.

import { demoResponse } from "../runtime/router";

/** 404 with the shape that `buildApiError` reads (`{ message }`). */
export function notFound(message = "Not found") {
  return demoResponse(404, { message });
}

/** 400 with the shape that `buildApiError` reads. */
export function badRequest(message = "Bad request") {
  return demoResponse(400, { message });
}

/** 403 with the shape that `buildApiError` reads. */
export function forbidden(message = "Forbidden") {
  return demoResponse(403, { message });
}

/** One page of a list. `page` starts at 1. */
export function paginate<T>(items: readonly T[], page = 1, limit = 20) {
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(items.length / safeLimit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safeLimit;
  return {
    data: items.slice(start, start + safeLimit),
    total: items.length,
    page: safePage,
    limit: safeLimit,
    totalPages,
  };
}

/** A short id for new records (saved searches, messages, and so on). */
export function newId(prefix = "demo"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Read a number from a query value, with a fallback. */
export function numParam(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && value !== null && value !== "" ? n : fallback;
}
