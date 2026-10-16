/**
 * She keeps some of what a channel proposed.
 *
 * ONE SET OF TICK BOXES, FOR EVERY SURFACE THAT ASKS. It was the queue card's
 * private `Picker` (F5b), and no page mounted that card. The record row asks the
 * same question, so the markup was lifted here unchanged rather than written a
 * second time. The queue card was then deleted (F5g). The `mb-queue__` class
 * names are kept from that card.
 *
 * IT DECIDES NOTHING. `toggleItem` says what one tap does and `canConfirm` says
 * whether the pick may go, both in `subsetConfirm.ts` — the cap is never written
 * out here, so there is one number in one file. A tap the cap refuses simply
 * leaves the box unticked, and the line under the list says why.
 *
 * The tick boxes themselves are `.gpds-picks` / `.gpds-pick` from the design
 * system, which every other multi-answer control on this app draws with.
 */

"use client";

import type { ReactElement } from "react";
import { keptNote, type CardChoice } from "@sc/lib/businessProfile/proposalAnswer";
import { toggleItem } from "@sc/lib/businessProfile/subsetConfirm";
import "./mybusiness.css";

export interface ItemPickerProps {
  /** The cap, the items on offer, and the line that asks for the pick. */
  choose: CardChoice;
  /** What she has kept so far. The surface holds it, because the surface is
   *  what sends it. */
  kept: string[];
  onKept: (kept: string[]) => void;
  busy?: boolean;
}

/** Every item the channel named, with a box against each, and how many fit. */
export function ItemPicker({ choose, kept, onKept, busy }: ItemPickerProps): ReactElement {
  return (
    <fieldset className="gpds-picks">
      <legend className="mb-queue__pick">{choose.note}</legend>
      {choose.items.map((item) => (
        <label key={item} className="gpds-pick">
          <input
            type="checkbox"
            checked={kept.includes(item)}
            disabled={busy === true}
            onChange={() => onKept(toggleItem(kept, item, choose.maxItems))}
          />
          <span className="gpds-pick__text">
            <span className="gpds-pick__label">{item}</span>
          </span>
        </label>
      ))}
      {/* Announced as it changes, so a confirm she cannot press has its reason
          on the screen and not only in the code. */}
      <p className="mb-queue__kept" aria-live="polite">
        {keptNote(kept.length, choose.maxItems)}
      </p>
    </fieldset>
  );
}
