// Micro purchases — everything the member tells us on this surface.
// In-memory only (repo rule: no localStorage/sessionStorage), resets on reload,
// mirroring src/lib/state/savedAwards.ts.
//
// This module is the profile-graph work in prototype form. The four node types
// the plan calls for are the four collections below:
//   SupplyCapability      attested / declined / supplied
//   QuoteRecord           quotes
//   Registration          registrations
//
// The accumulation is the point: every answer here makes tomorrow's list better,
// which is the one thing no competitor can copy.
import { bus } from "../eventBus";
import { keepOrder } from "../microPurchases/savedOrders";
// Static, not dynamic. api.ts imports only a TYPE from this module, which is
// erased at build, so there is no runtime cycle to dodge — and a module that is
// both dynamically and statically imported is not code-split anyway, which is
// what the bundler said when this was an `await import`.
import {
  fetchMemberState,
  saveMemberState,
  type SaveFailure,
  type SaveOutcome,
} from "../microPurchases/api";
// Re-exported so one surface imports the notice's value and its type from the
// same module, rather than reaching past the store into the wire.
export type { SaveFailure } from "../microPurchases/api";
// THE WALL CLOCK, not the corpus's day. Everything this file stamps is
// something a MEMBER did, or a deadline she must meet in the real world, so it
// is measured against the real day. src/lib/microPurchases/wallClock.ts states
// which clock owns which question.
//
// This file used to stamp all six with TODAY, the SAMPLE corpus's frozen day.
// That was right while the corpus was a module and its day was the only day
// here. The corpus is SERVED now, so its day trails the real one — and a
// member's action stamped with the served day is dated before she took it.
// SAM is where that costs her: a registration that lapsed after the served day
// still reads as active, and an expired registration disqualifies every quote
// she sends.
//
// The app-wide NOW in src/lib/format.ts is still not an option. It is a frozen
// prototype date MONTHS before this corpus, and it stamped every quote before
// the order was posted — "You won this one in May 2026" against an August
// solicitation. The real day is always after the served day, so it cannot
// reproduce that.
//
// The date is NOT restated here. It used to be, and it went stale the first
// time the fixture clock moved: this comment said 17 August while the constant
// said 26 August, on the one file whose subject is the clock. A date written
// twice is a second clock. Follow the import.
import { isoDay, wallClockDay, wallClockNow } from "../microPurchases/wallClock";
import type { MicroCategory } from "../microPurchases/categories";
import type { MicroOrder } from "../microPurchases/order";
// The cap has ONE owner. Every mentor control on the surface spends the same
// week's capacity, so the number that decides whether it is gone lives with the
// rule that states it, and the spend runs through askedForReview() below.
// The week rule has ONE owner too, and it is mentor.ts. This file used to keep
// a private UTC `weekOf()` beside mentor's local one — same rule, two
// derivations, and they named different Mondays for any instant between local
// midnight and UTC midnight on a Sunday.

export type QuoteOutcome = "pending" | "won" | "lost" | "no_award";

export interface QuoteRecord {
  orderId: string;
  nsn: string;
  /** The price SHE sent, per unit of issue. Null until she tells us.
   *
   *  This used to be filled at tap time with DLA's historical price, which made
   *  the record say she quoted a number she had never seen. Every pricing
   *  measure then compared our own guidance against itself. It must never be
   *  back-filled from `lastPricePerUnit`. See PRD 7.2. */
  quotedPricePerUnit: number | null;
  /** Asked and skipped is not the same as never asked, and we only ask once. */
  quotedPriceAsked: boolean;
  deliveryDays: number | null;
  sentAt: string;
  outcome: QuoteOutcome;
  /** She tapped "Still waiting". DLA awards lag by around 90 days, so this is
   *  the MOST likely answer for months — it used to be a live button wired to
   *  an empty handler. We stop asking until this date and tell her so. */
  askAgainOn: string | null;
}

