// The agent workspace's frame primitives (components.css, "AGENT WORKSPACE
// PRIMITIVES"): the phase stepper, the "showing you" panel, a hole in a
// document, the checklist rail that folds to a strip, and the status marks.
// Generic: the words come from the caller.

import type { ReactNode } from "react";
import { Check, ChevronRight, Lock, Menu, PanelRightClose, PanelRightOpen } from "lucide-react";

// ─── Status marks ───

export type MarkKind = "done" | "need" | "now" | "next" | "lock";

/** Done (a tick), needs her (a dashed blue ring), working (an amber pulse),
 *  not yet (a dashed grey ring), or locked (a file Ava cannot open). */
export function StatusMark({ kind, small }: { kind: MarkKind; small?: boolean }) {
  return (
    <span className={`ds-ic ds-ic--${kind}${small ? " ds-ic--sm" : ""}`} aria-hidden>
      {kind === "done" ? <Check /> : kind === "now" ? <i /> : kind === "lock" ? <Lock /> : null}
    </span>
  );
}

// ─── The phase stepper ───

export type StepState = "done" | "now" | "wait" | "paused" | "next" | "opt" | "human";

export interface StepperStep {
  label: string;
  state: StepState;
  sub?: string;
}

export interface StepperPhase {
  label: string;
  /** How many of the steps belong to this phase, in order. */
  steps: number;
}

/** Steps grouped under phase captions. Finished steps tick; the current one
 *  pulses amber while the agent works, and is blue while it waits on her. */
