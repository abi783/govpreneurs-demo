// @vitest-environment jsdom
//
// THE WALL CLOCK, on every record a member writes.
//
// This store stamped six things with `TODAY`, the SAMPLE corpus's frozen day.
// The corpus is served now, so its day trails the real day by however far the
// ingest is behind. Every case below sets the real day away from `TODAY` and
// asserts the store reads the real one.
//
// The harm is largest on SAM. A registration expires on a real date, so a
// registration that lapsed inside the gap reads as active against the corpus's
// day — and an expired registration disqualifies every quote she sends.
//
// No date is restated. The real day is derived from the corpus's own `TODAY`,
// so it stays a fixed distance from it when the fixture clock moves.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MICRO_ORDERS, TODAY } from "../mock/microPurchaseOrders";

const MS_PER_DAY = 24 * 3600 * 1000;

/** How far the real day sits ahead of the served corpus's day. The measured
 *  gap was seven days; any gap works, because it is the DISAGREEMENT that every
 *  case rests on. */
const CORPUS_LAG_DAYS = 7;

const REAL_NOW = new Date(TODAY.getTime() + CORPUS_LAG_DAYS * MS_PER_DAY);
const CORPUS_DAY = TODAY.toISOString().slice(0, 10);

/** `YYYY-MM-DD`, `days` after the real day. */
function dayAfterReal(days: number): string {
  return new Date(REAL_NOW.getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** `YYYY-MM-DD`, `days` after the corpus's day. */
function dayAfterCorpus(days: number): string {
  return new Date(TODAY.getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

type Store = typeof import("./microPurchases");

/** A store of her own for each case. The module holds its state in a module
 *  variable, and these cases write registrations, which are set once and never
 *  moved — so a shared store would make the order of the cases load-bearing. */
async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import("./microPurchases");
}

beforeEach(() => {
  // Only `Date`. The store debounces its writes on a real `setTimeout`, and
  // faking that as well would leave a pending write in every case.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(REAL_NOW);
});

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState({}, "", "/");
});

describe("the store stamps what she did with the real day", () => {
  it("stamps a sent quote with the real day, not the corpus's", async () => {
    const store = await freshStore();
    const o = MICRO_ORDERS[0];

    store.recordQuote(o.id, o.nsn, o.deliveryDays);

    expect(store.quoteFor(o.id)?.sentAt.slice(0, 10)).toBe(dayAfterReal(0));
    expect(store.quoteFor(o.id)?.sentAt.slice(0, 10)).not.toBe(CORPUS_DAY);
  });

  it("counts the two-week snooze from the day she tapped it", async () => {
    const store = await freshStore();
    const o = MICRO_ORDERS[0];
    store.recordQuote(o.id, o.nsn, o.deliveryDays);

    store.recordStillWaiting(o.id);

    expect(store.quoteFor(o.id)?.askAgainOn?.slice(0, 10)).toBe(dayAfterReal(14));
  });

  it("stamps a win with the real day, not the corpus's", async () => {
    const store = await freshStore();

    store.recordWin(MICRO_ORDERS[0], 1200);

    expect(store.winFor(MICRO_ORDERS[0].id)?.wonOn).toBe(dayAfterReal(0));
    expect(store.winFor(MICRO_ORDERS[0].id)?.wonOn).not.toBe(CORPUS_DAY);
  });

  it("stamps her first registration with the real day, not the corpus's", async () => {
    const store = await freshStore();

    store.setRegistration("cage", true);

    const at = store.getMicroState().firstRegistrationAt;
    expect(at?.slice(0, 10)).toBe(dayAfterReal(0));
    expect(at?.slice(0, 10)).not.toBe(CORPUS_DAY);
  });

  it("opens and closes the 30-day metric window on ONE clock", async () => {
    // Metric 1 measures a first quote within 30 days of her first registration.
    // She registers and quotes in the same sitting, so the window it measures
    // is zero days. Two clocks here would report the corpus lag instead, on the
    // measure that decides whether the feature works.
    const store = await freshStore();
    const o = MICRO_ORDERS[0];

    store.setRegistration("sam", true);
    store.recordQuote(o.id, o.nsn, o.deliveryDays);

    const opened = new Date(store.getMicroState().firstRegistrationAt!).getTime();
    const closed = new Date(store.quoteFor(o.id)!.sentAt).getTime();
    expect(Math.round((closed - opened) / MS_PER_DAY)).toBe(0);
  });
});

describe("SAM expiry is measured against the real day", () => {
  it("calls a registration that lapsed inside the corpus gap EXPIRED", async () => {
    // The registration ran out after the day the served corpus is for and
    // before today. Against the corpus's day it is still active, and every
    // quote she sends on that reading is disqualified without her being told.
    const store = await freshStore();

    store.setRegistration("sam", true, dayAfterCorpus(3));

    expect(store.samStatus()).toBe("expired");
    expect(store.daysUntilSamExpiry()).toBeLessThan(0);
  });

  it("counts the days to renewal down from the real day", async () => {
    const store = await freshStore();

    store.setRegistration("sam", true, dayAfterReal(10));

    expect(store.daysUntilSamExpiry()).toBe(10);
  });

  it("projects the demo's seeded expiry from the day it is compared against", async () => {
    // `?sam=expiring` seeds a date and `samStatus()` reads it back. A
    // projection and the clock it is compared against are one pair: split them
    // and the demo tier is wrong by the corpus lag.
    window.history.replaceState({}, "", "/?sam=expiring");
    const store = await freshStore();

    store.setRegistration("sam", true);

    expect(store.samStatus()).toBe("expiring");
    expect(store.daysUntilSamExpiry()).toBe(store.DEMO_SAM_DAYS.expiring);
  });
});
