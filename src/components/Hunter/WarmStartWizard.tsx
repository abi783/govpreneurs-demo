// Warm-start wizard — 3 quick questions for preview-stage (no capability
// statement) users. Every step is the shared searchable two-level tri-state
// picker (OnboardingTreePicker): a non-expert works at level 1 (plain-language
// parent); an advanced user expands to level 2 for precise NAICS/city/SAM
// codes. See COLD_START_PLAN.md §5–§7 for the finish-mapping spec and copy.
//
// External contract is unchanged: `{ locationId, onComplete }` — no route
// changes required (routes/index.tsx already renders this on the preview gate).

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { TreeSelection } from "../../lib/treeSelection";
import { OnboardingTreePicker } from "./OnboardingTreePicker";
import {
  buildWorkTree,
  WORK_SECTION_LABELS,
  STATE_TREE,
  SET_ASIDE_TREE,
  SET_ASIDE_SECTION_LABELS,
  cityChildrenOf,
} from "../../lib/onboardingTrees";
import { fetchCities } from "../../lib/discoverApi";
import {
  storePreviewAnswers,
  fetchPreviewAnswers,
  searchNaics,
  type NaicsSearchResult,
} from "../../lib/preview";
import { describeNaics, ensureNaicsDescriptions } from "../../lib/naicsCatalog";
import {
  buildPreviewAnswers,
  emptyPreviewAnswers,
  selectionsFromAnswers,
  tradeIdsFrom,
  EMPTY_TREE_SELECTION,
  type ServiceArea,
} from "../../lib/warmStartMapping";
import { WORK_TYPE_TO_NAICS } from "../../lib/vocab/trades";

// ── Service-area radio cards (COLD_START_PLAN.md §7) ────────────────────────
const SERVICE_AREAS: Array<{
  id: ServiceArea;
  label: string;
  pluralLabel?: string;
  sublabel: string;
}> = [
  { id: "metro", label: "Just my metro area", sublabel: "city + ~30 miles" },
  { id: "nearby", label: "Nearby cities too", sublabel: "up to ~100 miles" },
  {
    id: "state",
    label: "Anywhere in my state",
    pluralLabel: "Anywhere in my states",
    sublabel: "auto-adjusts if your cities span more than one state",
  },
  {
    id: "state_plus_neighbors",
    label: "My state + neighboring states",
    sublabel: "the regional footprint",
  },
  { id: "national", label: "Anywhere in the country", sublabel: "no geographic limit" },
];

/** Every state code touched by a location selection — used for rung-label pluralization. */
function stateCodesTouched(locSel: TreeSelection): string[] {
  const set = new Set<string>(locSel.parents);
  for (const cid of locSel.children) {
    const sep = cid.indexOf("::");
    if (sep !== -1) set.add(cid.slice(0, sep));
  }
  return [...set];
}

