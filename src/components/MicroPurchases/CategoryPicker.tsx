// The part categories, as a list she ticks.
//
// Twelve human categories sit over DLA's 666 Federal Supply Classes. She never
// sees a code. The mapping is ours and lives in code (the server's
// `small-orders.category-map.ts` decides which orders each category holds).
//
// It lives inside "Narrow this down". It used to be its own "What do you sell?"
// sheet and a step on the checklist; the owner moved it into the filter menu,
// and the server applies it, so a page of 50 is 50 orders in her categories.
import { Check } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { MICRO_CATEGORIES, type MicroCategory } from "../../lib/microPurchases/categories";

export function CategoryPicker({
  picked,
  proposing,
  onToggle,
}: {
  picked: readonly MicroCategory[];
  /** The ticks are Hunter's proposal from her NAICS codes, not yet her choice. */
  proposing: boolean;
  onToggle: (id: MicroCategory) => void;
}) {
  return (
    <fieldset className="mp-q">
      <legend className="mp-q__legend">What do you sell?</legend>

      {/* Machine-derived, so it wears Hunter's surface and names its source.
          Nothing is saved until she applies the filter. */}
      {proposing && (
        <div className="ai-surface mp-suggested">
          <div className="ai-attr">
            <AgentAvatar agent="hunter" size={20} />
            <span>Hunter</span>
          </div>
          <p>Picked from the NAICS codes in your profile. Change anything that is wrong.</p>
        </div>
      )}

      <ul className="mp-cats">
        {MICRO_CATEGORIES.map((c) => {
          const on = picked.includes(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`mp-cat${on ? " is-on" : ""}`}
                aria-pressed={on}
                onClick={() => onToggle(c.id)}
              >
                <span className="mp-cat__box" aria-hidden>
                  {on && <Check size={13} />}
                </span>
                <span className="mp-cat__text">
                  <b>{c.label}</b>
                  <em>{c.hint}</em>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* "Other" is deliberately unpickable, so picking nothing must be a real
          answer: it shows every order. */}
      <p className="mp-q__note">Pick none to see every part.</p>
    </fieldset>
  );
}