export interface MicroState {
  /** Has she told us what she sells? Drives the first-run state. */
  categories: MicroCategory[];
  onboarded: boolean;
  cashCeiling: number | null;
  /** Answered "not sure" — recorded so we stop asking, without setting a limit. */
  cashUnsure: boolean;
  attestedNsns: string[];
  declinedNsns: string[];
  /** She was asked and said she does not know. A recorded answer, not a gap. */
  unsureNsns: string[];
  suppliedNsns: string[];
  // No `savedOrderIds`: saved small orders are saved opportunities, owned by
  // `user_workspace.savedOpps` through `lib/microPurchases/savedOrders.ts`.
  quotes: QuoteRecord[];
  /** Past performance. The compounding asset the feature exists to produce.
   *  Two writers, both hers: recordWin() creates the record, recordDelivery()
   *  answers the one question we ask about it afterwards. It is no longer
   *  write-only — SendToDla reads it back through winFor() to know whether it
   *  has already asked. There is still no list, no export and no capability
   *  statement: do not read this and assume the plumbing downstream exists. */
  wins: PastPerformanceRecord[];
  registrations: Record<"sam" | "cage" | "dibbs" | "piee", boolean>;
  /** When she first told us about any registration. The start of the 30-day
   *  window the primary metric measures; without it that metric has no clock.
   *  Not the per-registration `appliedOn` the PRD's §7.2 object specifies —
   *  that changes the shape PrereqLine reads. */
  firstRegistrationAt: string | null;
  /** SAM must be renewed every 12 months. An expired one disqualifies every
   *  quote she sends, silently — the most common way a small seller loses work
   *  it had already won on price. A boolean cannot express that. */
  samExpiresOn: string | null;
  /** Orders she has opened, so the list can quiet them down on a return visit. */
  seenOrderIds: string[];
}

const initial: MicroState = {
  categories: [],
  onboarded: false,
  cashCeiling: null,
  cashUnsure: false,
  attestedNsns: [],
  declinedNsns: [],
  unsureNsns: [],
  suppliedNsns: [],
  quotes: [],
  wins: [],
  registrations: { sam: false, cage: false, dibbs: false, piee: false },
  firstRegistrationAt: null,
  samExpiresOn: null,
  seenOrderIds: [],
};

let state: MicroState = { ...initial };

// One transport. This used to publish to the shared bus AND dispatch a window
// CustomEvent, and the bus half had no subscriber — the exact duplicated
// scaffolding src/lib/eventBus.ts says it exists to replace.
//
// ...and ONE WRITE CHOKEPOINT, which is why persistence hangs here and nowhere
// else. Every mutator in this file goes through commit(), so a record that
// reaches the store reaches the server, and no future mutator can forget to
// save. The alternative — a save call in each of the twenty-odd mutators — is
// the version where the twenty-first is added without one.
function commit(next: Partial<MicroState>) {
  // Recorded before the write lands, so `hydrateMicroState` can tell whether
  // the record it is about to commit is already out of date.
  if (hydrated && !hydrationSettled && !persistSuspended) wroteDuringHydration = true;
  state = { ...state, ...next };
  bus.publish("microPurchases");
  schedulePersist();
}

// ── Persistence ───────────────────────────────────────────────────────────
//
// PRD §10's second item, and the one it calls "the one cut with no safe side":
// a record that survives a reload is one of the few things this product offers
// that a free APEX Accelerator counsellor does not. She fills in four
// registrations over several weeks; losing them once loses her.
//
// ASYNCHRONOUS, DEBOUNCED — AND NOT FORGOTTEN. The store commits synchronously
// and the surface has already told her the answer is saved, so a slow or failed
// write must not block the render or reverse what she sees. A write that fails
// is retried on her next answer, because the whole document goes every time.
//
// But it is NOT fire and forget any more. This read `void saveMemberState(state)`,
// which threw the answer away, so a 400 from a cap, a dead session, a broken
// server and a dropped connection were all the same silence: her quotes, wins
// and attestations stopped persisting and nothing on the screen said so
// (DH-22). The outcome is kept below and a surface renders it.
//
// Debounced because a single tap can commit more than once (recording a quote
// also saves the order), and those are one logical change, not three.
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistSuspended = false;
/**
 * Has the first load finished — either with her record or with a failure?
 *
 * NOT the same as `hydrated`, which is set BEFORE the await and means "a load
 * has started". Nothing used to mean "the load is over", and that is what the
 * defect below turned on.
 */
