// The AI takes for the forecast list's cards, fetched in windows as she scrolls.
//
// The same shape as the opportunities feed (routes/index.tsx): the first window is
// fetched on arrival and one more is kept ahead; reaching a sentinel near the end of
// the fetched cards moves the reach one window on. Windows are fetched one at a time.
//
// Per browser session, a key is asked once. A key the server answered with no line
// is not asked again: its card keeps the rule-built line. A failed window is asked
// again after RETRY_AFTER_MS, never at once.

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchForecastTakes } from "./cardTakeApi";

/** Cards per window. */
export const TAKE_WINDOW = 20;
/** How long a failed window waits before it is asked again, in milliseconds. */
export const RETRY_AFTER_MS = 30_000;
/** How many cards before the reach the sentinel sits. */
const SENTINEL_LEAD = 5;
/** How far outside the screen the sentinel counts as reached. */
const SENTINEL_MARGIN = "400px";

/** The session's lines, the keys the server has answered, and when a key's window failed. */
const sessionLines = new Map<string, string>();
const answered = new Set<string>();
const failedAt = new Map<string, number>();

/** Clears the session's takes. For tests. */
export function resetForecastCardTakes(): void {
  sessionLines.clear();
  answered.clear();
  failedAt.clear();
}

/** The keys to ask for next: the first window of `ids` before `reach` not in `settled`. */
export function nextTakeBatch(
  ids: readonly string[],
  reach: number,
  settled: ReadonlySet<string>,
): string[] {
  return ids
    .slice(0, reach)
    .filter((id) => !settled.has(id))
    .slice(0, TAKE_WINDOW);
}

/** True when the list `next` is the list `previous` with ids appended (keys joined by commas). */
function extendsList(previous: string, next: string): boolean {
  return previous === "" || next === previous || next.startsWith(`${previous},`);
}

/** The keys not to ask for now: answered, or failed within the wait. */
function settledNow(now: number): Set<string> {
  const out = new Set(answered);
  for (const [id, at] of failedAt) if (now - at < RETRY_AFTER_MS) out.add(id);
  return out;
}

/** What the list reads: the lines so far, and where to put the sentinel. */
export interface ForecastCardTakes {
  takes: ReadonlyMap<string, string>;
  /** The index of the card the sentinel sits before. */
  sentinelIndex: number;
  /** The ref for the sentinel element. */
  sentinelRef: (el: HTMLElement | null) => void;
}

/** The AI takes for the cards in `ids`, in list order. */
export function useForecastCardTakes(ids: readonly string[]): ForecastCardTakes {
  const [reached, setReached] = useState(1);
  const inFlight = useRef(false);
  const [version, setVersion] = useState(0);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idsKey = ids.join(",");

  // A new list (another view, tab or filter) starts from its top. A next page of the
  // same list only appends ids, so the reach the member scrolled to stays.
  const previousKey = useRef("");
  useEffect(() => {
    if (!extendsList(previousKey.current, idsKey)) setReached(1);
    previousKey.current = idsKey;
  }, [idsKey]);

  const reach = Math.min((reached + 1) * TAKE_WINDOW, ids.length);

  useEffect(() => {
    if (inFlight.current) return;
    const batch = nextTakeBatch(ids, reach, settledNow(Date.now()));
    if (batch.length === 0) return;
    inFlight.current = true;
    fetchForecastTakes(batch)
      .then((lines) => {
        for (const id of batch) {
          answered.add(id);
          failedAt.delete(id);
        }
        lines.forEach((line, id) => sessionLines.set(id, line));
      })
      .catch(() => {
        const at = Date.now();
        for (const id of batch) failedAt.set(id, at);
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => setVersion((v) => v + 1), RETRY_AFTER_MS);
      })
      .finally(() => {
        inFlight.current = false;
        setVersion((v) => v + 1);
      });
    // `ids` is read through `idsKey`, so a new array with the same keys does not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, reach, version]);

  useEffect(
    () => () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  // Reaching the sentinel moves the reach one window on.
  useEffect(() => {
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setReached((w) => (w * TAKE_WINDOW < ids.length ? w + 1 : w));
        }
      },
      { rootMargin: SENTINEL_MARGIN },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [sentinel, ids.length, reached]);

  // `version` changes each time a window settles, which is when the lines change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const takes = useMemo(() => new Map(sessionLines), [version]);

  return {
    takes,
    sentinelIndex: Math.min(Math.max(reached * TAKE_WINDOW - SENTINEL_LEAD, 0), ids.length - 1),
    sentinelRef: setSentinel,
  };
}
