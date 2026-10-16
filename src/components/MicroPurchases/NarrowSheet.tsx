// "Narrow this down" — QUESTIONS with answers, not a row of toggles.
//
// The first build shipped four independent toggles. Two of them were the same
// axis, so "Small orders only" and "Bigger jobs too" could both be on at once —
// a state with no meaning that the interface happily allowed. Four booleans is
// sixteen combinations, most of them nonsense, and a toggle row communicates
// nothing about which choices exclude one another.
//
// Now: her part categories and two questions with mutually exclusive answers.
// The "only orders that last a year" toggle was removed on 2026-09-15: live
// DIBBS never marks an order as NOT lasting a year, so it filtered nothing.
// The categories are the one filter the SERVER applies — see the note on the
// count below.
// Contradiction is unrepresentable rather than merely discouraged, and the shape
// on screen tells her which choices are alternatives.
//
// The button carries a LIVE COUNT so she sees the effect of a choice before
// committing to it — show exactly what will happen before you confirm. At zero
// the button is replaced rather than disabled, because a dead control explains
// nothing.
//
// Modal behaviour — focus in, focus trapped, Escape out, focus back on the
// opener, background inerted — is `MicroSheet`, shared with every other sheet
// in this feature. This file used to hand-roll `<div role="dialog">` and got
// all four wrong; see the note at the head of MicroSheet.tsx.
//
// It wears `MicroSheet`'s PANEL variant, so it is the opportunities page's side
// drawer rather than a bottom sheet. A filter that fills the viewport reads as
// a second page, and the owner read it as one. Nothing below changed for that:
// the questions, the live count, the zero-state line and the sticky foot are
// the filter's, and the skin is the shell's.
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { MicroSheet, SheetCancel } from "./MicroSheet";
import { CategoryPicker } from "./CategoryPicker";
import type { MicroCategory } from "../../lib/microPurchases/categories";
import {
  SIZE_QUESTION,
  DELIVERY_QUESTION,
  NO_FILTERS,
  filtersActive,
  type MicroFilters,
  type MicroMemberContext,
  type MicroSort,
  type SizeAnswer,
  type DeliveryAnswer,
} from "../../lib/microPurchases/relevance";
import { queryBoard, type BoardFeed } from "../../lib/microPurchases/feed";

export function NarrowSheet({
  selected,
  categories,
  suggested = [],
  member,
  sort,
  feed,
  onApply,
  onClose,
}: {
  selected: MicroFilters;
  /** The categories the board is walked in now — her saved choice. */
  categories: readonly MicroCategory[];
  /** Categories her profile's NAICS codes point at. Pre-ticked ONLY when she has
   *  picked nothing and never answered — a proposal, never an overwrite. */
  suggested?: readonly MicroCategory[];
  member: MicroMemberContext;
  sort: MicroSort;
  /** THE BOARD'S FEED — the orders AND the day, in one value (D-B7, D-F5, D2).
   *  The count on the confirm button below is the number she uses to decide
   *  whether to apply a filter, and it was the one queryOrders call site of
   *  three left un-swept: its own defaults are the full corpus and a LOCAL day,
   *  while the board it applies to was judged against another one entirely.
   *  The earlier day admits more orders, so the sheet could promise a count the
   *  board would not deliver. Passing the pair separately fixed the symptom and
   *  left the shape: one object, one queryBoard(), nothing to disagree about.
   *  `null` — the fetch failed — is passed straight through, so the count is
   *  the honest zero rather than a count over a corpus we do not have. */
  feed: BoardFeed | null | undefined;
  onApply: (next: MicroFilters, categories: MicroCategory[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<MicroFilters>(selected);
  const proposing = categories.length === 0 && suggested.length > 0;
  const [picked, setPicked] = useState<MicroCategory[]>([...(proposing ? suggested : categories)]);
  const togglePick = (id: MicroCategory) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  // THE COUNT IS ONLY KNOWN WHILE THE CATEGORIES ARE UNCHANGED. The board holds
  // the orders the server walked in her CURRENT categories, so the rows in hand
  // can count a size or a delivery answer, but not a category she has just
  // ticked: those orders were never fetched. A count there would read 0 for a
  // category with plenty of orders, and the zero state would take the button
  // away. So a changed category shows a button with no number.
  const categoriesChanged =
    picked.length !== categories.length || picked.some((c) => !categories.includes(c));
  const count = useMemo(
    () => queryBoard({ filters: draft, sort }, member, feed).rows.length,
    [draft, sort, member, feed],
  );

  return (
    <MicroSheet title="Narrow this down" variant="panel" onClose={onClose}>
      <CategoryPicker picked={picked} proposing={proposing} onToggle={togglePick} />

      {/* Question 1 — one axis, one control. This replaces the two size
            toggles that used to be able to contradict each other. */}
      <Question
        legend={SIZE_QUESTION.question}
        answers={SIZE_QUESTION.answers}
        value={draft.size}
        onPick={(id) => setDraft((d) => ({ ...d, size: id as SizeAnswer }))}
      />

      <Question
        legend={DELIVERY_QUESTION.question}
        answers={DELIVERY_QUESTION.answers}
        value={draft.delivery}
        note={DELIVERY_QUESTION.note}
        onPick={(id) => setDraft((d) => ({ ...d, delivery: id as DeliveryAnswer }))}
      />

      <div className="mp-sheet__foot">
        {/* Absent rather than disabled. A greyed-out control asks her to work
              out why it is dead; nothing there asks nothing. Same rule as the
              send button on the order page. */}
        {(filtersActive(draft) || picked.length > 0) && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setDraft(NO_FILTERS);
              setPicked([]);
            }}
          >
            Clear
          </button>
        )}
        {/* A visible way out, in the same slot and with the same word the
              category sheet uses. This slot used to hold an empty span, so the
              only exit was tapping a blurred board that said nothing about
              being tappable — and the two sheets taught opposite lessons about
              how to leave. Escape and a tap outside now do the same thing. */}
        <SheetCancel />
        {categoriesChanged ? (
          <button type="button" className="btn btn-primary" onClick={() => onApply(draft, picked)}>
            Show orders
          </button>
        ) : count === 0 ? (
          <span className="mp-sheet__zero">No orders match — change something above</span>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => onApply(draft, picked)}>
            Show {count} {count === 1 ? "order" : "orders"}
          </button>
        )}
      </div>
    </MicroSheet>
  );
}

/** One question, its answers, and which one is chosen. Radio semantics, because
 *  these ARE alternatives — a toggle row would lie about that. */
function Question({
  legend,
  answers,
  value,
  note,
  onPick,
}: {
  legend: string;
  answers: readonly { id: string; label: string; hint: string }[];
  value: string;
  note?: string;
  onPick: (id: string) => void;
}) {
  return (
    <fieldset className="mp-q">
      <legend className="mp-q__legend">{legend}</legend>
      <div className="mp-q__answers" role="radiogroup" aria-label={legend}>
        {answers.map((a) => {
          const on = value === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`mp-answer${on ? " is-on" : ""}`}
              onClick={() => onPick(a.id)}
            >
              <span className="mp-answer__mark" aria-hidden>
                {on && <Check size={13} />}
              </span>
              <span className="mp-answer__text">
                <b>{a.label}</b>
                {a.hint && <em>{a.hint}</em>}
              </span>
            </button>
          );
        })}
      </div>
      {note && <p className="mp-q__note">{note}</p>}
    </fieldset>
  );
}
