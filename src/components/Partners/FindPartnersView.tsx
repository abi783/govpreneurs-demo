import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { makeHighlighter } from "../Search/Highlight";
import { SearchHead } from "../Search/SearchHead";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { PartnersFilterPanel } from "./PartnersFilterPanel";
import { PrimeCandidateCard } from "./PrimeCandidateCard";
import { PrimeDetailPanel } from "./PrimeDetailPanel";
import { SuccessCenterLink } from "./SuccessCenterLink";
import { AppliedChips, FilterButton } from "../Filters/FilterPanel";
import { boardColumnLabel } from "./MyPartnersView";
import {
  NO_PARTNER_FILTERS,
  partnerChips,
  partnerPickLists,
  passesPartnerFilters,
  type PartnerFilters,
} from "../../lib/filters/partnerFilters";
import { serviceStates } from "../../lib/awards/relevance";
import { useMemberState } from "../../lib/memberState";
import {
  addToPipeline,
  fetchPartnerCompany,
  fetchPartners,
  fetchPipeline,
  removeFromPipeline,
  suppressPartner,
  unsuppressPartner,
  type PartnersFeedResponse,
  type PipelineStage,
  type PrimeCandidate,
} from "../../lib/partnersApi";
import { matchPartner, partnerReasonRank } from "../../lib/search/match";

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
  tabs,
  q,
  onSearch,
  filters: partnerFilters,
  onFiltersChange: setPartnerFilters,
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
  /** The view tabs. They sit under the search bar on this view. */
  tabs: ReactNode;
  /** The search text from the URL. */
  q: string;
  onSearch: (q: string) => void;
  /** The panel filters, from the URL. */
  filters: PartnerFilters;
  onFiltersChange: (next: PartnerFilters) => void;
}) {
  const [feed, setFeed] = useState<PartnersFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  // The board stage of each saved company. Past "Saved", removing one loses its progress.
  const [stages, setStages] = useState<Map<number, PipelineStage>>(new Map());
  const [confirmRemove, setConfirmRemove] = useState<PrimeCandidate | null>(null);
  // D11 — "not right for me". Optimistic: hides the card immediately, and rolls
  // back (re-shows it) only if the write fails. Item 12: a one-beat undo — the
  // notice stays up until the member acts on it or dismisses a later one.
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [undoNotice, setUndoNotice] = useState<{ awardeeKey: number; name: string } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [needle, setNeedle] = useState(q);
  // The last term we put in the URL. The URL echoing it back must not rewrite the box.
  const lastPushed = useRef(q);
  // "Near me" means the states in her service area. Empty means she works anywhere.
  const { profile } = useMemberState();
  const areaStates = serviceStates(profile);
  // Keep the box in step when the URL changes (back button, a shared link).
  useEffect(() => {
    if (q !== lastPushed.current) {
      lastPushed.current = q;
      setNeedle(q);
    }
  }, [q]);

  // "Not right for me" asks first: a mis-tap must not hide a company.
  const [confirmHide, setConfirmHide] = useState<PrimeCandidate | null>(null);
  // Where the card was in the list when a confirm opened. If the card goes, focus
  // moves to the card that now sits in its place.
  const askedAt = useRef(-1);
  // The confirm clears its company when it closes, before Radix hands focus back. So the
  // key is kept here, not read from the state.
  const askedKey = useRef<number | null>(null);
  const askHide = (p: PrimeCandidate) => {
    askedAt.current = cardIndex(p.awardeeKey);
    askedKey.current = p.awardeeKey;
    setConfirmHide(p);
  };
  // The safe answer has the focus when the remove confirm opens.
  const keepRef = useRef<HTMLButtonElement>(null);
  const hideKeepRef = useRef<HTMLButtonElement>(null);

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

  const onShowAgain = async (p: PrimeCandidate) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(p.awardeeKey);
      return next;
    });
    try {
      await unsuppressPartner(p.awardeeKey);
    } catch {
      setHidden((prev) => new Set(prev).add(p.awardeeKey));
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
      .then((rows) => {
        setSaved(new Set(rows.map((r) => r.awardeeKey)));
        setStages(new Map(rows.map((r) => [r.awardeeKey, r.stage])));
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  /**
   * The bookmark. A company past "Saved" on My partners has progress on the board, so
   * removing it asks first. A plain save toggles at once.
   */
  const onToggleSaved = (p: PrimeCandidate) => {
    const stage = stages.get(p.awardeeKey);
    if (saved.has(p.awardeeKey) && stage && stage !== "saved") {
      askedAt.current = cardIndex(p.awardeeKey);
      askedKey.current = p.awardeeKey;
      setConfirmRemove(p);
      return;
    }
    void toggleSaved(p);
  };

  /** Optimistic with rollback — a bookmark that waits on a round trip feels broken. */
  const toggleSaved = async (p: PrimeCandidate) => {
    const wasSaved = saved.has(p.awardeeKey);
    setStages((prev) => {
      const next = new Map(prev);
      if (wasSaved) next.delete(p.awardeeKey);
      else next.set(p.awardeeKey, "saved");
      return next;
    });
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
      .then((f) => {
        setFeed(f);
        setHidden(new Set((f.hidden ?? []).map((p) => p.awardeeKey)));
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        console.warn("partners load failed", err);
        setError("Could not load your partners.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  // The search runs on the server too: the stored feed only holds her own lane, and
  // the server also reads the companies that win the searched kind of work
  // ("catering", "561710"). Until it answers (or if it fails) the local match shows.
  const [found, setFound] = useState<{
    q: string;
    partners: PrimeCandidate[] | null;
    why: Record<string, string>;
  } | null>(null);
  useEffect(() => {
    const term = needle.trim();
    if (!term) setFound(null);
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      // One URL write per pause in typing, not one per keystroke.
      if (needle !== lastPushed.current) {
        lastPushed.current = needle;
        onSearch(needle);
      }
      if (!term) return;
      fetchPartners(ctrl.signal, term)
        .then((f) => {
          if (!ctrl.signal.aborted)
            setFound({ q: term, partners: f.partners, why: f.matchedBecause ?? {} });
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setFound({ q: term, partners: null, why: {} });
        });
    }, 300);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
    // onSearch is not stable; re-run on typing only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle]);

  // Item 12: auto-clear the undo notice after a generous window. A later
  // dismissal (new state) or the undo click itself clears it sooner.
  useEffect(() => {
    if (!undoNotice) return;
    const t = setTimeout(() => setUndoNotice(null), 12_000);
    return () => clearTimeout(t);
  }, [undoNotice]);

  // With no hidden company left, "Show them again" has nothing to show. Turn it off.
  useEffect(() => {
    if (!loading && hidden.size === 0 && partnerFilters.showHidden)
      setPartnerFilters({ ...partnerFilters, showHidden: false });
  }, [loading, hidden.size, partnerFilters, setPartnerFilters]);

  // When a company window closes, focus goes back to the card that opened it.
  const lastOpen = useRef<number | null>(null);
  useEffect(() => {
    if (openCompanyKey !== null) {
      lastOpen.current = openCompanyKey;
      return;
    }
    const key = lastOpen.current;
    lastOpen.current = null;
    if (key === null) return;
    // Radix returns focus after its own close, so wait one beat.
    const t = window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-awardee-key="${key}"]`)?.focus();
    }, 30);
    return () => window.clearTimeout(t);
  }, [openCompanyKey]);

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

  // The feed item is a light card. The full file (recent jobs, firms hired, long contracts,
  // certifications) is one read, so it loads for a company in the feed too.
  useEffect(() => {
    setLookupCompany(null);
    setLookupMissing(false);
    if (loading || openCompanyKey === null) return;
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
  }, [openCompanyKey, loading]);

  // D11 — suppressed client-side the instant a member says "not right for me",
  // ahead of the next server round trip actually dropping it from the stored feed.
  // The panel filter runs client-side on the precomputed list (typically a few hundred).
  // While the member searches, keep why each company matches. The card shows it.
  const deferredNeedle = useDeferredValue(needle);
  const query = deferredNeedle.trim();
  const hl = makeHighlighter(query);
  // The pick lists come from the whole feed, so a choice never finds nothing.
  const pickLists = useMemo(
    () => partnerPickLists([...(feed?.partners ?? []), ...(feed?.hidden ?? [])]),
    [feed],
  );
  const server = query && found?.q === query ? found : null;
  const searchPending = !!query && !server;
  const { all, partners, matchReasons } = useMemo(() => {
    const matchReasons = new Map<number, string>();
    // The companies she hid stay in the list, so "Show them again" can bring them back.
    const all = [...(server?.partners ?? feed?.partners ?? []), ...(feed?.hidden ?? [])];
    const filtered: PrimeCandidate[] = all.filter((p) => {
      if (hidden.has(p.awardeeKey) && !partnerFilters.showHidden) return false;
      if (!passesPartnerFilters(p, partnerFilters)) return false;
      if (!query) return true;
      const why = server?.why[p.awardeeKey] ?? matchPartner(p, query);
      if (why === null) return false;
      matchReasons.set(p.awardeeKey, why);
      return true;
    });
    // While she searches, the strongest match comes first. The ranking breaks ties.
    const partners = query
      ? filtered
          .map((p, i) => ({ p, i, r: partnerReasonRank(matchReasons.get(p.awardeeKey) ?? "") }))
          .sort((a, b) => a.r - b.r || a.i - b.i)
          .map((x) => x.p)
      : filtered;
    return { all, partners, matchReasons };
  }, [server, feed, hidden, partnerFilters, query]);
  const hiddenNames = all.filter((p) => hidden.has(p.awardeeKey)).map((p) => p.name);
  const partnerFilterChips = partnerChips(partnerFilters, pickLists);
  const open = partners.find((p) => p.awardeeKey === openCompanyKey) ?? null;

  // A company deep-link (from an Awards winner, or a shared URL) must win over
  // pending/empty/needsProfile — those states describe the RANKED FEED, not
  // whether this one company exists. `open` (in-feed) is checked first since it
  // needs no round trip; `lookupCompany` is the by-key fallback.
  // The feed item keeps its ranking; the full file adds the facts the card does not carry.
  const companyDetail = open
    ? { ...open, ...(lookupCompany ? fullFacts(lookupCompany) : {}) }
    : lookupCompany;
  // An object pattern here also keeps the copy check from reading this code as page text.
  const { isCandidate } = lookupCompany ?? { isCandidate: true };
  const companyDetailHasFailedGates = !open && isCandidate === false;

  const deepLinkPanel =
    openCompanyKey !== null ? (
      companyDetail ? (
        <PrimeDetailPanel
          partner={companyDetail}
          q={query}
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
        // The same centred window as a company, not a side drawer.
        <Dialog.Root open onOpenChange={(next) => !next && onOpenCompany(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="pdm-overlay" />
            <Dialog.Content className="pdm" aria-describedby={undefined}>
              <header className="pdm-head">
                <div className="pdm-head__text">
                  {backTo && backLabel && (
                    <nav aria-label="Go back">
                      <Link to={backTo} className="pdm-back">
                        ← Back to {backLabel}
                      </Link>
                    </nav>
                  )}
                  <Dialog.Title className="pdm-title">Not in your matches</Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button type="button" className="pdm-close" aria-label="Close">
                    <X size={18} aria-hidden />
                  </button>
                </Dialog.Close>
              </header>
              <div className="pdm-body">
                <div className="pdm-body__inner">
                  <p className="t-body-sm">We do not have a company file for this winner yet.</p>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null
    ) : null;

  const top = (
    <>
      <div className="partners-toolbar">
        <div className="partners-toolbar__row">
          <label className="partners-toolbar__search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              value={needle}
              placeholder="Search companies or kind of work"
              aria-label="Search companies or kind of work"
              onChange={(e) => {
                setNeedle(e.target.value);
              }}
            />
          </label>
          <FilterButton count={partnerFilterChips.length} onOpen={() => setPanelOpen(true)} />
        </div>
        <AppliedChips
          chips={partnerFilterChips}
          onRemove={(key) => {
            const c = partnerFilterChips.find((x) => x.key === key);
            if (c) setPartnerFilters(c.remove(partnerFilters));
          }}
          onClear={() => setPartnerFilters(NO_PARTNER_FILTERS)}
        />
      </div>
      <PartnersFilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filters={partnerFilters}
        onChange={setPartnerFilters}
        areaStates={areaStates}
        hiddenCount={hidden.size}
        hiddenNames={hiddenNames}
        lists={pickLists}
        resultCount={partners.length}
      />
      {tabs}
      {/* Item 12 — a one-beat undo. A toast at the bottom of the screen, in a live region,
          so a screen reader says it. It stays 12 seconds, or until she closes it. */}
      <div className="nrfm-toast-region" role="status" aria-live="polite">
        {undoNotice && (
          <div className="nrfm-toast">
            <span>Hid {undoNotice.name}.</span>
            <button type="button" className="nrfm-toast__undo" onClick={onUndoNotRightForMe}>
              Undo
            </button>
            <button
              type="button"
              className="nrfm-toast__close"
              aria-label="Close this message"
              onClick={() => setUndoNotice(null)}
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        )}
      </div>
      <Dialog.Root open={confirmRemove !== null} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="nrfm-overlay" />
          <Dialog.Content
            className="nrfm"
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              keepRef.current?.focus();
            }}
            onCloseAutoFocus={(e) => {
              // From inside the company window, focus goes back to the window as usual.
              if (openCompanyKey !== null || askedKey.current === null) return;
              e.preventDefault();
              focusCardOrNext(askedKey.current, askedAt.current);
            }}
          >
            <Dialog.Title className="nrfm__title">
              Remove {confirmRemove?.name} from My partners?
            </Dialog.Title>
            {confirmRemove && stages.get(confirmRemove.awardeeKey) && (
              <p className="nrfm__note">
                You will lose its place on your board (
                {boardColumnLabel(stages.get(confirmRemove.awardeeKey)!)}).
              </p>
            )}
            <div className="nrfm__acts">
              <button
                type="button"
                className="pstep-btn"
                onClick={() => {
                  if (confirmRemove) void toggleSaved(confirmRemove);
                  setConfirmRemove(null);
                }}
              >
                Yes, remove
              </button>
              <Dialog.Close ref={keepRef} className="pstep-btn pstep-btn--secondary">
                No
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={confirmHide !== null} onOpenChange={(o) => !o && setConfirmHide(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="nrfm-overlay" />
          <Dialog.Content
            className="nrfm"
            aria-describedby={undefined}
            // The safe answer has the focus, not "Yes, hide it".
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              hideKeepRef.current?.focus();
            }}
            onCloseAutoFocus={(e) => {
              if (openCompanyKey !== null || askedKey.current === null) return;
              e.preventDefault();
              focusCardOrNext(askedKey.current, askedAt.current);
            }}
          >
            <Dialog.Title className="nrfm__title">
              Are you sure {confirmHide?.name} is not right for you?
            </Dialog.Title>
            <div className="nrfm__acts">
              <button
                type="button"
                className="pstep-btn"
                onClick={() => {
                  if (confirmHide) void onNotRightForMe(confirmHide);
                  setConfirmHide(null);
                }}
              >
                Yes, hide it
              </button>
              <Dialog.Close ref={hideKeepRef} className="pstep-btn pstep-btn--secondary">
                No
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );

  if (loading) {
    return (
      <div className="find-partners">
        {top}
        {deepLinkPanel}
        <p className="awards-note">Looking for companies in your lane…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="find-partners">
        {top}
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
        {top}
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
        {top}
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
    // Say what found nothing, and give the one-tap way out.
    const filtersOn = partnerFilterChips.length > 0;
    return (
      <div className="find-partners">
        {top}
        {deepLinkPanel}
        <div className="card card-padded pboard-empty">
          <h2 className="t-heading">
            {searchPending
              ? `Searching for "${query}"…`
              : query
                ? `No companies match "${query}"`
                : "No companies match these filters"}
          </h2>
          {query && filtersOn && <p className="t-body-sm">Your filters are on too.</p>}
          <div className="nrfm__acts">
            {query && (
              <button
                type="button"
                className="pstep-btn"
                onClick={() => {
                  setNeedle("");
                  lastPushed.current = "";
                  onSearch("");
                }}
              >
                Clear search
              </button>
            )}
            {filtersOn && (
              <button
                type="button"
                className={query ? "pstep-btn pstep-btn--secondary" : "pstep-btn"}
                onClick={() => setPartnerFilters(NO_PARTNER_FILTERS)}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const topThree = partners.slice(0, 3);
  const rest = partners.slice(3);

  return (
    <div className="find-partners">
      {top}
      {deepLinkPanel}

      {feed?.stale && (
        <p className="award-note">
          Your profile changed recently, so this list is still being refreshed.
        </p>
      )}

      {query ? (
        // Searching: one list, strongest match first, under a plain count.
        <section className="find-partners__top">
          <SearchHead count={partners.length} noun="company" nouns="companies" q={query} />
          <div className="prime-list">
            {partners.map((p) => (
              <PrimeCandidateCard
                key={p.awardeeKey}
                partner={p}
                onOpen={onOpenCompany}
                saved={saved.has(p.awardeeKey)}
                onToggleSaved={onToggleSaved}
                onNotRightForMe={askHide}
                onShowAgain={hidden.has(p.awardeeKey) ? onShowAgain : undefined}
                matchedBecause={matchReasons.get(p.awardeeKey)}
                hl={hl}
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="find-partners__top">
            <h2 className="t-heading">Best matches for you</h2>
            <div className="prime-list">
              {topThree.map((p) => (
                <PrimeCandidateCard
                  key={p.awardeeKey}
                  partner={p}
                  onOpen={onOpenCompany}
                  saved={saved.has(p.awardeeKey)}
                  onToggleSaved={onToggleSaved}
                  onNotRightForMe={askHide}
                  onShowAgain={hidden.has(p.awardeeKey) ? onShowAgain : undefined}
                  matchedBecause={matchReasons.get(p.awardeeKey)}
                  hl={hl}
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
                    onNotRightForMe={askHide}
                    onShowAgain={hidden.has(p.awardeeKey) ? onShowAgain : undefined}
                    matchedBecause={matchReasons.get(p.awardeeKey)}
                    hl={hl}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {feed?.computedAt && (
        <p className="award-note">
          Based on contract awards published by the government. Last checked{" "}
          {new Date(feed.computedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      )}
    </div>
  );
}

/** The facts only the full company file carries. The feed item keeps its own ranking. */
function fullFacts(c: PrimeCandidate): Partial<PrimeCandidate> {
  return {
    recentJobs: c.recentJobs,
    buyers: c.buyers,
    workTypes: c.workTypes,
    tradesHired: c.tradesHired,
    subsHired: c.subsHired,
    vehicles: c.vehicles,
    subPlanJobs: c.subPlanJobs,
    certifications: c.certifications,
    sbaCertified: c.sbaCertified,
    samContact: c.samContact,
    registrationExpiresAt: c.registrationExpiresAt,
    parent: c.parent,
    headquarters: c.headquarters,
    employeeBand: c.employeeBand,
    runsMentorProgram: c.runsMentorProgram,
  };
}

/** The place of a card in the list on screen, or -1. */
function cardIndex(key: number): number {
  return [...document.querySelectorAll<HTMLElement>("[data-awardee-key]")].findIndex(
    (c) => c.dataset.awardeeKey === String(key),
  );
}

/** Focus the card again. If it has gone, focus the card that now sits in its place. */
function focusCardOrNext(key: number, index: number): void {
  // Radix returns focus after its own close, so wait one beat.
  window.setTimeout(() => {
    const cards = [...document.querySelectorAll<HTMLElement>("[data-awardee-key]")];
    const card =
      cards.find((c) => c.dataset.awardeeKey === String(key)) ??
      (index >= 0 ? cards[Math.min(index, cards.length - 1)] : undefined);
    card?.focus();
  }, 30);
}
