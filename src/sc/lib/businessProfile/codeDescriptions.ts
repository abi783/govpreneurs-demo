"use client";

/**
 * The batched code-description cache shared by the NAICS and PSC pickers.
 *
 * Both registers need the same three things on the client: look a code's label
 * up without blocking, fetch the ones we do not have in batches the backend
 * will accept, and never throw — an unresolved label falls back to the bare
 * code, which is worse to read but still true. Extracted when PSC arrived so
 * the batching and de-duplication exist once; each register keeps its own cache
 * instance, so a NAICS code and a PSC code can never collide on the same key.
 */

export interface CodeDescription {
  code: string;
  description: string;
}

/** The backend rejects more than this many codes in one `?codes=` call. */
const MAX_CODES_PER_BATCH = 100;

export interface DescriptionCache {
  /** Fetches descriptions for any of `codes` not already cached. Never throws. */
  ensure(codes: string[]): Promise<void>;
  /** The cached label for a code, or undefined if it has not landed. */
  describe(code: string): string | undefined;
}

/**
 * Builds a cache against one `/api/hunter/<register>-descriptions` proxy.
 * `endpoint` is our own server route, never Hunter directly, so the shared
 * partner key stays out of the browser.
 */
export function createDescriptionCache(endpoint: string): DescriptionCache {
  const cache = new Map<string, string>();
  const pending = new Map<string, Promise<void>>();

  async function ensure(codes: string[]): Promise<void> {
    const missing = codes.filter((c) => !cache.has(c));
    if (missing.length === 0) return;
    const batches: string[][] = [];
    for (let i = 0; i < missing.length; i += MAX_CODES_PER_BATCH) {
      batches.push(missing.slice(i, i + MAX_CODES_PER_BATCH));
    }
    await Promise.all(
      batches.map(async (batch) => {
        const key = batch.join(",");
        let job = pending.get(key);
        if (!job) {
          job = fetch(`${endpoint}?codes=${encodeURIComponent(key)}`)
            .then((res) => (res.ok ? (res.json() as Promise<CodeDescription[]>) : []))
            .then((rows) => {
              for (const row of rows) cache.set(row.code, row.description);
            })
            .catch(() => {
              /* label falls back to the bare code — the picker never blocks */
            });
          pending.set(key, job);
        }
        await job;
      }),
    );
  }

  return { ensure, describe: (code) => cache.get(code) };
}

/**
 * Queries one `/api/hunter/<register>-search` proxy. Returns [] for a blank
 * query and for any failure, so a Hunter outage shows "no results" rather than
 * an error the member cannot act on.
 */
export async function searchCodes<T extends CodeDescription>(
  endpoint: string,
  q: string,
): Promise<T[]> {
  if (!q.trim()) return [];
  try {
    const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}
