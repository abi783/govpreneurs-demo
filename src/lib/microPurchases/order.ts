// Small orders — the order shape.
//
// `MicroOrder` is the government's record of one DLA micro-purchase. The live
// backend pipeline produces it, `relevance.ts` rules on it, `pricing.ts` prices
// it and every screen on this surface renders it. The 25-record fixture is one
// reader of the shape, not its owner, so the declarations no longer live beside
// it in `lib/mock/`.
//
// The field documentation below is the only record in this repo of what each
// DLA field means and how often DLA populates it. It moved verbatim.
//
// Layer: ENTITIES. This module imports the category taxonomy and nothing else.

import type { MicroCategory } from "./categories";

/**
 * One award DLA has already made for this stock number.
 *
 * From `nsn.awards[]`. The published schema types this field `string`; the live
 * API returns an ARRAY OF OBJECTS. Verified 19 Aug 2026 — see
 * research/api-samples/nsn-4730016648684.json.
 *
 * `cage` is the winner's CAGE code. There is NO company name here: a name needs
 * a join to /awardee/?cage_code=.
 */
export type MicroAward = {
  cage: string;
  contract: string;
  quantity: number | null;
  /** Per UNIT OF ISSUE, like `lastPricePerUnit`. Verified on a `ui: HD` record. */
  unitCost: number | null;
  awardedOn: string;
  /** DLA records whether the award was for surplus goods. This is the DATA
   *  behind the surplus warning we currently give from first principles.
   *
   *  **NULLABLE, and the null means "we cannot tell".** 4 of the 26 awards in
   *  the live sample return null here — including the NEWEST award on its
   *  record, which is the one that sets `last_price` and therefore the one that
   *  sets her price ceiling. Typed `boolean` this collapsed to "not surplus",
   *  which is round 3's surplus critical one field over: a surplus award sets a
   *  ceiling no new-goods seller can meet, and she loses on price without ever
   *  being told why.
   *
   *  Reading this field as `!== true` treats "we cannot tell" as clean
   *  evidence. `usableAward()` in microPurchases/pricing.ts still does. That
   *  half is escalated — the guard belongs there, as `a.surplus === false`. */
  surplus: boolean | null;
  partNumber: string | null;
};

/**
 * A company DLA has designated as an approved source for this stock number.
 *
 * From `nsn.suppliers[]` — also an array of objects, not the `string` the
 * schema declares. **This is NOT award history and it is NOT a bidder
 * restriction.** On NSN 4730016648684 the single approved source (CAGE 33813)
 * won none of the ten awards, which were taken by seven other companies.
 * Non-empty on 100% of a 57-record live sample.
 */
export type ApprovedSource = {
  cage: string;
  partNumber: string | null;
};

