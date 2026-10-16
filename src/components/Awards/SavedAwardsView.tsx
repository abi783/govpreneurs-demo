import { useEffect, useState } from "react";
import { AwardCard } from "./AwardCard";
import {
  fetchAward,
  fetchSavedAwards,
  type AwardRecord,
  type SavedAward,
} from "../../lib/awardsApi";

/**
 * The saved shelf — awards the member bookmarked, read back.
 *
 * The shelf stores ids, so each award is fetched for display. That is a handful of
 * point lookups on a unique index, not a scan, and it keeps the saved record small:
 * a snapshot would go stale as award data is re-synced.
 *
 * An award that has left the mirror is dropped from the display rather than
 * rendered as a broken row — but it stays on the shelf, so the member can still
 * remove it.
 *
 * The shelf is read once and then filtered against the live `saved` set — see the
 * effect below for why re-fetching on every toggle was the bug, not the feature.
 */
export function SavedAwardsView({
  saved,
  onToggleSaved,
  onBrowse,
}: {
  saved: Set<string>;
  onToggleSaved: (award: AwardRecord) => void;
  onBrowse: () => void;
}) {
  const [rows, setRows] = useState<AwardRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const shelf: SavedAward[] = await fetchSavedAwards(ctrl.signal);
        // Fetch in parallel; a missing award resolves to null and is filtered out.
        const awards = await Promise.all(
          shelf.map((s) => fetchAward(s.awardId, ctrl.signal).catch(() => null)),
        );
        if (!cancelled) {
          setRows(awards.filter((a): a is AwardRecord => a !== null));
        }
      } catch (err) {
        if (cancelled || ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load your saved awards.");
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // Fetch ONCE. This used to key on `saved.size` and re-fetch on every toggle,
    // which raced the DELETE still in flight: the GET came back with the row the
    // server had not removed yet, so an un-save rendered one state behind.
  }, []);

  // Derive what is visible from the LIVE saved set instead of re-reading the server.
  // `saved` is the same optimistic set the bookmark buttons use everywhere else on
  // the page, so the shelf agrees with them by construction: an un-save disappears
  // instantly with no network round trip, and a failed DELETE that rolls the set
  // back brings the row straight back. Awards dropped for leaving the mirror stay
  // dropped — they were never added to `rows`.
  const visible = rows?.filter((r) => saved.has(r.awardId)) ?? null;

  if (error) {
    return (
      <div className="card card-padded">
        <p className="t-body-sm">{error}</p>
      </div>
    );
  }

  if (visible === null) return <p className="awards-note">Loading your saved awards…</p>;

  if (visible.length === 0) {
    return (
      <div className="card card-padded">
        <h2 className="t-heading">Nothing saved yet</h2>
        <p className="t-body-sm">
          Tap the bookmark on any award and it shows up here, so you can come back to it later.
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={onBrowse}>
          Browse awards
        </button>
      </div>
    );
  }

  return (
    <div className="awards-list">
      {visible.map((a) => (
        <AwardCard
          key={a.awardId}
          award={a}
          saved={saved.has(a.awardId)}
          onToggleSaved={onToggleSaved}
        />
      ))}
    </div>
  );
}