let hydrationSettled = false;
/** A write asked for before the load finished, held until it has. */
let persistDeferred = false;
/** Did anything change the store while the first load was still in flight? */
let wroteDuringHydration = false;

function schedulePersist() {
  // Hydration commits the server's own state back into the store. Without this
  // guard that commit would immediately PUT what we just GET — harmless, but it
  // is a write per page load for no reason, and it races the first real answer.
  if (persistSuspended) return;
  if (typeof window === "undefined") return;
  // NOTHING GOES TO THE SERVER BEFORE HER RECORD HAS COME BACK.
  //
  // THE BUG THIS FIXES, measured 2026-09-10. `GET /small-orders/state` took 24
  // seconds against the staging cluster. The board's SAM effect runs on mount,
  // reads `getMicroState()` — which at that moment still holds the DEFAULTS —
  // ticks `sam` and `cage`, and this scheduled a PUT 400 ms later. That PUT
  // carried the default document, so it landed roughly 23 seconds before her
  // real record arrived and overwrote it: registrations back to false, and
  // `quotes`, `wins` and `attestedNsns` back to empty.
  //
  // The write is DEFERRED, never dropped. Dropping it would lose the answer she
  // just gave, which is the failure this store was built to avoid.
  // IN FLIGHT, not merely "not finished". `hydrated` is set when a load STARTS,
  // so `hydrated && !hydrationSettled` is exactly the window where a PUT could
  // overtake the GET. A consumer that never loads at all — a test, or a surface
  // with no record to fetch — has no race to lose and must still be able to
  // write, or its answers would be deferred for ever.
  if (hydrated && !hydrationSettled) {
    persistDeferred = true;
    return;
  }
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void saveMemberState(state).then(recordSaveOutcome);
  }, PERSIST_DEBOUNCE_MS);
}

const PERSIST_DEBOUNCE_MS = 400;

/** How the last write failed, or `null` when the last one landed. */
let saveFailure: SaveFailure | null = null;

/**
 * Whether her record is reaching the server, for the surface that says so.
 *
 * A PRIMITIVE, and that is load-bearing. `useLiveSlice` is
 * `useSyncExternalStore`, which re-renders only when the snapshot CHANGES by
 * `Object.is`. A save outcome moves no field of `state`, so a component reading
 * `getMicroState()` would never re-render on one. This value does change, so a
 * component reading THIS one does.
 *
 * It is NOT part of `MicroState`. The store PUTs that document whole, so a
 * field describing the last PUT would be written back into the next one.
 */
export function getSaveFailure(): SaveFailure | null {
  return saveFailure;
}

/**
 * Keep what the last write did, and wake the surface if it changed.
 *
 * A repeated failure of the same kind publishes nothing: the notice is already
 * on her screen saying that, and every commit schedules another write.
 */
function recordSaveOutcome(outcome: SaveOutcome) {
  const next = outcome.saved ? null : outcome.reason;
  if (next === saveFailure) return;
  saveFailure = next;
  bus.publish("microPurchases");
}

/**
 * Load her answers from the server into the store, once.
 *
 * A FAILED LOAD LEAVES THE STORE ALONE. `fetchMemberState` returns null on any
 * failure, and null here is a no-op — because showing a member who registered
 * weeks ago the first-run board is worse than showing her a stale one, and the
 * SAM seeding effect would then write over what we failed to read.
 *
 * Idempotent: the board, the order page and the wins page all mount it, and
 * only the first call does anything.
 */
let hydrated = false;
export async function hydrateMicroState(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const remote = await fetchMemberState();
    // HER OWN ANSWER WINS OVER THE RECORD IT RACED. If she touched anything
    // while the load was in flight, the store now holds something newer than
    // what came back, and committing the remote would erase it in front of her
    // — the same loss as the PUT above, one layer up. Whatever she did is
    // persisted instead, by the deferred write below.
    if (remote && !wroteDuringHydration) {
      persistSuspended = true;
      try {
        commit(remote);
      } finally {
        persistSuspended = false;
      }
    }
  } finally {
    // SETTLED MEANS OVER, NOT SUCCESSFUL. A failed load must still let her
    // answers reach the server, or a bad first request would silence the store
    // for the rest of the session.
    hydrationSettled = true;
    // WAKE THE SURFACES. `microStateHydrated()` is read through
    // `useLiveSlice`, which re-renders only when its snapshot changes, and a
    // load that returned nothing commits nothing — so without this publish the
    // board's SAM effect would wait for a signal that never came.
    bus.publish("microPurchases");
    if (persistDeferred) {
      persistDeferred = false;
      schedulePersist();
    }
  }
}