export type MicroOrder = {
  id: string;
  /** DIBBS solicitation number. "SPE" + T (one-time) or U (repeat) in position 9. */
  solicitation: string;
  /**
   * The order's page on DLA's own site, or `null` when we hold no link we may
   * show. It is what lets her read the order paper we are summarising.
   *
   * `sourcePath` on the `opportunities` document, passed through the origin
   * allow-list in `backend/src/small-orders/small-orders.dla-link.ts`. Two
   * other URL-shaped fields sit beside it there and NEITHER may be shown:
   * `path` is a HigherGov page — our data vendor — and `documentPath` is a
   * HigherGov API endpoint that carries `api_key=` in its query string on many
   * records.
   *
   * `null` on all 25 records below. They are a committed sample and we did not
   * observe DLA's URL for them; a URL composed from the order number would be
   * a citation we invented, and a link that 404s is worse than no link.
   */
  dlaOrderUrl: string | null;
  /**
   * The order paper DLA published, when the server holds one.
   *
   * `null` on the ~59% of live orders we have no document for — coverage is
   * 6,855 of 16,606 active DIBBS — so the absent state is the common one and
   * the surface says so rather than implying a link that is not there.
   *
   * NO URL CROSSES THE WIRE, deliberately. The stored one is a HigherGov
   * presigned S3 link carrying an `AWSAccessKeyId`, and every one sampled had
   * expired: it would be a dead link and a credential in the markup at once.
   * `paperHref()` builds a link to our own redirect endpoint instead, which
   * mints a fresh URL per click.
   */
  paper: { fileName: string; fileSize: number | null } | null;
  /** `source_id_version` — DLA amends solicitations, and quoting a superseded
   *  version is a documented way to be thrown out. */
  version: string;
  /**
   * The date `version` last changed on the record we ingested.
   *
   * NOT "since she last opened it". It said that, and nothing in the codebase
   * could deliver it: `MicroState` stores no version and no per-order view
   * record (`seenOrderIds` holds ids only), and nothing anywhere writes this
   * field — a docstring describing a per-member diff that has no writer is
   * D-G5 in a type. Whether she gets a per-member "changed since you looked"
   * signal is a product decision, not a fixture's to imply; the honest reading
   * of the data we actually have is "DLA amended this solicitation on this
   * date", which is what the page renders.
   *
   * Non-null on one record, and on that record `version !== solicitation` —
   * because a version that equals the order number tells her nothing to check
   * against (D-B5).
   */
  amendedOn: string | null;
  nsn: string;
  /** Hunter's plain-English name, written at ingest and cached per stock number.
   *  Equal to `officialName` when A1 abstained or judged the name already plain
   *  — a normal outcome, and the reason `plainName === officialName` is a state
   *  the surface must be able to see rather than a defect. */
  plainName: string;
  /** The nomenclature exactly as the order paper writes it. Never paraphrased. */
  officialName: string;
  category: MicroCategory;
  /** DLA's NAICS code for the order, or null. Read by the profile-fit rank and
   *  the category suggestion — never by permission or price. */
  naics: string | null;
  // Every dibbs_* field and due_date is nullable in the schema AND in practice.
  // Live coverage on 200 records posted 18 Aug 2026 is in the research file.
  /** `dibbs_quantity`, 99.5% covered. Counts UNITS OF ISSUE, not items. */
  quantity: number | null;
  /** `ui`, 100% covered. 9% of live records are NOT "EA" — the 100x surface. */
  unitOfIssue: string | null;
  /** Acquisition method. **A STRING**, as the API returns it — live values seen:
   *  "1" (30), "3" (25), "2" (1), "0" (1) of 57. It was typed as a numeric union,
   *  which cannot hold "0" and would coerce it to a falsy number. */
  amc: string | null;
  /** Acquisition suffix. Live values across 57 records: G 14 · C 10 · D 10 ·
   *  B 7 · P 6 · Z 4 · L 3 · R 2 · "0" 1. **Our open set is {G,Z}** — see
   *  `OPEN_SUFFIXES` in microPurchases/relevance.ts, which is the only place it
   *  is decided. This line used to read {G,Z,L,U}: L and U were dropped on
   *  19 August 2026 at a measured cost of 1.1% of inventory (34.8% -> 33.7%),
   *  and the stale copy here described a permission rule one third wider than
   *  the one that ships, in the file a builder reads to understand the data.
   *  See PRD 15 B9: the value set still has no primary DLA source, and it
   *  decides 70% of the corpus. */
  amsc: string | null;
  /** `last_price` — the most recent award's unit cost. Verified: it equals
   *  `awards[0].unitCost` on 55 of 55 live records that carry both.
   *  PER UNIT OF ISSUE. 96.5% covered. */
  lastPricePerUnit: number | null;
  /** The date of the award `lastPricePerUnit` came from — i.e. `awards[0].awardedOn`.
   *  **This closes blocking question B4.** The NSN object carries no date field,
   *  which is why this was recorded as sourceless; the date lives on the award. */
  lastPriceDate: string | null;
  /** `unit_price` — DLA's STANDARD / catalogue price, tied to no award. On NSN
   *  4730016648684 it is $30.03 against a $21.53 last award: 39% apart. Kept for
   *  context; never used for pricing advice. */
  standardPrice: number | null;
  /** `dibbs_days_to_deliver`, 95% covered. Live median 86 days, range 11-398 —
   *  so "30 days or more" matches 97% of orders and "60 or more" 83%. */
  deliveryDays: number | null;
  /** `set_aside`. **50.5% of live DIBBS orders carry one** — SBA, WOSB, SDVOSBC,
   *  HZC. Not an edge case: every other order. The disclosure ships; the gate is
   *  parked (PRD 11.3). */
  setAside: string | null;
  /** `dibbs_delivery_fob`, a STRING of "ORIGIN" | "DESTINATION", mapped to a
   *  boolean here. **95% are ORIGIN — she pays the freight almost always.** */
  fobDestination: boolean | null;
  // ── The three dibbs_* flags are NULLABLE, and null is not false ───────────
  //
  // All three were typed `boolean` while their own coverage notes below record
  // the live null rate. Null collapsed to false, so "the order paper does not
  // say" became "no" — the drawings case flatly told her DLA lets anyone quote
  // on the ~64% of mature records where the flag is simply absent. That is
  // D-B1 verbatim: nullability not taken from the schema, making a designed
  // coverage tier unreachable. `fobDestination` above is the pattern to copy —
  // it is nullable and its render carries a third "the order paper does not
  // say" state.
  //
  // NOTE FOR THE INGEST: scripts/build-micro-fixtures.ts writes
  // `o.dibbs_fast_award_flag === true`, which coerces null to false at the
  // boundary. Until that is changed to pass the value through, a regenerated
  // corpus cannot carry a null in any of these three.
  //
  // ── WHAT A `false` IN THIS FILE MEANS — one rule, all three flags ────────
  //
  // The feed returns True or nothing. It never returns False on any of the
  // three: `repeats` is measured directly (190 true / 10 null / 0 false), and
  // for the other two the docblocks' own live figures leave no room for one
  // (fast award 16.4% true + ~84% absent; drawings 36% true + ~64% absent at
  // maturity). Our ingest then writes `flag === true`, turning every absent
  // into `false`.
  //
  // So **every `false` on a real record below is an ingest artifact meaning
  // "the order paper did not say". It is never evidence of "no", on any of the
  // three.** Which of the sixteen real records truly carried each flag is not
  // recoverable, and guessing is how the invented corpus this one replaced got
  // built. THE FIX IS THE BUILD SCRIPT, not hand-edits here.
  //
  // ALL THREE are now written back to `null` on the real records. The last one
  // to be swept was `needsDrawings`, and the argument for holding it back has
  // been overtaken:
  //
  //   · `repeats` and `fastAward` — swept first, on the argument that NOTHING
  //     in the feature read either as `=== false`, so `false` and `null`
  //     rendered the same pixel and the rewrite was free. That put the "we do
  //     not know" tier on real records instead of on synthetics only (D-B1).
  //
  //     **THAT ARGUMENT IS NOW SPENT, AND THE SWEEP MUST NOT BE REPEATED ON
  //     ITS STRENGTH.** The three-state pass that followed gave `repeats` real
  //     `=== false` readers — the card's third mark, the filter, the pricing
  //     ladder, the cash question — so `null` and `false` are now different
  //     pixels: `false` reads "not a year of orders", `null` reads "The order
  //     paper does not say if it is a year of orders." The sweep was right and
  //     stays; what is gone is the reason that made it costless. A future
  //     rewrite of any tri-state field on this fixture changes what renders,
  //     and has to be argued on the data rather than on this paragraph.
  //   · `needsDrawings` — swept 20 August 2026, twelve real records. It was
  //     held back because `false` was the only route to the plain "You can bid
  //     this one.", so sweeping it would have traded D-B1 for D-B3. The
  //     coordinator's decision on FG1 broke that trade instead of taking
  //     either side of it: the drawings caveat MOVED OUT of the verdict and
  //     into the "Before you quote" block, where every other thing-to-check
  //     already lives. The verdict answers whether she may bid; the trap block
  //     says what to check first. So the plain verdict no longer depends on a
  //     `false` this feed never returns, and the fixture can finally show the
  //     live shape — which is the whole point of it. Re-derived after the
  //     sweep: 4 of 16 real records carry `true`, 12 carry `null`, none carry
  //     `false`.
  //
  // A synthetic may carry a `false` where a non-null value is needed to isolate
  // a DIFFERENT flag. Three still do, and each is load-bearing for the
  // isolation named beside it below rather than for a screen.
  //
  // This inventory said "three" on 19 August while FIVE `false`s were in the
  // file: mp-093 and mp-094 also carried `fastAward: false`, the same class of
  // invented state, added the same day. The gate written to catch it reads
  // `real.every(o => o.fastAward !== false)` — REAL records only — so it was
  // structurally unable to see either. Both are now `true`, which is a value
  // the feed does return, and which each record needs to be NON-null anyway to
  // keep the isolation it exists for. Count the file, do not trust this line:
  // `grep -n 'fastAward: false\|repeats: false\|needsDrawings: false' \
  //    src/lib/mock/microPurchaseOrders.ts | grep -v '//'`
  // -> three lines, 20 August 2026, all of them the `needsDrawings` below.
  //   · mp-090 `needsDrawings: false` — holds the fast-award isolation (that
  //     record reaches `fastAward: null` WITHOUT the other two also being null).
  //   · mp-094 `needsDrawings: false` — same job for `repeats: null`.
  //   · mp-092 `needsDrawings: false` — the last record on which
  //     `needsDrawings === false` is reachable at all, which is what keeps the
  //     unqualified "You can bid this one." pinned by an assertion.
  // All three retire when the build script stops coercing and the corpus is
  // regenerated. A synthetic must never author a `false` that a SCREEN would
  // read as "no", and none of these three does.
  /** `dibbs_fast_award_flag` — **16.4% of 1,200 live records, and 44% at the
   *  eight-day mark.** An earlier note here said 0 of 200 and called the feature
   *  unreachable; that sample was drawn one day after posting. DLA's PACE
   *  auto-evaluation commences three business days after the issue date, so a
   *  fresh solicitation simply has not entered it yet. The feature stands.
   *  **Null on the ~84% that carry no flag** — DLA has not run its automatic
   *  evaluation, which is not the same as having ruled it out. There is no
   *  live False, so every real record below reads `null` here (see the rule
   *  above); the sixteen were pulled one day old, before PACE runs, which is
   *  why none of them carries the flag. */
  fastAward: boolean | null;
  /** `dibbs_aidc_flag` — a one-year contract with repeat orders. Live: True on
   *  190 of 200, null on 10, **never False**. So this is the NORMAL case, not
   *  the special one, and copy that treats it as remarkable will be wallpaper.
   *  Because the live feed never returns False, every `false` in this corpus
   *  was a null the ingest coerced; they are written as `null` below — on the
   *  synthetics too, since a hand-written False is a state the feed cannot
   *  produce. */
  repeats: boolean | null;
  /** `dibbs_tech_docs_flag` — 2% on day-old postings, **36% at maturity**.
   *  Null is the majority state at maturity and it means we cannot tell whether
   *  drawings are needed. It must never render as "no drawings needed".
   *  Swept to null on the real records like the other two — see the rule above.
   *  The fact is carried in the "Before you quote" block, not in the verdict:
   *  a caveat riding on ~64% of open orders is wallpaper, and she would learn
   *  to read past the 36% where drawings really are required. */
  needsDrawings: boolean | null;
  /** `dibbs_status`. Values: **Open · Awarded · Pending · Removed · Cancelled.**
   *  **"Pending" means posted but not yet open for quoting** — a transient state
   *  that clears within days (190 of 200 at one day old, zero at eight days).
   *  At maturity ~88% are Open, so filtering to Open costs almost nothing. */
  dibbsStatus: string | null;
  postedOn: string;
  closesOn: string | null;
  /** `agency.agency_name`. */
  buyer: string;
  /** `primary_contact_email` — the object carries `contact_phone` too, which is
   *  what a contracting officer needs to check her past performance. */
  buyerContact: { name: string; email: string; phone: string | null };
  /** `part_numbers` — the RAW string, deliberately NOT split. The delimiter is
   *  still unverified, and splitting on a guess can invent a part number that
   *  does not exist. Individual part numbers are available structured, on
   *  `approvedSources[]` and `awards[]`. */
  partNumbers: string | null;
  /** `nsn.suppliers[]` — DLA-designated approved sources. Context, not a gate. */
  approvedSources: ApprovedSource[];
  /** `nsn.awards[]` — who won it, at what price, when. This is the field that
   *  answers "who won and at what price". Non-empty on 96.5% of live records. */
  awards: MicroAward[];
};
