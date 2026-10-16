// Grant's read of a forecast, in the skeleton of the Grant page on Opportunities
// (src/components/Grant/GrantCanvas.tsx), with the same classes so the two pages read
// as one product. v5: four boxes, each answering one question.
//   · Grant's call — should I go after it, which way, and how sure is Grant?
//   · What works for you / What holds you back — the member's strengths and gaps.
//   · Still unknown — facts about the job nobody knows yet, and how they settle.
//   · How to win it — how the buyer picks, who you compete with, what it takes.
// A box with nothing to add is not shown. There is no summary line, tally, next move
// or folded analysis: each repeated a box (v5 §04).

import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Check,
  CircleDashed,
  ExternalLink,
  HelpCircle,
  Minus,
  Search,
} from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { RichText } from "../Grant/primitives";
import { OurRead } from "./OurRead";
import {
  rich,
  stepNumbers,
  unknownChip,
  watchTrackLine,
  type ForecastRead,
  type ReadCell,
  type TakeCount,
} from "../../lib/forecasts/grant";
import {
  CALL,
  CONFIDENCE_WORD,
  PATH,
  PATH_STATE,
  TAKE,
  UNKNOWN_COPY,
  WIN,
  type PathState,
} from "../../lib/forecasts/grantCopy";
import type { WatchCopyState } from "../../lib/forecasts/watch";

const DOTS = { high: 5, medium: 3, low: 1 } as const;

function CallGlyph({ call }: { call: ForecastRead["call"] }) {
  const Icon = call === "prepare" ? Check : call === "review" ? Search : Ban;
  return <Icon size={22} strokeWidth={2.6} aria-hidden />;
}

function PathGlyph({ state }: { state: PathState }) {
  if (state === "go") return <Check size={15} strokeWidth={3} aria-hidden />;
  if (state === "no_go") return <Ban size={15} strokeWidth={2.5} aria-hidden />;
  if (state === "not_needed") return <Minus size={15} strokeWidth={2.5} aria-hidden />;
  return <HelpCircle size={15} strokeWidth={2.5} aria-hidden />;
}