export function PhaseStepper({
  phases,
  steps,
  current,
  compact,
}: {
  phases: StepperPhase[];
  steps: StepperStep[];
  /** The phase she is in, from 1. */
  current: number;
  /** One small row: no phase captions, smaller dots and words. The dashed
   *  line between phases stays, and the captions are read to a screen
   *  reader. For a workspace that gives its height to the work itself. */
  compact?: boolean;
}) {
  const cols = `repeat(${steps.length}, minmax(0, 1fr))`;
  let from = 1;
  const starts = new Set<number>();
  const now =
    steps.find((s) => s.state === "now" || s.state === "wait" || s.state === "human") ?? null;
  const caps = phases.map((p, i) => {
    const col = `${from} / ${from + p.steps}`;
    if (i > 0) starts.add(from - 1);
    from += p.steps;
    return { ...p, col, on: i + 1 === current, n: i + 1 };
  });
  return (
    <div className={`ds-stepper${compact ? " ds-stepper--sm" : ""}`}>
      {compact ? null : (
        <div className="ds-phases" style={{ gridTemplateColumns: cols }}>
          {caps.map((p) => (
            <span
              key={p.label}
              className={`ds-phases__cap${p.on ? " is-on" : ""}`}
              style={{ gridColumn: p.col }}
            >
              <span className="mono">{p.n}</span> {p.label}
            </span>
          ))}
        </div>
      )}
      <ol
        className="ds-steps"
        style={{ gridTemplateColumns: cols }}
        aria-label={compact ? caps.map((p) => `${p.n}. ${p.label}`).join(", then ") : undefined}
      >
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={`ds-step is-${s.state}${starts.has(i) ? " is-phase-start" : ""}`}
            aria-current={s.state === "now" || s.state === "wait" ? "step" : undefined}
          >
            <span className="ds-step__dot" aria-hidden>
              {s.state === "done" ? (
                <Check />
              ) : s.state === "next" || s.state === "opt" ? null : (
                <i />
              )}
            </span>
            <span className="ds-step__l">{s.label}</span>
            {s.sub ? <span className="ds-step__s">{s.sub}</span> : null}
          </li>
        ))}
      </ol>
      {/* Compact, on a phone: the dots alone, and one line for the step she
          is on (the columns are too narrow for words). */}
      {compact && now ? (
        <p className={`ds-stepper__now is-${now.state}`} aria-hidden>
          {now.label}
          {now.sub ? <span> · {now.sub}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

// ─── "Showing you" ───

/** What the agent is reading, asking about or writing at this moment. */
export function ShowPanel({
  label,
  title,
  children,
}: {
  /** "Ava is showing you". */
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="ds-show" aria-label={`${label}: ${title}`}>
      <div className="ds-show__h">
        <span className="ds-show__l">
          <i aria-hidden />
          {label}
        </span>
        <b className="ds-show__t">{title}</b>
      </div>
      <div className="ds-show__b">{children}</div>
    </aside>
  );
}

// ─── A hole ───

/** A part of her document waiting on her input. Tapping it opens its ask. */
export function Hole({
  title,
  line,
  act,
  on,
  onOpen,
}: {
  title: string;
  line?: string;
  /** "Add your permit", "Answer it". */
  act: string;
  on?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={`ds-hole${on ? " is-on" : ""}`}
      aria-pressed={on}
      onClick={onOpen}
    >
      <b>{title}</b>
      {line ? <span className="ds-hole__p">{line}</span> : null}
      <span className="ds-hole__act">
        {act} <ChevronRight size={14} aria-hidden />
      </span>
    </button>
  );
}

/** A blank inside a sentence: the words she fills. */
export function InlineHole({
  children,
  on,
  label,
  onOpen,
}: {
  children: ReactNode;
  on?: boolean;
  label: string;
  onOpen: () => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={on}
      className={`ds-hole ds-hole--inline${on ? " is-on" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {children}
    </span>
  );
}

// ─── A side panel that folds to a strip (the right-hand twin of the rail) ───

/** The panel folded: a button to open it (its name is the button's label and
 *  hover hint, never sideways words), and a blue dot when something in it
 *  needs her, so nothing waits unseen. */
export function FoldedSide({
  label,
  onOpen,
  needs,
}: {
  label: string;
  onOpen: () => void;
  needs?: boolean;
}) {
  return (
    <aside className="ds-side ds-side--closed" aria-label={label}>
      <button
        type="button"
        className="ds-side__btn"
        aria-label={`Open: ${label}${needs ? ". Something here needs you" : ""}`}
        aria-expanded={false}
        title={`Open: ${label}`}
        onClick={onOpen}
      >
        <PanelRightOpen size={18} aria-hidden />
        {needs ? <span className="ds-side__dot" aria-hidden /> : null}
      </button>
    </aside>
  );
}

/** The handle that folds the panel, on the line between the page and the
 *  panel. The page sets `--side-w` to the panel's width. */
export function SideFold({ label, onFold }: { label: string; onFold: () => void }) {
  return (
    <button
      type="button"
      className="ds-side__fold"
      aria-label={`Fold: ${label}`}
      aria-expanded
      onClick={onFold}
    >
      <PanelRightClose size={15} aria-hidden />
    </button>
  );
}

// ─── The checklist rail ───

export interface RailRowSpec {
  key: string;
  title: string;
  act?: string;
  mark: MarkKind;
  onOpen?: () => void;
}

/** A checklist that folds to a thin strip with a menu button and its count,
 *  like Gmail's. Open: its title, the count, and its groups. */
export function FoldRail({
  open,
  onToggle,
  title,
  count,
  empty,
  groups,
  foot,
  openCount,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  /** The short count on the strip: "15/36". */
  count: string;
  /** The count in words once open: "15 of 36 filled". Default: `count`. */
  openCount?: string;
  /** Shown when there are no groups yet. */
  empty?: string;
  groups: { h: string; rows: RailRowSpec[]; needs?: boolean }[];
  foot?: ReactNode;
  /** A richer body in place of the groups (a detailed checklist). */
  children?: ReactNode;
}) {
  if (!open) {
    return (
      <aside className="ds-rail ds-rail--closed" aria-label={title}>
        <button
          type="button"
          className="ds-rail__btn"
          aria-label={`Open: ${title}`}
          aria-expanded={false}
          onClick={onToggle}
        >
          <Menu size={20} aria-hidden />
        </button>
        {count ? <span className="ds-rail__count">{count}</span> : null}
      </aside>
    );
  }
  return (
    <aside className="ds-rail" aria-label={title}>
      <div className="ds-rail__head">
        <button
          type="button"
          className="ds-rail__btn"
          aria-label={`Fold: ${title}`}
          aria-expanded
          onClick={onToggle}
        >
          <Menu size={20} aria-hidden />
        </button>
        <h2>{title}</h2>
        {count ? <span className="ds-rail__count">{openCount ?? count}</span> : null}
      </div>
      <div className="ds-rail__body">
        {groups.length === 0 && !children && empty ? (
          <p className="ds-show__note">{empty}</p>
        ) : null}
        {children}
        {(children ? [] : groups).map((g) => (
          <div key={g.h} className="ds-rail__grp">
            <div className="ds-rail__gh">{g.h}</div>
            <div className={g.needs ? "ds-rail__needs" : undefined}>
              {g.rows.map((r) => {
                const inner = (
                  <>
                    <StatusMark kind={r.mark} />
                    <span>{g.needs ? <b>{r.title}</b> : r.title}</span>
                    {r.act ? (
                      <span className={`ds-rail__act${g.needs ? "" : " ds-rail__act--quiet"}`}>
                        {r.act}
                      </span>
                    ) : (
                      <span />
                    )}
                  </>
                );
                return r.onOpen ? (
                  <button key={r.key} type="button" className="ds-rail__row" onClick={r.onOpen}>
                    {inner}
                  </button>
                ) : (
                  <div key={r.key} className="ds-rail__row">
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {foot}
      </div>
    </aside>
  );
}
