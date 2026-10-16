// Grant's take — the bid/no-bid memo, rebuilt as one vertical spine: masthead →
// the call → why it helps / what limits it → what would change the call →
// Grant's thesis → the next move → the full analysis, one tap below. A hairline
// separates every band so the eye can land on a section without reading the one
// above it. The answer never streams — it is why the member opened the page;
// only the prose beneath it reveals.
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Ban,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  FileClock,
  HelpCircle,
  Scale,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import type {
  CoverageState,
  GrantAnalysis,
  Read,
  SectionCoverage,
  Verdict,
} from "../../lib/grant/types";
import { computeGates } from "../../lib/grant/computeGates";
import { computeRealDeadline } from "../../lib/grant/computeRealDeadline";
import { buildTake, type TakeItem } from "../../lib/grant/take";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { ComplianceMatrix } from "./ComplianceMatrix";
import { GateStrip } from "./GateStrip";
import { EvidencePin, RichLines, RichText, SkeletonRow } from "./primitives";
import { lineText } from "../../lib/grant/richText";
import { dfyService } from "../../lib/grant/dfyServices";
import { DFYServiceModal } from "../Opportunity/DFYServiceModal";
// DEMO: a "Have us do it" request stays in the demo store, so it is still there after a reload.
import { addDfyRequest } from "../../demo/grant/state";
import { useDemoState } from "../../demo/runtime/store";
import "./grant-demo.css";

const EPISTEMIC_LABEL: Record<Read["epistemic"], string> = {
  verified: "confirmed",
  stated: "stated in the solicitation",
  unknown: "I don't know yet",
};

/** "1 blocker", not "1 blockers". */
function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