/** Has the first load finished? The board's SAM effect waits for this. */
export function microStateHydrated(): boolean {
  return hydrationSettled;
}

export function getMicroState(): MicroState {
  return state;
}

/** Subscribe surface for this slice. The transport is the shared bus, so it
 *  also works outside a browser. Components should prefer
 *  `useLiveSlice("microPurchases", getMicroState)` from src/lib/eventBus.ts —
 *  useSyncExternalStore is what closes the React 18/19 tearing hazard that a
 *  hand-rolled listener plus a counter does not. */
export function subscribeMicro(fn: () => void): () => void {
  return bus.subscribe("microPurchases", fn);
}

// ── Onboarding ────────────────────────────────────────────────────────────

export function setCategories(categories: MicroCategory[]) {
  commit({ categories, onboarded: true });
}

/** Asked concretely at her first order, never abstractly at onboarding. */
export function setCashCeiling(v: number | null, unsure = false) {
  commit({ cashCeiling: v, cashUnsure: unsure });
}

// ── Supply capability — the compounding asset ─────────────────────────────

export function attest(nsn: string, answer: "yes" | "no" | "unsure") {
  const attested = state.attestedNsns.filter((x) => x !== nsn);
  const declined = state.declinedNsns.filter((x) => x !== nsn);
  const unsure = state.unsureNsns.filter((x) => x !== nsn);
  if (answer === "yes") attested.push(nsn);
  if (answer === "no") declined.push(nsn);
  // "Unsure" is STORED. It used to clear both lists and record nothing, so the
  // button had no picked state, no aria-pressed and no saved line while Yes and
  // No had all three — the one answer the invariants call always real was the
  // only one that visibly did nothing when tapped. She taps it twice, then
  // picks Yes or No to make something happen, and the capability signal is
  // corrupted by the interface. It is also the leading indicator for whether
  // she can answer the sourcing question at all.
  if (answer === "unsure") unsure.push(nsn);
  commit({ attestedNsns: attested, declinedNsns: declined, unsureNsns: unsure });
}

export function attestationFor(nsn: string): "yes" | "no" | "unsure" | null {
  if (state.attestedNsns.includes(nsn)) return "yes";
  if (state.declinedNsns.includes(nsn)) return "no";
  if (state.unsureNsns.includes(nsn)) return "unsure";
  return null;
}

// ── Seeing ────────────────────────────────────────────────────────────────
// Saving moved to `lib/microPurchases/savedOrders.ts` (the workspace list).

export function markSeen(id: string) {
  if (state.seenOrderIds.includes(id)) return;
  commit({ seenOrderIds: [...state.seenOrderIds, id] });
}

// ── Quotes and outcomes — closing the loop ────────────────────────────────

export function quoteFor(orderId: string): QuoteRecord | undefined {
  return state.quotes.find((q) => q.orderId === orderId);
}

export function recordQuote(orderId: string, nsn: string, deliveryDays: number | null) {
  if (quoteFor(orderId)) return;
  // A quote she has sent MUST stay reachable, because the only reader of a
  // QuoteRecord is SendToDla on that order's page and the only route to that
  // page is the board. queryOrders drops an order the day it closes, and DLA
  // then takes around ninety days to decide — so the loop used to close on
  // nothing: the pending quote was orphaned the week before the award, and
  // recordWin(), the sole producer of the past-performance record this whole
  // feature exists to make, had no route left.
  // Saved orders bypass the live cut, so keeping it is the way back. Saving is
  // the workspace's now, which also puts the quoted order in her pipeline.
  void keepOrder(orderId);
  commit({
    quotes: [
      ...state.quotes,
      {
        orderId,
        nsn,
        // We do NOT know what she quoted at this moment — she has not quoted
        // yet. Null is the honest value; we ask her when she comes back.
        quotedPricePerUnit: null,
        quotedPriceAsked: false,
        deliveryDays,
        sentAt: wallClockNow().toISOString(),
        outcome: "pending",
        askAgainOn: null,
      },
    ],
  });
}

