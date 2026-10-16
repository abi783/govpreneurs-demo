import { useCallback, useEffect, useState } from "react";
import { fetchSavedAwards, saveAward, unsaveAward } from "./awardsApi";

/**
 * The saved-awards shelf, hydrated once and toggled optimistically.
 *
 * The optimistic update with rollback matches the opportunity bookmark: a save is a
 * one-tap action, and waiting on a round trip to flip a star feels broken. If the
 * write fails we put the old state back rather than leave the UI asserting something
 * the server did not accept.
 */
export function useSavedAwards() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchSavedAwards(ctrl.signal)
      .then((rows) => setSaved(new Set(rows.map((r) => r.awardId))))
      // A shelf we cannot load is not worth an error banner — the page still works,
      // the stars just start empty.
      .catch(() => undefined)
      .finally(() => {
        if (!ctrl.signal.aborted) setReady(true);
      });
    return () => ctrl.abort();
  }, []);

  const toggle = useCallback(
    async (awardId: string, sourceTag: string) => {
      const wasSaved = saved.has(awardId);
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(awardId);
        else next.add(awardId);
        return next;
      });
      try {
        if (wasSaved) await unsaveAward(awardId);
        else await saveAward(awardId, sourceTag);
      } catch {
        setSaved((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(awardId);
          else next.delete(awardId);
          return next;
        });
      }
    },
    [saved],
  );

  return { saved, ready, toggle, isSaved: (id: string) => saved.has(id) };
}
