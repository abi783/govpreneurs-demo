// @vitest-environment jsdom
//
// WHERE THE TERMINATION WARNING SITS, AND WHO SEES IT.
//
// "Do not quote unless you can deliver it." lay across the detail page's header
// row, level with Hunter's price, and moved here on 10 September 2026 so that it
// sits directly above the control that commits her.
//
// NOTHING ASSERTED THIS WARNING BEFORE THIS FILE. It appeared in exactly one
// place in the whole frontend — the route that rendered it — so the move could
// have dropped it altogether and every suite would still have passed. That is
// the gap these cases close, and it is why they assert POSITION and not just
// presence: the warning being on the page is not the requirement, the warning
// being above the button is.
//
// The trap this file exists to catch is the obvious way to satisfy the request.
// "Get registered to sell" renders only in the NOT-REGISTERED branch. Putting
// the warning next to that button, inside that branch, reads as correct and
// hides the warning from the only members who can actually send a price. The
// second case fails if anybody does that.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SendToDla } from "./SendToDla";
import { MICRO_ORDERS, TODAY } from "../../lib/mock/microPurchaseOrders";
import { corpusNow } from "../../lib/microPurchases/pricing";
import { isoDay } from "../../lib/microPurchases/wallClock";
import { setRegistration } from "../../lib/state/microPurchases";

const WARNING = "Do not quote unless you can deliver it.";
const REGISTER_CTA = "Get registered to sell";

/** The day these fixture orders are served for. Derived from `TODAY`, so no
 *  date is restated here. */
const CORPUS_DAY = corpusNow(isoDay(TODAY.toISOString()));

/** A SAM date far enough out that `samStatus()` cannot read it as expiring.
 *  Derived from `TODAY`, so no date is restated. */
const SAM_GOOD_UNTIL = isoDay(new Date(TODAY.getTime() + 365 * 24 * 3600 * 1000).toISOString());

const ORDER = MICRO_ORDERS[0];

/** Tick every registration, which is what `registrationsComplete()` reads. */
function memberIsRegistered(): void {
  setRegistration("sam", true, SAM_GOOD_UNTIL);
  setRegistration("cage", true);
  setRegistration("dibbs", true);
  setRegistration("piee", true);
}

/** Untick every registration, so the send block renders its blocked branch. */
function memberIsNotRegistered(): void {
  for (const k of ["sam", "cage", "dibbs", "piee"] as const) setRegistration(k, false);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(TODAY);
  memberIsNotRegistered();
});

afterEach(() => {
  cleanup();
  memberIsNotRegistered();
  vi.useRealTimers();
});

describe("the termination warning in the send block", () => {
  it("renders above the register button, not below it", () => {
    render(<SendToDla order={ORDER} now={CORPUS_DAY} />);

    const warning = screen.getByText(WARNING);
    const cta = screen.getByText(REGISTER_CTA);

    // DOCUMENT_POSITION_FOLLOWING: the CTA comes after the warning. This is the
    // whole requirement — a warning printed under the control it qualifies is a
    // warning read second, and by then she has already clicked.
    expect(warning.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /**
   * THE REGRESSION THE NAIVE MOVE CAUSES.
   *
   * The request was "put it above the Get registered to sell button". That
   * button lives inside the `!ready` branch, so the literal move hides the
   * warning from a REGISTERED member — the only member who can act on it. The
   * warning sits above the branch instead of inside either arm.
   */
  it("still renders for a registered member, who has no register button at all", () => {
    memberIsRegistered();
    render(<SendToDla order={ORDER} now={CORPUS_DAY} />);

    expect(screen.getByText(WARNING)).toBeTruthy();
    expect(screen.queryByText(REGISTER_CTA)).toBeNull();
  });

  it("names the consequence, not just the rule", () => {
    render(<SendToDla order={ORDER} now={CORPUS_DAY} />);

    // A bare "do not quote" is an instruction she can weigh against the money.
    // The reason is what makes it weighable, so it travels with the headline.
    expect(screen.getByText(/DLA can end the contract/)).toBeTruthy();
    expect(screen.getByText(/stays on your record/)).toBeTruthy();
  });
});