/** She had not sent it after all. The inverse of recordQuote().
 *
 *  One tap on "Yes, I sent it" replaced the whole send block — the two numbers,
 *  the order number she has to copy, and the four steps — with "You sent a
 *  price on this one.", permanently and with no way back. A mis-tap there cost
 *  her the instructions for the thing she had not done yet (D-D3). */
export function deleteQuote(orderId: string) {
  commit({ quotes: state.quotes.filter((q) => q.orderId !== orderId) });
}

/** Her own number, captured at the loop close. `null` = asked, did not remember. */
export function recordQuotedPrice(orderId: string, price: number | null) {
  commit({
    quotes: state.quotes.map((q) =>
      q.orderId === orderId ? { ...q, quotedPricePerUnit: price, quotedPriceAsked: true } : q,
    ),
  });
}

const MS_PER_DAY = 24 * 3600 * 1000;

/** How long we go quiet when she tells us she is still waiting. */
const SNOOZE_DAYS = 14;

/** Two weeks before we ask again. Nothing is claimed about the award itself. */
export function recordStillWaiting(orderId: string) {
  const then = new Date(wallClockNow().getTime() + SNOOZE_DAYS * MS_PER_DAY).toISOString();
  commit({
    quotes: state.quotes.map((q) => (q.orderId === orderId ? { ...q, askAgainOn: then } : q)),
  });
}

/** The inverse of recordStillWaiting(). A snooze she cannot lift is the same
 *  dead end as a snooze she cannot outlive — D-D3 in its data form. */
export function clearSnooze(orderId: string) {
  commit({
    quotes: state.quotes.map((q) => (q.orderId === orderId ? { ...q, askAgainOn: null } : q)),
  });
}

/**
 * The record a win produces — the point of the whole feature.
 *
 * The win screen claimed Hunter had saved "what it was, what it was worth, who
 * bought it, and their name", and the QuoteRecord held none of the four. A
 * first win with no usable past-performance entry buys her nothing toward the
 * second one, which is the entire thesis. All four are on the order already.
 */
export interface PastPerformanceRecord {
  orderId: string;
  solicitation: string;
  nsn: string;
  /** The plain name at the time of the win. Frozen — A1's output may change. */
  scope: string;
  valueUsd: number | null;
  quantity: number | null;
  unitOfIssue: string | null;
  wonOn: string;
  buyerName: string;
  /** NULL when the solicitation named nobody, never `""`.
   *
   *  `MicroOrder.buyerContact.name` is `''` in that case — the entity types it
   *  non-nullable `string` and that shape is frozen (D10) — but this record is
   *  the artifact that leaves the product and gets read by a contracting
   *  officer, and PRD §6.4 is explicit that a label never renders with an empty
   *  value. An absence stored as an absence is what makes the readers' `if
   *  (w.contactName)` guards mean what they say. The server has always typed it
   *  `string | null` (`small-orders.types.ts`), so this is the two halves
   *  agreeing rather than a widening. */
  contactName: string | null;
  contactEmail: string;
  /** What a contracting officer actually calls. */
  contactPhone: string | null;
  /** Her word until an award record confirms it. */
  provenance: "self_reported" | "verified";
  /** True when the win was a one-year repeat contract (AIDC), where `valueUsd`
   *  is her unit price times an ESTIMATED annual quantity DLA may never buy.
   *  NULL when the order paper did not say. `repeats` is `boolean | null` on the
   *  record and the live corpus is 190 true / 10 null / never false, so reading
   *  it `=== true` collapsed a three-state fact into two and sent every unknown
   *  to the UNQUALIFIED caption — on the one artifact that leaves the product
   *  and gets read by a contracting officer. Since live `repeats` is true 95% of
   *  the time, an unknown is more likely than not an estimate. Three reads, the
   *  same treatment `needsDrawings` got (D-B8).
   *
   *  Stored rather than looked up from the order: this record is the thing that
   *  outlives the solicitation — it is what she sends a buyer two years later,
   *  when the order has long rotated out of any feed. A lookup that fails would
   *  fall back to the unqualified caption, which is the wrong direction to fail
   *  in when the sentence is going to a contracting officer. */
  repeatContract: boolean | null;
  /** Did she deliver it? The PRD's counter-metric — "wins the member could not
   *  deliver", any non-zero value halts the rollout — counts `not_delivered`
   *  here, so this field is that veto's only source.
   *
   *  ONE writer: recordDelivery(), from the question SendToDla asks after a
   *  recorded win. Nothing infers it and nothing back-fills it — a veto reading
   *  a value nobody writes is worse than no veto at all (D-G5).
   *
   *  `unknown` means we have not asked yet, or she has not answered. It is a
   *  real, recorded state and not a synonym for delivered: read all four
   *  branches, never `outcome !== "delivered"` (D-B8).
   *
   *  NOT QuoteRecord.outcome. That one asks whether DLA awarded it. This one
   *  asks whether she then did the work. */
  outcome: DeliveryOutcome;
  /** She has been asked at least once. Asked and not answered is not the same
   *  as never asked — the same distinction QuoteRecord.quotedPriceAsked draws,
   *  for the same reason: "not yet" is a real answer and must record something,
   *  or it is the one answer that visibly does nothing when tapped.
   *
   *  It changes what the question SAYS. It never removes the answers: she can
   *  still tell us she delivered it (D-D3, twice in this feature already). */
  deliveryAsked: boolean;
}