export function WarmStartWizard({
  locationId,
  onComplete,
}: {
  locationId: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [workSel, setWorkSel] = useState<TreeSelection>(EMPTY_TREE_SELECTION);
  const [locSel, setLocSel] = useState<TreeSelection>(EMPTY_TREE_SELECTION);
  const [saSel, setSaSel] = useState<TreeSelection>(EMPTY_TREE_SELECTION);
  const [serviceArea, setServiceArea] = useState<ServiceArea | "">("");
  const [adhocNaics, setAdhocNaics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Bumped whenever the description cache gains entries, to force the work
  // tree (memoized below) to re-resolve labels that were pending on mount.
  const [descVersion, setDescVersion] = useState(0);

  // ── B3: rehydrate from any previously-stored answers on mount ──
  useEffect(() => {
    let cancelled = false;
    fetchPreviewAnswers()
      .then((answers) => {
        if (cancelled || !answers) return;
        const rehydrated = selectionsFromAnswers(answers);
        setWorkSel(rehydrated.workSel);
        setLocSel(rehydrated.locSel);
        setSaSel(rehydrated.saSel);
        setServiceArea(rehydrated.serviceArea);
        setAdhocNaics(rehydrated.adhocNaics);
      })
      .catch(() => {
        /* blank wizard on error, per B3 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Step 1 tree: real NAICS descriptions, fetched in the background ──
  // `OnboardingTreePicker`'s `loadChildren` lazy-load path only fires for
  // parents whose `children` array starts EMPTY (see its `isLazy`); WORK_TREE's
  // parents always have their NAICS children populated up front (from
  // `WORK_TYPE_TO_NAICS`), so that path never applies here — the picker never
  // calls back into us on expand. Instead we resolve labels through the
  // `describeNaics` resolver `buildWorkTree` already supports (A5), backed by
  // the module-level cache, and warm that cache in small background batches
  // on mount so descriptions are usually already there by the time a trade is
  // expanded — never blocking initial render, and falling back to
  // `NAICS <code>` for anything not yet resolved.
  const workTree = useMemo(() => buildWorkTree(describeNaics), [descVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    const allCodes = [...new Set(Object.values(WORK_TYPE_TO_NAICS).flat())];
    (async () => {
      for (let i = 0; i < allCodes.length; i += 100) {
        if (cancelled) return;
        await ensureNaicsDescriptions(allCodes.slice(i, i + 100));
        if (!cancelled) setDescVersion((v) => v + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Step 2 tree: lazy cities via fetchCities(state) → cityChildrenOf ──
  const loadCityChildren = useMemo(
    () => async (state: string) => {
      const groups = await fetchCities(state);
      const rows = groups.find((g) => g.state === state)?.cities ?? [];
      return cityChildrenOf(state, rows);
    },
    [],
  );

  // ── B4: NAICS escape hatch ("search all NAICS codes") ──
  const [adhocQuery, setAdhocQuery] = useState("");
  const [adhocResults, setAdhocResults] = useState<NaicsSearchResult[]>([]);
  const [adhocSearching, setAdhocSearching] = useState(false);
  const [showAdhocSearch, setShowAdhocSearch] = useState(false);

  const runAdhocSearch = (q: string) => {
    setAdhocQuery(q);
    if (!q.trim()) {
      setAdhocResults([]);
      return;
    }
    setAdhocSearching(true);
    searchNaics(q)
      .then(setAdhocResults)
      .catch(() => setAdhocResults([]))
      .finally(() => setAdhocSearching(false));
  };

  const toggleAdhoc = (code: string) =>
    setAdhocNaics((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );

  // ── Gating (§B1) ──
  const chosenTradeIds = useMemo(() => tradeIdsFrom(workSel), [workSel]);
  const canContinueStep1 = chosenTradeIds.length > 0 || adhocNaics.length > 0;
  const chosenStateCodes = useMemo(() => stateCodesTouched(locSel), [locSel]);
  const canContinueStep2 = chosenStateCodes.length > 0 && serviceArea !== "";
  const spansStates = chosenStateCodes.length > 1;

  const finish = async () => {
    setSubmitting(true);
    try {
      const answers = buildPreviewAnswers({
        workSel,
        locSel,
        saSel,
        serviceArea: (serviceArea || "state") as ServiceArea,
        adhocNaics,
      });
      await storePreviewAnswers(locationId, answers);
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  const skip = async () => {
    setSubmitting(true);
    try {
      await storePreviewAnswers(locationId, emptyPreviewAnswers());
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  const rungLabel = (a: (typeof SERVICE_AREAS)[number]) =>
    a.id === "state" && spansStates && a.pluralLabel ? a.pluralLabel : a.label;

  // Lock background scroll while the modal is mounted. This component only
  // renders while the preview gate is active (see routes/index.tsx), so
  // mount/unmount doubles as open/close — restore on unmount unconditionally.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    // Full-viewport scrim. Deliberate deviation from the govpreneurs-v2
    // reference (whose Radix Dialog treats a backdrop click and Escape as
    // skip): here, skipping is a deliberate action gated behind the explicit
    // "Explore without personalizing" button only, so this element has no
    // onClick handler (a click on the scrim does nothing) and no keydown
    // handler is wired for Escape either.
    <div className="wsw-overlay">
      <div
        className="wsw"
        role="dialog"
        aria-modal="true"
        aria-label="Set up your opportunity preview"
        aria-labelledby="wsw-title"
      >
        <div className="wsw-card">
          <header className="wsw-header">
            <div>
              <h2 id="wsw-title" className="wsw-title">
                Let's find your money.
              </h2>
              <p className="wsw-sub">3 quick questions — Hunter does the rest.</p>
            </div>
            <button
              type="button"
              className="wsw-skip"
              onClick={skip}
              disabled={submitting}
              aria-label="Skip the wizard"
            >
              Explore without personalizing
            </button>
          </header>

          <div
            className="wsw-progress"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={3}
          >
            {[1, 2, 3].map((n) => (
              <span key={n} className={`wsw-dot${n <= step ? " is-filled" : ""}`} aria-hidden />
            ))}
          </div>

          {step === 1 && (
            <div className="wsw-step">
              <h3 className="wsw-step-title">What does your business do?</h3>
              <p className="wsw-microcopy">
                Pick your trade — expand it only if you want to fine-tune the exact NAICS codes.
              </p>
              <OnboardingTreePicker
                groups={workTree}
                sectionLabels={WORK_SECTION_LABELS}
                selection={workSel}
                onChange={setWorkSel}
                searchPlaceholder="Search a trade, industry, or NAICS code…"
                emptyLabel="No matching trades"
              />

              {/* B4 — escape hatch: search the full NAICS taxonomy directly. */}
              <div className="wsw-adhoc">
                {!showAdhocSearch ? (
                  <button
                    type="button"
                    className="wsw-adhoc-toggle"
                    onClick={() => setShowAdhocSearch(true)}
                  >
                    Search all NAICS codes
                  </button>
                ) : (
                  <div className="wsw-adhoc-panel">
                    <label className="wsw-adhoc-label" htmlFor="wsw-adhoc-input">
                      Other codes
                    </label>
                    <input
                      id="wsw-adhoc-input"
                      className="wsw-input"
                      placeholder="Search any NAICS code or description…"
                      value={adhocQuery}
                      onChange={(e) => runAdhocSearch(e.target.value)}
                    />
                    {adhocSearching && (
                      <div className="wsw-adhoc-loading">
                        <Loader2 size={12} className="ai-spin" aria-hidden /> Searching…
                      </div>
                    )}
                    <ul className="wsw-results">
                      {adhocResults.map((r) => (
                        <li key={r.code}>
                          <button
                            type="button"
                            className={`wsw-chip${adhocNaics.includes(r.code) ? " is-on" : ""}`}
                            onClick={() => toggleAdhoc(r.code)}
                          >
                            {r.description} <span className="wsw-code">{r.code}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {adhocNaics.length > 0 && (
                      <div className="wsw-selected">
                        {adhocNaics.map((c) => (
                          <span key={c} className="wsw-tag" onClick={() => toggleAdhoc(c)}>
                            {describeNaics(c) ?? c} ✕
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wsw-step">
              <h3 className="wsw-step-title">Where do you work?</h3>
              <p className="wsw-microcopy">Pick a state — expand it to choose specific cities.</p>
              <OnboardingTreePicker
                groups={STATE_TREE}
                selection={locSel}
                onChange={setLocSel}
                loadChildren={loadCityChildren}
                searchPlaceholder="Search a state or city…"
                emptyLabel="No matching places"
                childNoun={{ one: "city", many: "cities" }}
              />

              <div className="wsw-rungs" role="radiogroup" aria-label="Service area">
                {SERVICE_AREAS.map((a) => {
                  const active = serviceArea === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setServiceArea(a.id)}
                      className={`wsw-rung${active ? " is-active" : ""}`}
                    >
                      <strong>{rungLabel(a)}</strong>
                      <span className="wsw-rung-sub">{a.sublabel}</span>
                    </button>
                  );
                })}
              </div>
              <p className="wsw-honest-line">
                We'll start with your state(s) — tighter radius filtering is coming.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="wsw-step">
              <h3 className="wsw-step-title">Do any of these describe your business?</h3>
              <p className="wsw-microcopy">
                Check the categories that fit — each is a lane with fewer competitors. Expand one to
                pick specific programs. Not sure? Skip it; most contracts are open to all small
                businesses.
              </p>
              <OnboardingTreePicker
                groups={SET_ASIDE_TREE}
                sectionLabels={SET_ASIDE_SECTION_LABELS}
                selection={saSel}
                onChange={setSaSel}
                searchPlaceholder="Search a set-aside or code…"
                emptyLabel="No matching set-asides"
              />
            </div>
          )}

          <div className="wsw-actions">
            {step > 1 && (
              <button
                type="button"
                className="wsw-back"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                disabled={submitting}
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                className="wsw-next"
                disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
                onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              >
                Continue
              </button>
            )}
            {step === 3 && (
              <button type="button" className="wsw-next" disabled={submitting} onClick={finish}>
                {submitting ? "Loading…" : "Show me my opportunities"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
