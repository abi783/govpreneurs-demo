/**
 * The GOV.UK summary-list primitive: label · value · one action, action right.
 *
 * A PRIMITIVE — it knows nothing about profile fields, states or proposals;
 * `Row.tsx` composes it. Keeping it dumb is what stops the record and the
 * check-answers screen growing two row implementations that drift apart.
 *
 * THE ANSWER IS THE CONTROL. The value sits in a box that opens the editor, so
 * there is no third column and no "Change" link repeating down the page. The
 * box is named by the question and its own answer (`aria-labelledby`), never by
 * an `aria-label`: the visible words inside it ARE the answer, and WCAG 2.5.3
 * wants the visible text inside the accessible name.
 *
 * The question owns `term` and `why`; the answer owns the box, its state mark
 * and the provenance line. Stacked on a phone, two columns from 900px, with the
 * provenance under the VALUE at both widths — it is a fact about the answer. No
 * horizontal scroll at 390px or 1440px.
 */

"use client";

import { useId, type ReactElement, type ReactNode } from "react";

export interface SummaryRowProps {
  label: string;
  /** The government's own word for the question, small, under it. Half of the
   *  acronym rule; `why` is the other half. */
  term?: string;
  /** What this fact does for her, under the QUESTION. Shown on every row that
   *  has one: the reason a question matters does not stop being true once she
   *  has answered it. */
  why?: string;
  /** Rendered content, so a value can carry a chip or a link. Never a joined
   *  string built by the caller — that is `formatValue`'s job. */
  value: ReactNode;
  /** The single action. Two actions on one row is a decision she has to make
   *  before she can read the row.
   *
   *  THE WHOLE VALUE BOX IS THIS ACTION. It used to be a "Change" link in a
   *  third column, which put the target for a one-word correction as far from
   *  the value as the row is wide, and made every answered row carry the same
   *  five letters. `label` is now only the accessible name. */
  action?: { label: string; onClick: () => void; busy?: boolean };
  /** The DOM id something can link straight to — see `rowAnchor.ts`. Optional
   *  because a row rendered outside the record (the check-answers list, a
   *  mentor drawer) is not a link target and must not claim the id twice. */
  anchorId?: string;
  /** The state mark that sits inside the box, at its end: a tick on a settled
   *  row, a flag on one that still wants her. */
  mark?: ReactNode;
  /** True when the row holds no answer — the box invites rather than reports,
   *  and takes the one interactive colour to say so. */
  empty?: boolean;
  /** True while this row's editor is open. THE BOX MUST NOT BE A BUTTON THEN:
   *  the editor renders inside this cell, and inputs and a Save button nested
   *  in a `<button>` are invalid markup that a browser will not let anyone
   *  operate — the outer button swallows the clicks. The editor brings its own
   *  Save and Cancel, so nothing is lost by standing the box down. */
  editing?: boolean;
  /** Small print under the value: origin · source chip · freshness. */
  footnote?: ReactNode;
}

/** One line of a summary list: label, value, and at most one action. */
export function SummaryRow({
  label,
  term,
  why,
  value,
  action,
  mark,
  empty,
  editing,
  footnote,
  anchorId,
}: SummaryRowProps): ReactElement {
  const id = useId();
  const labelId = `${id}-k`;
  const valueId = `${id}-v`;
  const boxClass = `mb-row__box${empty ? " mb-row__box--empty" : ""}`;
  const box = (
    <>
      <span className="mb-row__val" id={valueId}>
        {value}
      </span>
      {mark ? <span className="mb-row__mark">{mark}</span> : null}
    </>
  );

  return (
    /* `anchorId` is what "Answer the next one" points at. On the row rather
       than on the question inside it, so the scroll lands on the whole pair —
       the question AND the answer box she is being sent to fill. */
    <div className="mb-row" id={anchorId}>
      <dt className="mb-row__label">
        {/* The id is on the QUESTION, not on the whole cell: the box is named
            by this and its own answer, and a `why` line inside the named node
            would be read out as part of the button's name. */}
        <span className="mb-row__q" id={labelId}>
          {label}
          {term ? <span className="mb-term gpds-mono">{term}</span> : null}
        </span>
        {/* WHY THIS IS ASKED, UNDER THE QUESTION. It belongs to the question,
            not to the answer — under the value it read as a note about what she
            had typed. */}
        {why ? <p className="mb-why">{why}</p> : null}
      </dt>
      <dd className="mb-row__value">
        {editing ? (
          // The editor's own container, with none of the box's chrome: it is
          // no longer reporting an answer, it is taking one.
          <div className="mb-row__open">{value}</div>
        ) : action ? (
          <button
            type="button"
            className={boxClass}
            onClick={action.onClick}
            disabled={action.busy === true}
            /* NAMED BY THE QUESTION AND ITS OWN ANSWER, which are both already
               on the page. An `aria-label` of "Change …" would take the
               visible words OUT of the accessible name — the text inside this
               button is the answer — and WCAG 2.5.3 requires the visible label
               to be in the name, so voice input can reach it. Pointing at the
               two nodes names the button once and reads it once. */
            aria-labelledby={`${labelId} ${valueId}`}
          >
            {box}
          </button>
        ) : (
          <div className={boxClass}>{box}</div>
        )}
      </dd>
      {footnote ? <dd className="mb-row__foot">{footnote}</dd> : null}
    </div>
  );
}

export interface SummaryListProps {
  children: ReactNode;
}

/** The list the whole record is built from. A description list, because that is
 *  what it is — label and value, read by a screen reader as a pair. */
export function SummaryList({ children }: SummaryListProps): ReactElement {
  return <dl className="mb-list">{children}</dl>;
}