/** Late is not failure and unknown is not blame — the question that writes this
 *  offers all four, and none of them is an accusation. */
export type DeliveryOutcome = "delivered" | "late" | "not_delivered" | "unknown";

export function recordWin(o: MicroOrder, valueUsd: number | null) {
  if (state.wins.some((w) => w.orderId === o.id)) return;
  commit({
    wins: [
      ...state.wins,
      {
        orderId: o.id,
        solicitation: o.solicitation,
        nsn: o.nsn,
        scope: o.plainName,
        valueUsd,
        quantity: o.quantity,
        unitOfIssue: o.unitOfIssue,
        wonOn: wallClockDay(),
        buyerName: o.buyer,
        // `''` (and `'   '`, which renders as nothing) is stored as an ABSENCE.
        // Both readers guard on truthiness, so an empty name never printed a
        // label — but a blank one would, and the record itself is what a buyer
        // is sent.
        contactName: o.buyerContact.name.trim() || null,
        contactEmail: o.buyerContact.email,
        contactPhone: o.buyerContact.phone,
        repeatContract: o.repeats ?? null,
        provenance: "self_reported",
        // Not asked yet. She has just won it; the delivery window has not run.
        outcome: "unknown",
        deliveryAsked: false,
      },
    ],
  });
}

/** She tapped an answer to "did you deliver it?". The only writer of
 *  PastPerformanceRecord.outcome, and it runs on her tap and nothing else.
 *
 *  Late and not-delivered are answers, not confessions: the reason we ask is
 *  that a job she could not finish is one we should not send her again. Nothing
 *  here is scored, ranked or shown back to her as a failure. */
export function recordDelivery(orderId: string, outcome: DeliveryOutcome) {
  const wins = state.wins.map((w) =>
    w.orderId === orderId ? { ...w, outcome, deliveryAsked: true } : w,
  );
  commit({ wins, suppliedNsns: suppliedFrom(wins) });
}

/** Proven supply, derived from the wins she has told us she DELIVERED.
 *
 *  It used to be written by recordOutcome() on the win, so the order page said
 *  "You have supplied this exact part before." about a delivery the block 30px
 *  below said was ninety days away — a false statement about her own record, on
 *  the record buyers ask for. A win is an intent to supply; supplying is what
 *  the sentence claims.
 *
 *  Derived rather than maintained: three writers each splicing this list is how
 *  the win path and the undo path disagreed about the same stock number. She
 *  may have won one NSN twice, so the set is recomputed from the wins that are
 *  still standing and still answered. Late counts — it was delivered. */