/** Scrolls to a Get ready step and marks it, so "Can fix" always lands somewhere. */
function goToStep(id: string) {
  const el = document.getElementById(`fc-step-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("is-flash");
  // Restart the highlight on a repeat click.
  void el.offsetWidth;
  el.classList.add("is-flash");
}

function Cell({ cell, steps }: { cell: ReadCell; steps: Map<string, number> }) {
  const tone = cell.kind === "strength" ? "ok" : cell.kind === "blocker" ? "blocked" : "warn";
  const stepNo = cell.fix?.kind === "yes" ? steps.get(cell.fix.step) : undefined;
  return (
    <div className={`gt-cell gt-cell--${tone}`}>
      <p className="gt-cell__title">
        {tone === "ok" ? (
          <Check size={13} strokeWidth={3} aria-hidden />
        ) : tone === "blocked" ? (
          <Ban size={13} strokeWidth={2.5} aria-hidden />
        ) : (
          <AlertTriangle size={13} strokeWidth={2.5} aria-hidden />
        )}
        {cell.title}
      </p>
      {cell.body && (
        <p className="gt-cell__body">
          <RichText line={rich(cell.body)} />
        </p>
      )}
      {cell.term && <span className="fc-cell__term">{cell.term}</span>}
      {(cell.sources?.length || cell.fix) && (
        <div className="fc-cell__foot">
          {cell.sources?.map((s) => (
            <span key={s} className="fc-src">
              {s}
            </span>
          ))}
          {/* A fix whose step is not on the page says nothing, rather than point nowhere. */}
          {cell.fix?.kind === "yes" && stepNo !== undefined && (
            <>
              <span className="fc-fix fc-fix--yes">
                <Check size={12} strokeWidth={2.6} aria-hidden />
                {TAKE.canFix}
              </span>
              <button
                type="button"
                className="fc-textlink fc-fix__step"
                aria-label={TAKE.stepLabel(stepNo)}
                onClick={() => cell.fix?.kind === "yes" && goToStep(cell.fix.step)}
              >
                {TAKE.step(stepNo)}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** A take row's basis and source, one pair per counted figure, then the row's own line
 *  that says what its counts are over and that none is about this forecast (ledger A3). */
function TakeBasis({ counted, note }: { counted: TakeCount[]; note?: string }) {
  return (
    <span className="fc-take-basis">
      {counted.map((c) => (
        <span key={c.basis} className="fc-take-basis__line">
          <span className="fc-take-basis__count">{c.basis}</span>{" "}
          <span className="fc-take-basis__src">{c.source}</span>
        </span>
      ))}
      {note && <span className="fc-take-basis__note">{note}</span>}
    </span>
  );
}

export function ForecastGrantTake({
  read,
  asks,
  canRaise,
  tracked,
  watchState,
  onAnswerGrant,
}: {
  read: ForecastRead;
  /** The forecast is tracked, so the pointer to Track this is not needed. */
  tracked: boolean;
  /** What the page may promise about watching (ARCHITECTURE-forecasts-watch.md §11). */
  watchState: WatchCopyState;
  /** Grant still has questions for the member, so confidence can go up. */
  asks: boolean;
  /** An open question could move a way in, so answering could raise confidence. */
  canRaise: boolean;
  onAnswerGrant: () => void;
}) {
  const call = CALL[read.call];
  const closed = read.call === "closed";
  const steps = stepNumbers(read);
  const trackLine = watchTrackLine(read.unknowns, tracked, watchState);

  return (
    <section className="grant-canvas fc-take" aria-label={TAKE.label} id="grant-take">
      <header className="gt-head">
        <div className="gt-head__id">
          <AgentAvatar agent="grant" size={28} />
          <span className="gt-head__label">{TAKE.label}</span>
        </div>
      </header>

      {/* ── Grant's call ── */}
      <div className="gt-call">
        <div className="gt-call__row">
          <div className="gt-call__main">
            <span className="gt-kicker gt-kicker--rule">{TAKE.call}</span>
            <p className="gt-call__word">
              <span className={`grant-chip grant-chip--${call.tone}`}>
                <CallGlyph call={read.call} />
                {call.word}
              </span>
            </p>
          </div>
          {!closed && (
            <div className="gt-conf fc-conf">
              <span className="gt-kicker">{TAKE.confidence}</span>
              <span
                className="gt-conf__dots"
                role="img"
                aria-label={`${TAKE.confidence}: ${CONFIDENCE_WORD[read.confidence]}`}
              >
                {Array.from({ length: 5 }).map((_, k) => (
                  <span
                    key={k}
                    className={`gt-conf__dot${k < DOTS[read.confidence] ? " is-on" : ""}`}
                    aria-hidden
                  />
                ))}
              </span>
              <span className="gt-conf__word">{CONFIDENCE_WORD[read.confidence]}</span>
              {asks && (
                <button
                  type="button"
                  className="fc-textlink fc-conf__raise"
                  onClick={onAnswerGrant}
                >
                  {canRaise ? TAKE.raise : TAKE.answerQuestions}{" "}
                  <ArrowRight size={13} aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>

        {closed ? (
          <p className="fc-call__closed">{read.paths[0]?.why}</p>
        ) : (
          <div className="gt-paths fc-paths">
            {read.paths.map((p) => (
              <div
                key={p.key}
                className={`gt-path fc-path fc-path--${p.state}${p.best ? " is-best" : ""}`}
              >
                <div className="fc-path__top">
                  <span className="gt-kicker fc-path__term">{PATH[p.key].term}</span>
                  {p.best && <span className="fc-path__best">{TAKE.bestWayIn}</span>}
                </div>
                <span className="fc-path__plain">{PATH[p.key].plain}</span>
                <span className="gt-path__state fc-path__state">
                  <PathGlyph state={p.state} />
                  {PATH_STATE[p.state]}
                </span>
                <p className="fc-path__why">{p.why}</p>
              </div>
            ))}
          </div>
        )}
        {!closed && read.pathsNote && <p className="fc-paths__note">{read.pathsNote}</p>}
      </div>

      {/* ── What works for you / What holds you back ── */}
      {!closed && (
        <div className="gt-cols">
          <section className="gt-col gt-col--pos" aria-label={TAKE.likes}>
            <h3 className="gt-kicker gt-kicker--rule gt-col__h">{TAKE.likes}</h3>
            {read.strengths.length === 0 ? (
              <p className="gt-empty">{TAKE.noLikes}</p>
            ) : (
              read.strengths.map((c) => <Cell key={c.title} cell={c} steps={steps} />)
            )}
          </section>
          <section className="gt-col gt-col--neg" aria-label={TAKE.limits}>
            <h3 className="gt-kicker gt-kicker--rule gt-col__h">{TAKE.limits}</h3>
            {read.limits.length === 0 ? (
              <p className="gt-empty">{TAKE.noLimits}</p>
            ) : (
              read.limits.map((c) => <Cell key={c.title} cell={c} steps={steps} />)
            )}
          </section>
        </div>
      )}

      {/* ── Still unknown ── */}
      {read.unknowns.length > 0 && (
        <section className="fc-unknown" aria-labelledby="fc-unknown-title">
          <h3 id="fc-unknown-title" className="gt-kicker gt-kicker--rule fc-unknown__title">
            {UNKNOWN_COPY.title}
          </h3>
          <ul className="fc-unknown__list">
            {read.unknowns.map((u) => {
              const chip = unknownChip(u, tracked, watchState);
              return (
                <li key={u.label}>
                  <CircleDashed size={15} aria-hidden className="fc-unknown__icon" />
                  <span className="fc-unknown__label">
                    {u.label}
                    {u.note && <small>{u.note}</small>}
                  </span>
                  <span className={`fc-how fc-how--${chip.how}`}>{chip.text}</span>
                </li>
              );
            })}
          </ul>
          {trackLine && <p className="fc-unknown__track">{trackLine}</p>}
        </section>
      )}

      {/* ── How to win it ── */}
      {read.win.length > 0 && (
        <section className="gt-thesis fc-win" aria-labelledby="fc-win-title">
          <h3 id="fc-win-title" className="gt-kicker gt-kicker--rule">
            {WIN.title}
          </h3>
          <dl className="fc-win__rows">
            {read.win.map((row) => (
              <div key={row.key} className="fc-win__row">
                <dt>{WIN.rows[row.key]}</dt>
                <dd>
                  <RichText line={rich(row.body)} />
                  {row.ourRead && <OurRead why={row.why} />}
                  {row.counted && row.counted.length > 0 && (
                    <TakeBasis counted={row.counted} note={row.countsNote} />
                  )}
                  {(row.sources?.length || row.link) && (
                    <span className="fc-cell__foot">
                      {row.sources?.map((s) => (
                        <span key={s} className="fc-src">
                          {s}
                        </span>
                      ))}
                      {row.link && (
                        <a
                          className="fc-textlink"
                          href={row.link.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.link.label} <ExternalLink size={12} aria-hidden />
                        </a>
                      )}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </section>
  );
}
