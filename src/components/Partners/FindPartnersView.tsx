import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PrimeCandidateCard } from "./PrimeCandidateCard";
import { PrimeDetailPanel } from "./PrimeDetailPanel";
import { SuccessCenterLink } from "./SuccessCenterLink";
import {
  addToPipeline,
  fetchPartnerCompany,
  fetchPartners,
  fetchPipeline,
  removeFromPipeline,
  suppressPartner,
  unsuppressPartner,
  type PartnersFeedResponse,
  type PrimeCandidate,
} from "../../lib/partnersApi";

/**
 * "Find partners" over REAL award data — companies already winning the work the
 * member does, in the places they work.
 *
 * The top three are surfaced deliberately: a member cannot act on twenty
 * relationships, and mentor guidance is explicit that the job is to pick three
 * companies and work them. The rest stay reachable, so filtering to a niche never
 * hits an empty page.
 */
export function FindPartnersView({
  onOpenCompany,
  openCompanyKey,
  backTo,
  backLabel,
  onNeedsProfile,
}: {
  onOpenCompany: (awardeeKey: number | null) => void;
  /** Which company the URL says is open, so the panel is shareable and back-safe. */
  openCompanyKey: number | null;
  /** Where the member came from. Rendered inside the panel, which covers the page. */
  backTo?: string;
  backLabel?: string;
  /** Fired once, the first time the feed resolves with no trade on file — lets the
   *  route switch a journey-resolved member to Who's winning instead of stranding
   *  them here. Undefined when the route arrived at "find" explicitly (?view=find). */
  onNeedsProfile?: () => void;
}) {
  const [feed, setFeed] = useState<PartnersFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  // D11 — "not right for me". Optimistic: hides the card immediately, and rolls
  // back (re-shows it) only if the write fails. Item 12: a one-beat undo — the
  // notice stays up until the member acts on it or dismisses a later one.
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [undoNotice, setUndoNotice] = useState<{ awardeeKey: number; name: string } | null>(null);

  const onNotRightForMe = async (p: PrimeCandidate) => {
    setHidden((prev) => new Set(prev).add(p.awardeeKey));
    setUndoNotice({ awardeeKey: p.awardeeKey, name: p.name });
    if (openCompanyKey === p.awardeeKey) onOpenCompany(null);
    try {
      await suppressPartner(p.awardeeKey);
    } catch {
      setHidden((prev) => {
        const next = new Set(prev);
        next.delete(p.awardeeKey);
        return next;
      });
      setUndoNotice((prev) => (prev?.awardeeKey === p.awardeeKey ? null : prev));
    }
  };

  const onUndoNotRightForMe = async () => {
    if (!undoNotice) return;
    const { awardeeKey } = undoNotice;
    setUndoNotice(null);
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(awardeeKey);
      return next;
    });
    try {
      await unsuppressPartner(awardeeKey);
    } catch {
      // Best-effort: re-hide it rather than show a company the server still
      // considers suppressed.
      setHidden((prev) => new Set(prev).add(awardeeKey));
    }
  };

  // Hydrate the pipeline so a company already saved shows as saved. A failure here
  // is not worth an error banner — the bookmarks just start empty.
  useEffect(() => {
    const ctrl = new AbortController();
    fetchPipeline(ctrl.signal)
      .then((rows) => setSaved(new Set(rows.map((r) => r.awardeeKey))))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  /** Optimistic with rollback — a bookmark that waits on a round trip feels broken. */
  const onToggleSaved = async (p: PrimeCandidate) => {
    const wasSaved = saved.has(p.awardeeKey);
    setSaved((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(p.awardeeKey);
      else next.add(p.awardeeKey);
      return next;
    });
    try {
      if (wasSaved) await removeFromPipeline(p.awardeeKey);
      else await addToPipeline(p.awardeeKey, p.name, "from Find partners");
    } catch {
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(p.awardeeKey);
        else next.delete(p.awardeeKey);
        return next;
      });
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPartners(ctrl.signal)
      .then(setFeed)
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load your partners.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  // Item 12: auto-clear the undo notice after a generous window. A later
  // dismissal (new state) or the undo click itself clears it sooner.
  useEffect(() => {
    if (!undoNotice) return;
    const t = setTimeout(() => setUndoNotice(null), 12_000);
    return () => clearTimeout(t);
  }, [undoNotice]);

  // Fire onNeedsProfile once, the first time the feed resolves with no trade on
  // file — a ref (not state) so it can never fire twice and re-loop the route.
  const firedNeedsProfile = useRef(false);
  useEffect(() => {
    if (feed?.needsProfile && !firedNeedsProfile.current) {
      firedNeedsProfile.current = true;
      onNeedsProfile?.();
    }
  }, [feed, onNeedsProfile]);

  // A member can arrive here from an award whose winner is not in their ranked
  // feed — a different trade/area, a failed gate, or a feed that has not been
  // computed yet. The Awards PRD's contract is that the winner IS a company in
  // Partners, so once the feed has resolved and does not hold this key, look it
  // up directly rather than showing a guessed reason. Runs regardless of
  // pending/empty/needsProfile — a company deep-link wins over all of them.
  const [lookupCompany, setLookupCompany] = useState<PrimeCandidate | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMissing, setLookupMissing] = useState(false);
  const inFeed = feed?.partners.some((p) => p.awardeeKey === openCompanyKey) ?? false;

  useEffect(() => {
    setLookupCompany(null);
    setLookupMissing(false);
    if (loading || openCompanyKey === null || inFeed) return;
    const ctrl = new AbortController();
    setLookupLoading(true);
    fetchPartnerCompany(openCompanyKey, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        if (result) setLookupCompany(result.company);
        else setLookupMissing(true);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setLookupMissing(true);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLookupLoading(false);
      });
    return () => ctrl.abort();
  }, [openCompanyKey, loading, inFeed]);

  // D11 — suppressed client-side the instant a member says "not right for me",
  // ahead of the next server round trip actually dropping it from the stored feed.
  const partners: PrimeCandidate[] = (feed?.partners ?? []).filter(
    (p) => !hidden.has(p.awardeeKey),
  );
  const open = partners.find((p) => p.awardeeKey === openCompanyKey) ?? null;

  // A company deep-link (from an Awards winner, or a shared URL) must win over
  // pending/empty/needsProfile — those states describe the RANKED FEED, not
  // whether this one company exists. `open` (in-feed) is checked first since it
  // needs no round trip; `lookupCompany` is the by-key fallback.
  const companyDetail = open ?? lookupCompany;
  const companyDetailHasFailedGates = lookupCompany !== null && lookupCompany.isCandidate === false;

  const deepLinkPanel =
    openCompanyKey !== null ? (
      companyDetail ? (
        <PrimeDetailPanel
          partner={companyDetail}
          saved={saved.has(companyDetail.awardeeKey)}
          onToggleSaved={onToggleSaved}
          onClose={() => onOpenCompany(null)}
          backTo={backTo}
          backLabel={backLabel}
          gateFailureReasons={
            companyDetailHasFailedGates ? (lookupCompany!.gateFailureReasons ?? []) : []
          }
        />
      ) : lookupLoading ? (
        <aside className="prime-detail" aria-label="Opening company">
          <p className="t-body-sm">Opening…</p>
        </aside>
      ) : lookupMissing ? (
        <aside className="prime-detail" aria-label="Company not found">
          {backTo && backLabel && (
            <nav className="backnav" aria-label="Go back">
              <Link to={backTo} className="backlink">
                ← Back to {backLabel}
              </Link>
            </nav>
          )}
          <div className="prime-detail__head">
            <div>
              <h2 className="t-heading">Not in your matches</h2>
            </div>
            <button
              type="button"
              className="prime-detail__close"
              aria-label="Close"
              onClick={() => onOpenCompany(null)}
            >
              ×
            </button>
          </div>
          <p className="t-body-sm">We do not have a company file for this winner yet.</p>
        </aside>
      ) : null
    ) : null;

  if (loading) {
    return (
      <div className="find-partners">
        {deepLinkPanel}
        <p className="awards-note">Looking for companies in your lane…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="find-partners">
        {deepLinkPanel}
        <div className="card card-padded">
          <p className="t-body-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No trade on file — there is no lane to rank against. Say what to do about it.
  if (feed?.needsProfile) {
    return (
      <div className="find-partners">
        {deepLinkPanel}
        <div className="card card-padded">
          <h2 className="t-heading">Tell us what you do</h2>
          <p className="t-body-sm">
            We match you to companies winning the kind of work you do. Add your trade to your
            profile and this page fills up.
          </p>
          <SuccessCenterLink />
        </div>
      </div>
    );
  }

  // Never computed. Deliberately NOT "no partners found" — we have not looked yet,
  // and telling someone their market is empty when we simply have not run would be
  // false and discouraging.
  if (feed?.pending) {
    return (
      <div className="find-partners">
        {deepLinkPanel}
        <div className="card card-padded">
          <h2 className="t-heading">We&rsquo;re finding your partners</h2>
          <p className="t-body-sm">
            We&rsquo;re going through recent contract awards in your trade and area. Check back
            shortly.
          </p>
        </div>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="find-partners">
        {deepLinkPanel}
        <div className="card card-padded">
          <h2 className="t-heading">No companies matched yet</h2>
          <p className="t-body-sm">
            We could not find companies winning your kind of work near you. Widening the states you
            work in usually helps.
          </p>
        </div>
      </div>
    );
  }

  const topThree = partners.slice(0, 3);
  const rest = partners.slice(3);

  return (
    <div className="find-partners">
      {deepLinkPanel}

      {feed?.stale && (
        <p className="award-note">
          Your profile changed recently, so this list is still being refreshed.
        </p>
      )}

      {/* D11 — required framing: Partners is one of four ways in, and the
          slowest. Plain paragraph, no new component, no numeric score. */}
      <p className="award-note">
        Partners is one of four ways in, and the slowest. The others are SLED (state and local
        work), micro-purchases under $10,000, and small federal jobs you can bid yourself. This list
        is a starting point for research, not an instruction — you decide who to reach out to.
      </p>

      {/* Item 12 — one-beat undo, replacing the "no undo path" note above. */}
      {undoNotice && (
        <p className="award-note">
          Removed {undoNotice.name}.{" "}
          <button type="button" className="backlink" onClick={onUndoNotRightForMe}>
            Undo
          </button>
        </p>
      )}

      <section className="find-partners__top">
        <h2 className="t-heading">Your top {topThree.length}</h2>
        <p className="t-body-sm">
          Start with these. Working three relationships properly beats contacting twenty.
        </p>
        <div className="prime-list">
          {topThree.map((p) => (
            <PrimeCandidateCard
              key={p.awardeeKey}
              partner={p}
              onOpen={onOpenCompany}
              saved={saved.has(p.awardeeKey)}
              onToggleSaved={onToggleSaved}
              onNotRightForMe={onNotRightForMe}
            />
          ))}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="find-partners__rest">
          <h2 className="t-heading">Everyone else we found</h2>
          <div className="prime-list">
            {rest.map((p) => (
              <PrimeCandidateCard
                key={p.awardeeKey}
                partner={p}
                onOpen={onOpenCompany}
                saved={saved.has(p.awardeeKey)}
                onToggleSaved={onToggleSaved}
                onNotRightForMe={onNotRightForMe}
              />
            ))}
          </div>
        </section>
      )}

      {feed?.computedAt && (
        <p className="award-note">
          Based on contract awards published by the government. Last checked{" "}
          {new Date(feed.computedAt).toLocaleDateString()}.
        </p>
      )}
    </div>
  );
}