function suppliedFrom(wins: PastPerformanceRecord[]): string[] {
  return [
    ...new Set(
      wins.filter((w) => w.outcome === "delivered" || w.outcome === "late").map((w) => w.nsn),
    ),
  ];
}

/** The win record for an order, so the surface can ask its question once. */
export function winFor(orderId: string): PastPerformanceRecord | undefined {
  return state.wins.find((w) => w.orderId === orderId);
}

export function recordOutcome(orderId: string, outcome: QuoteOutcome) {
  const q = quoteFor(orderId);
  if (!q) return;
  const quotes = state.quotes.map((x) => (x.orderId === orderId ? { ...x, outcome } : x));
  // A win does NOT write proven supply. recordDelivery() does, when she tells us
  // the parts arrived — see suppliedFrom().
  commit({ quotes });
}

/** Her answer to "did you win it?" was wrong, and she is taking it back.
 *
 *  recordOutcome(orderId, "pending") LOOKS like this function and is not one:
 *  it leaves the PastPerformanceRecord standing and leaves the NSN in
 *  suppliedNsns, so an undone win still sits in past performance and still
 *  ranks tomorrow's board as proven supply. A half-undo that reads as an undo
 *  is worse than no undo at all, so every write recordOutcome() made comes back
 *  out here.
 *
 *  suppliedNsns is recomputed from the wins that survive, so an NSN she
 *  delivered on ANOTHER order stays proven. */
export function undoOutcome(orderId: string) {
  const q = quoteFor(orderId);
  if (!q) return;
  // She is answering the question again, so the two-week silence goes with it.
  // Otherwise the undo lands her back on "we will ask you again on 9 September"
  // — going quiet at the exact moment she told us the record was wrong.
  clearSnooze(orderId);
  const quotes = state.quotes.map((x) =>
    x.orderId === orderId ? { ...x, outcome: "pending" as QuoteOutcome } : x,
  );
  const wins = state.wins.filter((w) => w.orderId !== orderId);
  commit({ quotes, wins, suppliedNsns: suppliedFrom(wins) });
}

export function hasQuotedBefore(): boolean {
  return state.quotes.length > 0;
}

/* THE WEEKLY MENTOR CAP IS RETIRED (Karthik, 24 Aug 2026).
 *
 * `askedForReview()` and `mentorCapReached()` lived here and owned one counter
 * so that a fourth caller could not get past three free reviews a week. There
 * is no free review any more: the product runs one mentor model, the $⁠97
 * wallet review every other surface uses, so nothing meters anything and there
 * is no capacity for a control to exhaust. `reviewsThisWeek`, `reviewsWeek`
 * and `expireReviewWeek()` went with them. */

// ── Registrations — the prerequisite gate reads this ──────────────────────

/** Days from the real day for a DEMO-SEEDED expiry. Both tiers are behind an
 *  explicit URL flag: `?sam=expiring` reaches the renewal warning,
 *  `?sam=expired` the lapsed one. Neither is a default.
 *
 *  Exported so the spec that pins the projection and `samStatus()` to ONE clock
 *  reads the number from its owner instead of restating it. */
export const DEMO_SAM_DAYS: Record<string, number> = { expiring: 40, expired: -12 };

/**
 * The demo's seeded expiry date, or NULL — and NULL IS THE DEFAULT.
 *
 * `40` used to be the default, written into `samExpiresOn` the first time she
 * ticked SAM. So the moment she finished this surface's own four-step
 * checklist, the top of her board said, as a hard fact with a number and an
 * imperative: "Your government registration runs out in 40 days. Renew it now."
 *
 * We do not know when her SAM expires. She ticked a box; she never gave us a
 * date. That is a constant standing in for a member fact, rendered as a
 * government-record fact with no source and no date — D-A3, settled invariant 1
 * (a government-record fact is written verified, with its source and date) and
 * invariant 6 (abstain rather than guess) — on the one number that decides
 * whether she can keep earning. She renews a registration that is not due, or
 * she trusts our clock and lapses on the real date.
 *
 * With no date we now write nothing, and `samStatus()` already reads null as
 * "active", so the warning simply does not render. The renewal tier is reached
 * the way the lapsed tier was already reached — the URL flag was here and only
 * `expiring` was missing from it. Same shape as `hasDemoResetParam()` in
 * src/lib/onboardingStorage.ts.
 *
 * In the live build the date comes from the SAM record and arrives through
 * `setRegistration`'s own argument, which always wins over this.
 */