function TakeCell({ item }: { item: TakeItem }) {
  return (
    <div className={`gt-cell gt-cell--${item.tone}`}>
      <p className="gt-cell__title">
        {item.tone === "ok" ? (
          <Check size={13} strokeWidth={3} aria-hidden />
        ) : item.tone === "blocked" ? (
          <Ban size={13} strokeWidth={2.5} aria-hidden />
        ) : (
          <AlertTriangle size={13} strokeWidth={2.5} aria-hidden />
        )}
        {item.title}
      </p>
      <p className="gt-cell__body">
        <RichText line={item.body} />
      </p>
      {item.pairs?.length ? (
        <dl className="gt-cell__pairs">
          {item.pairs.map((pr) => (
            <div key={pr.label}>
              <dt>{pr.label}</dt>
              <dd className="mono">{pr.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {item.evidence?.length ? (
        <span className="gt-cell__src">{item.evidence[0].label}</span>
      ) : null}
    </div>
  );
}

function VerdictGlyph({ value }: { value: Verdict }) {
  const Icon = value === "bid" ? Check : value === "review" ? Search : Ban;
  return <Icon size={22} strokeWidth={2.6} aria-hidden />;
}

/** DEMO: how many strengths show before "Show more". */
const STRENGTH_LIMIT = 5;

const REDUCED = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Section coverage — the A–M ledger shown in the glass box. Non-complete ("open
// coverage") states are flagged: they'd block a confident Bid (Red Team gate).
const COVERAGE_LABEL: Record<CoverageState, string> = {
  reviewed_complete: "Complete",
  reviewed_with_findings: "Findings",
  present_not_owned: "No owner",
  incorporated_by_reference: "By reference",
  attachment_dependent: "Attachment",
  incomplete: "Incomplete",
  not_applicable: "N/A",
  missing: "Missing",
};
const OPEN_COVERAGE = new Set<CoverageState>([
  "present_not_owned",
  "incorporated_by_reference",
  "attachment_dependent",
  "incomplete",
  "missing",
]);

function SectionCoverageView({ sections }: { sections: SectionCoverage[] }) {
  const open = sections.filter((s) => OPEN_COVERAGE.has(s.state)).length;
  return (
    <details className="grant-coverage">
      <summary>
        <ChevronRight size={15} strokeWidth={2} className="grant-coverage__chev" aria-hidden />
        Section coverage —{" "}
        <b>
          <span className="mono">{sections.length}</span> UCF sections reviewed
        </b>
        {open > 0 ? (
          <span className="grant-coverage__openflag">
            {" · "}
            <span className="mono">{open}</span> open
          </span>
        ) : null}
      </summary>
      <ul className="grant-coverage__list">
        {sections.map((s) => {
          const isOpen = OPEN_COVERAGE.has(s.state);
          return (
            <li key={s.section} className={`grant-coverage__row${isOpen ? " is-open" : ""}`}>
              <span className="grant-coverage__sec mono">{s.section}</span>
              <div className="grant-coverage__body">
                <span className="grant-coverage__title">
                  {s.title}{" "}
                  <span className="grant-coverage__owners mono">{s.owners.join(" ")}</span>
                </span>
                <span className="grant-coverage__finding">
                  <RichText line={s.finding} />
                </span>
              </div>
              <span
                className={`grant-coverage__state${isOpen ? " grant-coverage__state--open" : ""}`}
              >
                {COVERAGE_LABEL[s.state]}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/** One of the reads. When it carries a dossier, the whole line taps open to the
 *  fuller reasoning; the evidence pins stop the click so tapping a pin opens its
 *  provenance popover instead of toggling the read. */
function ReadRow({
  read: r,
  noticeId,
  sourcePath,
}: {
  read: Read;
  noticeId?: string;
  sourcePath?: string | null;
}) {
  const head = (
    <>
      <span
        className={`grant-epi grant-epi--${r.epistemic}`}
        title={EPISTEMIC_LABEL[r.epistemic]}
        aria-label={EPISTEMIC_LABEL[r.epistemic]}
      />
      <div className="grant-read__body">
        <span className="grant-read__name">{r.name}</span>
        <span className="grant-read__line">
          <RichText line={r.sentence} />
          {r.evidence.length > 0 ? (
            <span className="grant-read__pins" onClick={(e) => e.stopPropagation()}>
              {r.evidence.map((p, j) => (
                <EvidencePin
                  key={j}
                  pin={p}
                  claim={lineText(r.sentence)}
                  noticeId={noticeId}
                  sourcePath={sourcePath}
                />
              ))}
            </span>
          ) : null}
        </span>
      </div>
    </>
  );

  if (!r.dossier || r.dossier.length === 0) {
    return <div className="grant-read__static">{head}</div>;
  }

  return (
    <details className="grant-read__d">
      <summary className="grant-read__summary">
        {head}
        <ChevronRight size={15} strokeWidth={2} className="grant-read__chev" aria-hidden />
      </summary>
      <div className="grant-read__dossier">
        <RichLines lines={r.dossier} className="grant-read__dline" />
      </div>
    </details>
  );
}

/**
 * Loading placeholder for the grant_v2 canvas. Rendered while the live
 * GrantAnalysis is still being fetched so the cohort never flashes the v1
 * six-field take before the v2 canvas mounts. Reuses the canvas shell + shimmer
 * rows so the swap to the real canvas is in-place, not a layout jump.
 */
export function GrantCanvasSkeleton() {
  return (
    <section className="grant-canvas" aria-label="Grant's analysis" aria-busy="true">
      <div className="grant-stream" style={{ marginTop: 0 }}>
        <SkeletonRow w="42%" />
        <SkeletonRow w="90%" />
        <SkeletonRow w="74%" />
        <SkeletonRow w="82%" />
        <SkeletonRow w="58%" />
      </div>
    </section>
  );
}

/**
 * DEMO: the post-No-Bid roadmap. A No-Bid is never delivered cold: Grant lists, in
 * order, what to fix so that the next one fits. A gap that maps to a real service
 * gets "Have us do it". A strategy moment gets "Send to Mentor". The rest are plain.
 */
function PostNoBidRoadmap({
  items,
  onReviewWithMentor,
  mentorDisabledReason,
}: {
  items: NonNullable<GrantAnalysis["postNoBidRoadmap"]>;
  onReviewWithMentor?: () => void;
  mentorDisabledReason?: string | null;
}) {
  const [requested] = useDemoState<string[]>("grant.dfy", []);
  const [asking, setAsking] = useState<{ key: string; label: string; price: number } | null>(null);
  return (
    <section className="gt-roadmap" aria-label="What to fix so the next one fits">
      <h3 className="gt-kicker gt-kicker--rule">What to fix so the next one fits</h3>
      <ol className="gt-roadmap__list">
        {items.map((it, i) => {
          const svc = it.cta?.kind === "dfy" ? dfyService(it.cta.service) : null;
          const price = svc ? Number(/\$([\d,]+)/.exec(svc.price)?.[1]?.replace(/,/g, "") ?? 0) : 0;
          const key = svc ? `${i}-${svc.name}` : "";
          const done = key !== "" && requested.includes(key);
          return (
            <li key={i} className="gt-roadmap__item">
              <span className="gt-roadmap__n mono" aria-hidden>
                {i + 1}
              </span>
              <div className="gt-roadmap__body">
                <p className="gt-roadmap__title">
                  <RichText line={it.item} />
                </p>
                <p className="gt-roadmap__line">
                  <span className="gt-roadmap__label">Why it mattered</span>
                  <RichText line={it.whyItMattered} />
                </p>
                <p className="gt-roadmap__line">
                  <span className="gt-roadmap__label">What it takes</span>
                  <RichText line={it.whatItTakes} />
                </p>
                {svc ? (
                  done ? (
                    <span className="gt-roadmap__done">
                      <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden /> Requested. Our team will contact you within 1 business day.
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setAsking({ key, label: svc.name, price })}
                    >
                      Have us do it — {svc.price}
                    </button>
                  )
                ) : it.cta?.kind === "mentor" ? (
                  mentorDisabledReason ? (
                    <span title={mentorDisabledReason}>
                      <button type="button" className="btn btn-secondary btn-sm" disabled>
                        <Send size={13} strokeWidth={2} aria-hidden /> Send to Mentor
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onReviewWithMentor}>
                      <Send size={13} strokeWidth={2} aria-hidden /> Send to Mentor
                    </button>
                  )
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <DFYServiceModal
        open={asking !== null}
        onOpenChange={(o) => {
          if (!o) setAsking(null);
        }}
        prereqs={asking ? [{ key: asking.key, label: asking.label, why: "", dfyPrice: asking.price }] : []}
        total={asking?.price ?? 0}
        onSubmitted={() => {
          if (asking) addDfyRequest(asking.key);
        }}
        onConfirmed={() => setAsking(null)}
      />
    </section>
  );
}

/** The backend's label for the bid-flow primary action (build-grant-analysis.ts).
 *  This is the "not working" secondary CTA (Vikunja #24) — the /pipeline route it
 *  points at is a dead end, so for this case we render a working Save-for-Later
 *  toggle instead. The no-bid ("Back to your matches") variant keeps its real
 *  navigation. */
const START_BID_LABEL = "Start your bid";

/** The sub path's primary action ("Find a prime to team with") shows no button:
 *  its /pipeline?as=sub target is the same dead end, and nothing reads `as=sub`.
 *  A no-bid verdict wins over the path on the backend, so a no-bid on the sub
 *  path still shows "Back to your matches". */
const SUB_PATH = "sub";

export function GrantCanvas({
  analysis,
  onReviewWithMentor,
  mentorDisabledReason,
  onSaveForLater,
  saved = false,
  now,
  sourcePath,
}: {
  analysis: GrantAnalysis;
  onReviewWithMentor?: () => void;
  /** When set, the mentor-review CTA renders disabled with this as its `title`
   *  (e.g. the 3-day deadline gate — mirrors the header action button). */
  mentorDisabledReason?: string | null;
  /** Toggles the opportunity in the user's saved-for-later workspace. Wired by the
   *  route so it shares state with the header Save button. */
  onSaveForLater?: () => void;
  /** Whether this opportunity is currently saved for later. */
  saved?: boolean;
  /** "Today" for the deadline countdown. The live (grant_v2) path passes the real
   *  clock so the runway is real; omitting it uses the shared mock NOW anchor. */
  now?: Date;
  /** The issuing agency's posting URL for this opportunity (`sourcePath`). Every
   *  evidence pin inherits it so a solicitation citation we hold no passage for
   *  can still open the real source. HigherGov, our vendor, is never that source
   *  — `agencySource` rejects it. */
  sourcePath?: string | null;
}) {
  // Initializer is SSR-deterministic (data only, no window read) so hydration
  // matches; the reduced-motion check lives in the effect (client-only).
  //
  // Must stay idempotent. The server renders the skeleton, so this effect is
  // the ONLY thing that reveals the verdict text — if it ever declines to arm
  // the timer, the member is left looking at grey bars forever. A `started`
  // ref used to guard this "run once"; the guard was both redundant (streaming
  // only ever goes true→false, so the arm already happens at most once) and
  // harmful: when the effect re-ran on the same instance — a Suspense or
  // offscreen remount, and this route is lazy-wrapped — the ref survived, the
  // timer did not, and nothing re-armed it.
  const [streaming, setStreaming] = useState(analysis.meta.stage === "complete");
  useEffect(() => {
    if (!streaming) return;
    if (REDUCED()) {
      setStreaming(false);
      return;
    }
    const id = setTimeout(() => setStreaming(false), 950);
    return () => clearTimeout(id);
  }, [streaming]);

  const deadline = useMemo(
    () => computeRealDeadline(analysis.realDeadlineInputs, now),
    [analysis, now],
  );
  const gates = useMemo(
    () => computeGates(analysis.complianceMatrix, deadline, analysis.meta.noticeType),
    [analysis, deadline],
  );
  const reads = useMemo(() => [...analysis.reads].sort((a, b) => a.order - b.order), [analysis]);
  const { verdict, action } = analysis;
  // DEMO: the mentor button uses the brief's own wording when the analysis has it.
  const mentorLabel = action.secondaries.find((x) => x.target === "mentor")?.label ?? "Review with mentor";

  const take = useMemo(() => buildTake(analysis, gates, deadline), [analysis, gates, deadline]);
  const [showAllStrengths, setShowAllStrengths] = useState(false);

  return (
    <section className="grant-canvas" aria-label="Grant's analysis">
      {/* ── Masthead: who is talking, how much work it took, how fresh ── */}
      <header className="gt-head">
        <div className="gt-head__id">
          <AgentAvatar agent="grant" size={28} />
          <span className="gt-head__label">Grant's take</span>
        </div>
        <span className="gt-head__meta">
          <span className="mono">{analysis.meta.checksRun}</span> checks ·{" "}
          <span className="mono">{analysis.meta.sourcesConsulted}</span> sources
        </span>
        <span className="gt-head__fresh">
          <RichText line={analysis.meta.freshnessLine} />
        </span>
      </header>

      {/* Amendment — the notice changed and Grant re-ran; one tap shows what moved. */}
      {analysis.amendment ? (
        <details className="gt-amend">
          <summary className="gt-amend__summary">
            <FileClock size={14} strokeWidth={2} aria-hidden />
            <span>
              <b>{analysis.amendment.label}</b> · posted {analysis.amendment.postedAt} · included in
              this analysis
            </span>
            <span className="gt-amend__toggle">
              See what changed
              <ArrowRight size={13} strokeWidth={2} aria-hidden />
            </span>
          </summary>
          <div className="gt-amend__body">
            <p>
              <RichText line={analysis.amendment.summary} />
            </p>
            <p className="gt-amend__impact">
              <RichText line={analysis.amendment.impact} />
            </p>
          </div>
        </details>
      ) : null}

      {/* Degraded run — a source was unreachable; say so, don't fake completeness. */}
      {analysis.degradation ? (
        <div className="grant-degraded" role="status">
          <AlertTriangle size={15} strokeWidth={2} className="grant-degraded__icon" aria-hidden />
          <div className="grant-degraded__body">
            <p className="grant-degraded__line">
              I couldn't reach <b>{analysis.degradation.source}</b> —{" "}
              <RichText line={analysis.degradation.affected} />
            </p>
          </div>
        </div>
      ) : null}

      {/* ── THE CALL ── */}
      <div className="gt-call">
        <div className="gt-call__row">
          <div className="gt-call__main">
            {/* The answer never streams — it is why the member opened the page.
                Only the prose below it reveals. */}
            <span className="gt-kicker gt-kicker--rule">Grant's call</span>
            <p className="gt-call__word">
              <span className={`grant-chip grant-chip--${take.tone}`}>
                <VerdictGlyph value={verdict.value} />
                {take.callWord}
              </span>
            </p>
          </div>
          <div className="gt-conf">
            <span className="gt-kicker">Confidence</span>
            <span
              className="gt-conf__dots"
              role="img"
              aria-label={`Confidence: ${take.confidence.level}`}
            >
              {Array.from({ length: take.confidence.of }).map((_, k) => (
                <span
                  key={k}
                  className={`gt-conf__dot${k < take.confidence.filled ? " is-on" : ""}`}
                  aria-hidden
                />
              ))}
            </span>
            <span className="gt-conf__word">{take.confidence.level}</span>
          </div>
        </div>

        <div className="gt-paths">
          {take.paths.map((pth) => (
            <div key={pth.label} className={`gt-path gt-path--${pth.state}`}>
              <span className="gt-kicker">{pth.label}</span>
              <span className="gt-path__state">
                {pth.state === "go" ? (
                  <Check size={15} strokeWidth={3} aria-hidden />
                ) : pth.state === "no-go" ? (
                  <Ban size={15} strokeWidth={2.5} aria-hidden />
                ) : (
                  <HelpCircle size={15} strokeWidth={2.5} aria-hidden />
                )}
                {pth.state === "go" ? "Go" : pth.state === "no-go" ? "No-go" : "Not yet"}
              </span>
            </div>
          ))}
        </div>

        {streaming ? (
          <div className="grant-stream">
            <SkeletonRow w="88%" />
            <SkeletonRow w="64%" />
          </div>
        ) : take.summary ? (
          <p className="gt-call__summary">
            <RichText line={take.summary} />
          </p>
        ) : null}

        <p className="gt-tally">
          <span className="mono">{take.counts.strengths}</span>{" "}
          {plural(take.counts.strengths, "strength", "strengths")} ·{" "}
          <span className="mono">{take.counts.blockers}</span>{" "}
          {plural(take.counts.blockers, "blocker", "blockers")} ·{" "}
          <span className="mono">{take.counts.risks}</span>{" "}
          {plural(take.counts.risks, "risk", "risks")}
        </p>
      </div>

      {/* ── Two columns: what helps, what limits ── */}
      <div className="gt-cols">
        <section className="gt-col gt-col--pos" aria-label="Why Grant likes it">
          <h3 className="gt-kicker gt-kicker--rule gt-col__h">Why Grant likes it</h3>
          {take.strengths.length === 0 ? (
            <p className="gt-empty">Nothing scored as a clear strength yet.</p>
          ) : (
            (showAllStrengths ? take.strengths : take.strengths.slice(0, STRENGTH_LIMIT)).map((it, k) => (
              <TakeCell key={k} item={it} />
            ))
          )}
          {/* DEMO: a long list of met requirements made this column three times the height of the
              other. The first few stay open, and the rest are one tap away. */}
          {take.strengths.length > STRENGTH_LIMIT ? (
            <button
              type="button"
              className="gt-more"
              aria-expanded={showAllStrengths}
              onClick={() => setShowAllStrengths((v) => !v)}
            >
              {showAllStrengths ? "Show fewer" : `Show ${take.strengths.length - STRENGTH_LIMIT} more`}
              <ChevronRight size={14} strokeWidth={2} className={showAllStrengths ? "gt-more__chev is-open" : "gt-more__chev"} aria-hidden />
            </button>
          ) : null}
        </section>
        <section className="gt-col gt-col--neg" aria-label="What limits the opportunity">
          <h3 className="gt-kicker gt-kicker--rule gt-col__h">What limits the opportunity</h3>
          {take.limits.length === 0 ? (
            <p className="gt-empty">Nothing is holding this one back.</p>
          ) : (
            take.limits.map((it, k) => <TakeCell key={k} item={it} />)
          )}
        </section>
      </div>

      {/* ── What would move the call ── */}
      <section className="gt-change" aria-label="What would change Grant's call">
        <h3 className="gt-kicker gt-kicker--rule">What would change Grant's call?</h3>
        {take.changes.map((c) => (
          <div key={c.path} className={`gt-change__row gt-change__row--${c.state}`}>
            <span className="gt-change__path">{c.path}</span>
            <span className="gt-change__state">
              {c.state === "go" ? (
                <Check size={14} strokeWidth={3} aria-hidden />
              ) : (
                <Ban size={14} strokeWidth={2.5} aria-hidden />
              )}
              {c.headline}
            </span>
            <p className="gt-change__reason">
              <RichText line={c.reason} />
            </p>
          </div>
        ))}
        {/* DEMO: the conditions that would move the call, in Grant's words. */}
        {take.wouldChange.length > 0 ? (
          <div className="gt-change__ifs">
            <span className="gt-change__ifslabel">
              <Compass size={13} strokeWidth={2} aria-hidden /> I would change this call if
            </span>
            <ul>
              {take.wouldChange.map((ln, k) => (
                <li key={k}>
                  <RichText line={ln} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ── The thesis, in Grant's own words ── */}
      {take.thesis.length > 0 ? (
        <section className="gt-thesis" aria-label="Grant's thesis">
          <h3 className="gt-kicker gt-kicker--rule">Grant's thesis</h3>
          {take.thesis.map((ln, k) => (
            <p key={k} className="gt-thesis__line">
              <RichText line={ln} />
            </p>
          ))}
        </section>
      ) : null}

      {/* DEMO: a No-Bid is never delivered cold. */}
      {analysis.postNoBidRoadmap && analysis.postNoBidRoadmap.length > 0 ? (
        <PostNoBidRoadmap
          items={analysis.postNoBidRoadmap}
          onReviewWithMentor={onReviewWithMentor}
          mentorDisabledReason={mentorDisabledReason}
        />
      ) : null}

      {/* ── The next move ── */}
      <section className="gt-next" aria-label="Recommended next move">
        <h3 className="gt-kicker gt-kicker--rule">Recommended next move</h3>
        {take.next ? (
          <>
            <p className="gt-next__title">{take.next.title}</p>
            {take.next.body ? (
              <p className="gt-next__body">
                <RichText line={take.next.body} />
              </p>
            ) : null}
            {/* DEMO: the story's next move is the filled primary button. A mentor
                review is the secondary beside it, worded as the brief words it
                ("Send to Sarah for a second opinion"). Production made the mentor
                review the filled primary on every verdict. */}
            <div className="gt-next__actions">
              {action.primary.label === START_BID_LABEL ? (
                <button
                  type="button"
                  className="btn btn-primary gt-next__btn"
                  onClick={onSaveForLater}
                  aria-pressed={saved}
                >
                  {saved ? (
                    <BookmarkCheck size={15} strokeWidth={2} aria-hidden />
                  ) : (
                    <Bookmark size={15} strokeWidth={2} aria-hidden />
                  )}
                  {saved ? "Saved for later" : "Save for Later"}
                </button>
              ) : action.path === SUB_PATH && verdict.value !== "no-bid" && !/^\/partners\b/.test(action.primary.target) ? null : (
                <a className="btn btn-primary gt-next__btn" href={action.primary.target}>
                  {take.next.title}
                  <ArrowRight size={15} strokeWidth={2} aria-hidden />
                </a>
              )}
              {mentorDisabledReason ? (
                <span title={mentorDisabledReason}>
                  <button type="button" className="btn btn-secondary gt-next__btn" disabled>
                    <Send size={14} strokeWidth={2} aria-hidden />
                    {mentorLabel}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary gt-next__btn"
                  onClick={onReviewWithMentor}
                >
                  <Send size={14} strokeWidth={2} aria-hidden />
                  {mentorLabel}
                </button>
              )}
              {action.secondaries
                .filter((s) => s.target !== "mentor")
                .map((s) => (
                  <a key={s.label} className="btn btn-ghost gt-next__btn" href={s.target}>
                    {s.label}
                  </a>
                ))}
            </div>
          </>
        ) : null}
        <p className="grant-action__ainote">
          <Sparkles size={12} strokeWidth={2} aria-hidden /> AI can make mistakes — a mentor review
          is the safest next step before you decide.
        </p>
      </section>

      {/* The full analysis, one tap below. The typed warnings + competitive position
          in the call already carry the "why" at a glance, so no separate Why strip. */}
      <div className="grant-why">
        <details className="grant-full">
          <summary className="grant-full__summary">
            <ChevronRight size={15} strokeWidth={2} className="grant-full__chev" aria-hidden />
            See the full analysis
          </summary>
          <div className="grant-full__body">
            <GateStrip
              gates={gates}
              deadline={deadline}
              noticeId={analysis.opportunityId}
              sourcePath={sourcePath}
            />

            <ComplianceMatrix
              rows={analysis.complianceMatrix}
              noticeId={analysis.opportunityId}
              sourcePath={sourcePath}
            />

            <ol className="grant-reads">
              {reads.map((r) => (
                <li
                  key={r.id}
                  className={`grant-read grant-read--${r.status}${r.limiting ? " is-limiting" : ""}`}
                >
                  <ReadRow noticeId={analysis.opportunityId} sourcePath={sourcePath} read={r} />
                </li>
              ))}
            </ol>

            {/* The Red Team — what Grant argued with himself about. Trust is built
                by showing the objections, not hiding them. */}
            {analysis.redTeam && analysis.redTeam.length > 0 ? (
              <details className="grant-redteam">
                <summary>
                  <ChevronRight
                    size={15}
                    strokeWidth={2}
                    className="grant-redteam__chev"
                    aria-hidden
                  />
                  <Scale size={14} strokeWidth={2} className="grant-redteam__icon" aria-hidden />
                  What I argued with myself about —{" "}
                  <b>
                    <span className="mono">{analysis.redTeam.length}</span> challenges
                  </b>
                </summary>
                <ul className="grant-redteam__list">
                  {analysis.redTeam.map((o, i) => (
                    <li key={i} className="grant-redteam__item">
                      <p className="grant-redteam__q">
                        <RichText line={o.challenge} />
                      </p>
                      <p className="grant-redteam__a">
                        <RichText line={o.resolution} />
                      </p>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            <details className="grant-trail">
              <summary>
                <ChevronRight size={15} strokeWidth={2} className="grant-trail__chev" aria-hidden />
                How I got here —{" "}
                <b>
                  <span className="mono">{analysis.meta.checksRun}</span> checks across{" "}
                  <span className="mono">{analysis.meta.sourcesConsulted}</span> sources
                </b>
              </summary>
              <div className="grant-trail__body">
                {analysis.trail.map((group) => (
                  <div className="grant-trail__group" key={group.title}>
                    <div className="grant-trail__grouphead">
                      {group.title}
                      <span className="mono">{group.checkCount} checks</span>
                    </div>
                    <ul>
                      {group.items.map((it, i) => (
                        <li key={i} className={`grant-trail__item grant-trail__item--${it.glyph}`}>
                          <span className="grant-trail__text">
                            <RichText line={it.text} />
                          </span>
                          <span className="grant-trail__src mono">{it.source}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {verdict.headline.length > 0 ? (
                  <div className="grant-trail__group">
                    <div className="grant-trail__grouphead">The full read</div>
                    <RichLines lines={verdict.headline} className="grant-trail__prose" />
                  </div>
                ) : null}
              </div>
            </details>

            {/* Section-Coverage ledger — proof the whole solicitation was reviewed;
                open-coverage rows flagged. Collapsed by default like the trail. */}
            {analysis.sectionCoverage && analysis.sectionCoverage.length > 0 ? (
              <SectionCoverageView sections={analysis.sectionCoverage} />
            ) : null}
          </div>
        </details>
      </div>
    </section>
  );
}