function demoSamExpiry(): string | null {
  if (typeof window === "undefined") return null;
  let days: number | undefined;
  try {
    days = DEMO_SAM_DAYS[new URLSearchParams(window.location.search).get("sam") ?? ""];
  } catch {
    return null;
  }
  if (days == null) return null;
  // Projected in UTC, the way the day it is compared against is read. This
  // used to add the days with `setDate`, which counts in LOCAL time, so the
  // seeded date and `samStatus()` disagreed for part of every day.
  return isoDay(new Date(wallClockNow().getTime() + days * MS_PER_DAY).toISOString());
}

export function setRegistration(
  k: keyof MicroState["registrations"],
  v: boolean,
  /** The real renewal date, from the SAM record. Omit it and we store NO date
   *  at all — a tick is not a date, and we do not invent one. */
  samExpiresOn?: string,
) {
  const next: Partial<MicroState> = {
    registrations: { ...state.registrations, [k]: v },
  };
  // A date we were given always wins — it is the SAM record talking, and a
  // renewal has to be able to replace a lapsed date. Absent one we write
  // NOTHING unless a demo flag explicitly asked for a date; see demoSamExpiry().
  if (k === "sam" && v && (samExpiresOn || !state.samExpiresOn)) {
    const on = samExpiresOn ?? demoSamExpiry();
    if (on) next.samExpiresOn = on;
  }
  // Metric 1 measures a first quote within 30 days of her first registration.
  // QuoteRecord.sentAt closes that window; nothing opened it. Set once by the
  // first registration she ticks, and never moved by a later one.
  if (v && !state.firstRegistrationAt) next.firstRegistrationAt = wallClockNow().toISOString();
  commit(next);
}

export function registrationsComplete(): boolean {
  const r = state.registrations;
  return r.sam && r.cage && r.dibbs && r.piee && samStatus() !== "expired";
}

/**
 * The expired-SAM warning. ONE owner, two callers: `PrereqLine` states it on
 * the board and `SendToDla` states it in the send block.
 *
 * It lived as two independent literals in two files and had already drifted —
 * the send block's copy had lost both the duration and the route to fix it, on
 * the one surface where she is standing over a live order deciding whether to
 * bother. Content parity was restored by hand, which is `D-E4` waiting to
 * happen again; the constant is the fix, and both callers move to it together.
 *
 * The `expiring` tier is deliberately NOT here. Ticking it into the send block
 * too was considered and refused: while SAM is still valid, the right action on
 * that screen is unchanged — send the price — and the board has already warned
 * her. A second copy of a warning at the moment of action is noise against the
 * one focal action. `expired` is the only tier where the right answer on this
 * screen changes to "do not send this, go and renew", which is why it is the
 * only one the send block carries.
 */
export const SAM_EXPIRED = {
  title: "Your government registration has run out.",
  body: "DLA will not look at your prices until you renew it. Renewing takes a few weeks.",
  /** An anchor, not a button: renewal happens at SAM.gov and nowhere else. The
   *  label names the destination — "Renew it" would imply we renew it for her. */
  href: "https://sam.gov",
  cta: "Go to SAM.gov",
} as const;

export type SamValidity = "missing" | "expired" | "expiring" | "active";

/** Renewal is annual. We warn from 60 days out, because renewing takes weeks. */
export function samStatus(now = wallClockNow()): SamValidity {
  if (!state.registrations.sam) return "missing";
  if (!state.samExpiresOn) return "active";
  const days = Math.round((new Date(state.samExpiresOn).getTime() - now.getTime()) / MS_PER_DAY);
  if (days < 0) return "expired";
  if (days <= 60) return "expiring";
  return "active";
}

export function daysUntilSamExpiry(now = wallClockNow()): number | null {
  if (!state.samExpiresOn) return null;
  return Math.round((new Date(state.samExpiresOn).getTime() - now.getTime()) / MS_PER_DAY);
}
