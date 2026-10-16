/**
 * THE PERMISSION VERDICT NOW HAS A PRIMARY SOURCE, AND THIS FILE HOLDS IT TO IT.
 *
 * Every claim asserted here was read on 10 September 2026 from
 * **DFARS PGI 217.75, effective 05/07/2026** — sections 2-201.1 (acquisition
 * method codes), 2-201.2 (acquisition method suffix codes) and Exhibit I (valid
 * AMC/AMSC combinations), published free at
 * `https://www.acquisition.gov/dfarspgi/pgi-217.75-acquisition-replenishment-parts`.
 *
 * The three commercial references the verdict used to ride on are gone. Each
 * case below quotes the paragraph it enforces, so a future reader can check the
 * code against the regulation without leaving the file.
 */
import { describe, it, expect } from "vitest";
import {
  codesKnown,
  eligibleByCode,
  gapNote,
  isCommercial,
  isSarFixable,
  mayBid,
  ourGap,
  restrictionOf,
} from "./relevance";
import type { MicroOrder } from "./order";
import { LIVE_MAPPED_ORDERS } from "./liveMapperOutput.fixture";

/** A real mapped order with its two acquisition codes replaced. Built off the
 *  live corpus rather than hand-written, for the reason the fixture header
 *  gives: a hand-written `MicroOrder` drifts from the mapper. */
const coded = (amc: string | null, amsc: string | null): MicroOrder => ({
  ...LIVE_MAPPED_ORDERS[0],
  amc,
  amsc,
});

/** Exhibit I, transcribed. `o` = valid combination, `X` = invalid. A letter the
 *  exhibit does not list at all is reserved or not authorised, so it pairs with
 *  no AMC. */
const EXHIBIT_I: Record<string, string> = {
  A: "12345",
  B: "12345",
  C: "12345",
  D: "345",
  G: "12",
  H: "12345",
  K: "12345",
  L: "12345",
  M: "12345",
  N: "12345",
  O: "0",
  P: "12345",
  Q: "12345",
  R: "12345",
  S: "12345",
  T: "12",
  U: "12345",
  V: "12345",
  Y: "12345",
  Z: "12345",
};

const METHODS = ["1", "2", "3", "4", "5"];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

describe("AMSC D — what the primary source actually says", () => {
  // 2-201.2(d): "The data needed to acquire this part competitively is not
  // physically available, it cannot be obtained economically, nor is it
  // possible to draft adequate specifications or any other adequate, economical
  // description of the material for a competitive solicitation. AMCS 3, 4, or 5
  // are valid."
  //
  // Our two secondary references disagreed — one read D as a restricted source
  // WITH an approval route, the other as the Government being unable to compete
  // the item. The document says the second. So D is not a route.

  it("AMSC D carries no Source Approval Request route", () => {
    // THE MUTATION TARGET. Give D the route-bearing reading — put it back in
    // `SAR_FIXABLE_SUFFIXES` — and this case fails.
    const order = coded("3", "D");

    expect(isSarFixable(order)).toBe(false);

    const r = restrictionOf(order);
    expect(r).not.toBeNull();
    expect(r?.route).toBe("none");
    expect(r?.fixable).toBe(false);
    expect(r?.body).not.toMatch(/Source Approval Request/i);
    expect(r?.body).not.toMatch(/\bform\b/i);
  });

  it("says the reason the source gives, not the data-rights one", () => {
    // The Government cannot describe the part well enough to compete it. That
    // is a different fact from P and R, where it holds no RIGHTS to the data,
    // and the two must not share one sentence — the S/V/Y correction in
    // relevance.ts is the same mistake in the other direction.
    const d = restrictionOf(coded("3", "D"))?.body;
    const p = restrictionOf(coded("3", "P"))?.body;

    expect(d).toBeTruthy();
    expect(d).not.toBe(p);
    expect(d).not.toMatch(/rights/i);
  });

  it("is not open, and never puts an order on the board", () => {
    for (const m of METHODS) expect(mayBid(coded(m, "D"))).toBe(false);
  });
});

describe("Exhibit I — an impossible pair is a data error, not a verdict", () => {
  it("refuses every combination Exhibit I marks invalid", () => {
    for (const letter of LETTERS) {
      const valid = EXHIBIT_I[letter] ?? "";
      for (const m of METHODS) {
        const r = restrictionOf(coded(m, letter));
        if (valid.includes(m)) {
          // A valid pair is ruled on its merits. It may be open (null) or
          // restricted, but it is never called a data error.
          expect(r?.headline ?? "").not.toMatch(/do not go together/);
        } else {
          expect(r?.headline ?? "").toMatch(/do not go together/);
        }
      }
    }
  });

  it("names 1D and 2D specifically, because the live corpus carries 1D", () => {
    // 2-201.2(d) allows AMCs 3, 4 and 5 only, and Exhibit I marks 0, 1 and 2
    // invalid. `1D` is not merely restrictive — it cannot be a true record.
    for (const m of ["1", "2"]) {
      const r = restrictionOf(coded(m, "D"));
      expect(r?.headline).toMatch(/do not go together/);
      // NOT A PERMISSION VERDICT. `fixable` false and the route sends her to a
      // human, because we cannot say which of the two codes is the wrong one.
      expect(r?.fixable).toBe(false);
      expect(r?.route).toBe("unknown");
    }
  });

  it("marks 3G, 4G and 5G invalid — G is an AMC 1 or 2 code", () => {
    // 2-201.2(g): "AMCs 1 or 2 are valid."
    for (const m of ["3", "4", "5"]) {
      expect(restrictionOf(coded(m, "G"))?.headline).toMatch(/do not go together/);
    }
  });

  it("never lets a data error say she may bid", () => {
    for (const letter of LETTERS) {
      const valid = EXHIBIT_I[letter] ?? "";
      for (const m of METHODS) {
        if (!valid.includes(m)) expect(mayBid(coded(m, letter))).toBe(false);
      }
    }
  });

  it("lets DLA's '0' sentinel win over the pair check", () => {
    // 2-201.1(a): AMC 0 is "The part was not assigned AMC 1 through 5 when it
    // entered the inventory, nor has it ever completed screening." That is an
    // admitted gap, not a contradiction, and the corpus carries `0G` — which
    // Exhibit I does mark invalid. The unreadable sentence owns it.
    const sentinel = coded("0", "G");

    expect(codesKnown(sentinel)).toBe(false);
    expect(restrictionOf(sentinel)).toBeNull();
  });

  it("calls a reserved or unauthorised letter a data error too", () => {
    // 2-201.2 lists E, F, J and W as "(Reserved)" and I and X as "(Not
    // authorized)". Exhibit I gives none of them a row, so no AMC pairs with
    // them. A record carrying one is wrong, not unruled.
    for (const letter of ["E", "F", "I", "J", "W", "X"]) {
      expect(restrictionOf(coded("1", letter))?.headline).toMatch(/do not go together/);
    }
  });
});

describe("what the source CONFIRMED, now for a citable reason", () => {
  it("G is the open letter — the only one the source calls full and open", () => {
    // 2-201.2(g): "(This is the only AMSC that implies that parts are
    // candidates for full and open competition...)"
    expect(mayBid(coded("1", "G"))).toBe(true);
    expect(mayBid(coded("2", "G"))).toBe(true);
  });

  it("Z is the commercial letter and stays biddable under AMC 1 or 2", () => {
    // 2-201.2(z): "This part is a commercial product, nondevelopmental item, or
    // commercially available off-the-shelf item."
    expect(isCommercial(coded("1", "Z"))).toBe(true);
    expect(mayBid(coded("1", "Z"))).toBe(true);
    expect(mayBid(coded("2", "Z"))).toBe(true);
  });

  it("C is the Source Approval Request letter, and the source names its route", () => {
    // 2-201.2(c): "An alternate source must qualify in accordance with the
    // design control activity's procedures, as approved by the cognizant
    // Government engineering activity."
    expect(isSarFixable(coded("1", "C"))).toBe(true);
    expect(isSarFixable(coded("3", "C"))).toBe(true);
    expect(restrictionOf(coded("3", "C"))?.route).toBe("sar");
  });

  it("L and U stay out of the open set", () => {
    // 2-201.2(l) is the below-threshold screening code and 2-201.2(u) is the
    // breakout-cost code. Neither is an invitation to bid, and 2-201.2(g) says
    // G is the only letter implying full and open competition.
    for (const letter of ["L", "U"]) {
      for (const m of METHODS) expect(mayBid(coded(m, letter))).toBe(false);
    }
  });
});

describe("what the source CONTRADICTED", () => {
  it("AMSC B carries no Source Approval Request route either", () => {
    // 2-201.2(b): "Suitable technical data, Government data rights, or
    // manufacturing knowledge are not available to permit acquisition from
    // other sources, nor qualification testing of another part, nor use of a
    // second source part in the intended application."
    //
    // Our references grouped B with C as "requires a Source Approval Request".
    // The document denies B the two mechanisms a route would use, and gives C
    // an explicit qualification procedure in the very next paragraph. The
    // document wins.
    const order = coded("1", "B");

    expect(isSarFixable(order)).toBe(false);
    expect(restrictionOf(order)?.route).toBe("none");
    expect(restrictionOf(order)?.body).not.toMatch(/Source Approval Request/i);
  });

  it("gives B its own reason rather than C's or P's", () => {
    const b = restrictionOf(coded("1", "B"))?.body;

    expect(b).toBeTruthy();
    expect(b).not.toBe(restrictionOf(coded("1", "C"))?.body);
    expect(b).not.toBe(restrictionOf(coded("1", "P"))?.body);
    expect(b).not.toBe(restrictionOf(coded("3", "D"))?.body);
  });
});

describe("the measured corpus impact", () => {
  // MEASURED OVER `LIVE_MAPPED_ORDERS` — 40 orders of real mapper output, the
  // largest corpus of live DLA codes this repository holds. It is NOT the
  // 267-record cut the older comments in relevance.ts quote: that file,
  // `docs/micro-purchases/research/awards-design-2026-08-19.md`, does not exist
  // in this worktree, so the 32.2% and 18.4% shares recorded against it cannot
  // be reproduced and these figures are not comparable with them.
  //
  // Counted by the sentence each order reads, which is what she sees, and by
  // `restrictionOf()` directly rather than through `queryOrders()` — the board's
  // date and status scoping would otherwise decide the denominator.
  const tally = () => {
    const heads: Record<string, string[]> = {};
    for (const o of LIVE_MAPPED_ORDERS) {
      const r = restrictionOf(o);
      const key = r ? r.headline : mayBid(o) ? "<biddable>" : "<unreadable>";
      (heads[key] ??= []).push(`${o.amc}${o.amsc}`);
    }
    return heads;
  };
  const heads = tally();
  const group = (k: string) => (heads[k] ?? []).slice().sort();

  it("leaves ONE order in 'Not clear who may sell this one'", () => {
    // Nine before this feature: six `3D`, two `1D` and one `1H`. Only the H is
    // a letter we still hold no ruling for.
    expect(group("Not clear who may sell this one.")).toEqual(["1H"]);
  });

  it("sends the six valid D records to a dead end with their own reason", () => {
    // Where the other eight went. Six `3D` are a lawful pair the source rules
    // on, and they land beside B, P and R under one headline and three
    // different sentences.
    expect(group("DLA is not taking new sellers for this one.")).toEqual([
      "1B",
      "1B",
      "3D",
      "3D",
      "3D",
      "3D",
      "3D",
      "3D",
      "3P",
      "3P",
      "3R",
      "3R",
    ]);
  });

  it("sends the two impossible pairs to the data-error group", () => {
    // And both of them are `1D`, which is the pair Exhibit I rejects.
    expect(group("DLA's two codes for this order do not go together.")).toEqual(["1D", "1D"]);
  });

  it("leaves the Source Approval Request tier holding C alone", () => {
    // Eight before, six now: the two `1B` records left with B.
    expect(group("Only approved sellers can quote this one.")).toEqual([
      "1C",
      "1C",
      "3C",
      "3C",
      "3C",
      "3C",
    ]);
  });

  it("MOVES NO ORDER ONTO THE BOARD", () => {
    // THE DIRECTION THAT MATTERS. Every figure above is an order moving from
    // "I am not sure" toward "you may not", which costs her an order she was
    // never going to win. Not one moves the other way, which would cost her an
    // afternoon on a bid she cannot win — the worse error, and the one this
    // surface abstains to avoid.
    expect(group("<biddable>")).toEqual(["1G", "1G", "1G", "1G", "1Z", "2G", "2G", "2Z", "2Z"]);
    expect(group("<unreadable>")).toHaveLength(10);
  });

  it("leaves three orders on the mentor route, against nine before", () => {
    // The figure `heldBack()`'s comment quotes, enforced rather than asserted.
    // `route: "unknown"` is the mentor tier: one unruled letter plus the two
    // impossible pairs. It held nine before — the same `1H` and eight D records.
    const mentor = LIVE_MAPPED_ORDERS.filter((o) => restrictionOf(o)?.route === "unknown");

    expect(mentor).toHaveLength(3);
  });

  it("still rules on the same orders it ruled on before", () => {
    // The pools did not move; the letters were re-ruled inside them. Nothing
    // here re-reads a record, so nothing may leave or join the admitted gap.
    const ruled = Object.entries(heads)
      .filter(([k]) => k !== "<unreadable>")
      .flatMap(([, v]) => v);

    expect(ruled).toHaveLength(30);
    expect(LIVE_MAPPED_ORDERS).toHaveLength(40);
  });
});

// ── THE REST OF THE LETTERS (DH-33) ───────────────────────────────────────
//
// DH-29 ruled seven letters and left nineteen falling through to "I am not sure
// who may sell this one." Everything below was read on 10 September 2026 from
// the same fetch of DFARS PGI 217.75 the header names, and re-verified against
// the live page on that day: all 26 paragraphs of 2-201.2 match
// `backend/src/small-orders/small-orders.acquisition-codes.ts` word for word.

/** The headline each tier prints, so a case names the tier and not a string. */
const HEAD = {
  biddable: "<biddable>",
  unreadable: "<unreadable>",
  sar: "Only approved sellers can quote this one.",
  noRoute: "DLA is not taking new sellers for this one.",
  commercial: "DLA is buying this commercial part from one supplier.",
  oneSupplier: "Only one supplier can fill this one.",
  approved: "DLA is only asking the sellers it already has for this one.",
  qpl: "Only sellers on DLA's qualified list can quote this one.",
  unruled: "Not clear who may sell this one.",
  dataError: "DLA's two codes for this order do not go together.",
};

/** What the board says about one AMC/AMSC pair, as one string. */
const verdictOf = (amc: string, amsc: string): string => {
  const order = coded(amc, amsc);
  const r = restrictionOf(order);
  if (r) return r.headline;
  return mayBid(order) ? HEAD.biddable : HEAD.unreadable;
};

/**
 * The eleven letters whose paragraph says AMC 3, 4 or 5 means one source.
 *
 * Transcribed here from 2-201.2 independently of `relevance.ts`, so the two
 * lists have to agree rather than share a definition:
 * (a), (h), (l), (q), (u), (v), (y) "If one source is available, AMCs 3, 4, or
 * 5 are valid." · (k) "If one source has such castings and cannot provide them
 * to other sources" · (m) "If only one set of tooling exists and cannot be made
 * available to another source" · (n) "If the test cannot be made available for
 * the competitive manufacture of the part" · (s) "If one source is approved".
 */
const ONE_SOURCE_LETTERS = ["A", "H", "K", "L", "M", "N", "Q", "S", "U", "V", "Y"];

describe("every AMSC letter the PGI defines carries a tier", () => {
  it("leaves no pair without a named outcome", () => {
    const named = Object.values(HEAD);
    for (const letter of LETTERS) {
      for (const m of METHODS) {
        expect(named).toContain(verdictOf(m, letter));
      }
    }
  });

  it("rules the eleven one-source letters under AMC 3, 4 and 5", () => {
    for (const letter of ONE_SOURCE_LETTERS) {
      for (const m of ["3", "4", "5"]) {
        expect(verdictOf(m, letter)).toBe(HEAD.oneSupplier);
      }
    }
  });

  it("keeps ten of those letters abstaining under AMC 1 and 2", () => {
    // 2-201.2(g) calls G "the only AMSC that implies that parts are candidates
    // for full and open competition" and names K, M, N, Q and S as codes that
    // "may imply limited competition". Only Q is written into
    // `APPROVED_SOURCE_REASONS`; K, M, N and S each need their own paragraph
    // read and their own sentence written, and A, H, L, U, V and Y are not
    // named by (g) at all. All ten reach a mentor.
    for (const letter of ONE_SOURCE_LETTERS.filter((l) => l !== "Q")) {
      for (const m of ["1", "2"]) {
        expect(verdictOf(m, letter)).toBe(HEAD.unruled);
      }
    }
  });

  it("rules Q as limited competition under AMC 1 and 2, and only there", () => {
    // 2-201.2(g): G is "the only AMSC that implies that parts are candidates
    // for full and open competition. Other AMSCs such as K, M, N, Q, and S may
    // imply limited competition when two or more independent sources exist yet
    // the technical data package is inadequate for full and open competition."
    // 2-201.2(q): "The Government does not have adequate data, lacks rights to
    // data, or both needed to purchase this part from additional sources ... If
    // at least two sources exist, AMCs 1 or 2 are valid."
    //
    // THE MUTATION TARGET. Empty `APPROVED_SOURCE_REASONS` and these two pairs
    // fall back to the mentor route, which is where 775 orders sat.
    for (const m of ["1", "2"]) {
      expect(verdictOf(m, "Q")).toBe(HEAD.approved);
    }
    // The method still owns 3, 4 and 5: (q)'s other branch is "If one source is
    // available, AMCs 3, 4, or 5 are valid", and that is a different sentence.
    for (const m of ["3", "4", "5"]) {
      expect(verdictOf(m, "Q")).toBe(HEAD.oneSupplier);
    }
  });

  it("gives the limited-competition tier its own route, and no form", () => {
    const r = restrictionOf(coded("1", "Q"));

    expect(r?.route).toBe("approved");
    expect(r?.fixable).toBe(false);
    // NOT THE SOURCE APPROVAL REQUEST TIER. 2-201.2(q) names no procedure by
    // which another seller qualifies, so naming one would send her to file a
    // request that cannot succeed — the reason B and D left that tier.
    expect(r?.body).not.toMatch(/Source Approval Request/i);
    const sar = restrictionOf(coded("1", "C"));
    expect(r?.headline).not.toBe(sar?.headline);
    expect(r?.body).not.toBe(sar?.body);
  });

  it("states the two facts (q) carries, and claims nothing about the member", () => {
    const body = restrictionOf(coded("1", "Q"))?.body ?? "";

    // At least two sources exist and DLA is competing among them.
    expect(body).toMatch(/more than one seller/i);
    // The Government lacks the data or the rights to add another.
    expect(body).toMatch(/data or the rights/i);
    // NO FIRST PERSON, and no claim about who she is. We hold no member CAGE
    // code anywhere on this surface, so neither "you are approved" nor "you are
    // not" is available.
    expect(body).not.toMatch(/\b(I|my|we|our)\b/);
    expect(body).not.toMatch(/\byou\b/i);
  });

  it("is a ruling, not one of our gaps, and stays out of For you", () => {
    for (const m of ["1", "2"]) {
      const order = coded(m, "Q");

      // It left the unruled pool: the record states the code AND we now hold a
      // verdict for it.
      expect(ourGap(order)).toBeNull();
      // And it never becomes permission. `mayBid()` is the gate For you reads
      // through `eligibleByCode()`, and nothing tells us she is an approved
      // seller.
      expect(mayBid(order)).toBe(false);
      expect(eligibleByCode(order)).toBe(false);
      expect(gapNote(order)).toBeNull();
    }
  });

  it("rules T as a qualified-products-list order under AMC 1 and 2, and only there", () => {
    // 2-201.2(t), verbatim: "Acquisition of this part is controlled by
    // qualified products list (QPL) procedures. Competition for this part is
    // limited to sources which are listed on or are qualified for listing on
    // the QPL at the time of award (see FAR Part 9 and DFARS Part 209). AMCs 1
    // or 2 are valid."
    //
    // THE MUTATION TARGET. Empty `QPL_SUFFIXES` and these two pairs fall back
    // to the mentor route, which is where 482 open orders sat.
    expect(verdictOf("1", "T")).toBe(HEAD.qpl);
    expect(verdictOf("2", "T")).toBe(HEAD.qpl);
    // Exhibit I gives T the row "12" and nothing else, so a 3T, 4T or 5T
    // record is a claim DLA's own coding rules reject. It was a data error
    // before this tier existed and it stays one.
    for (const m of ["3", "4", "5"]) expect(verdictOf(m, "T")).toBe(HEAD.dataError);
  });

  it("gives the qualified-list tier its own route, and never the wrong form", () => {
    const r = restrictionOf(coded("1", "T"));

    expect(r?.route).toBe("qpl");
    expect(r?.fixable).toBe(false);
    // NOT THE SOURCE APPROVAL REQUEST TIER. (t) names a qualified products
    // list, (c) names the design control activity's own procedure, and sending
    // her to file the wrong one is the permissive error B and D left that tier
    // over.
    expect(r?.body).not.toMatch(/Source Approval Request/i);
    const sar = restrictionOf(coded("1", "C"));
    expect(r?.headline).not.toBe(sar?.headline);
    expect(r?.body).not.toBe(sar?.body);
    // NOT THE APPROVED-SELLERS TIER EITHER. (q) names no procedure and its
    // sentence says so in words; (t) names one, so "there is no form for this
    // one" would be false here.
    const approved = restrictionOf(coded("1", "Q"));
    expect(r?.headline).not.toBe(approved?.headline);
    expect(r?.body).not.toBe(approved?.body);
    expect(r?.body).not.toMatch(/no form/i);
  });

  it("states the route (t) names, and is honest about when it pays off", () => {
    const body = restrictionOf(coded("1", "T"))?.body ?? "";

    // The list, and the two ways onto it that (t) allows.
    expect(body).toMatch(/qualified products list/i);
    expect(body).toMatch(/qualified for listing/i);
    // The route itself: a seller qualifies the part with the government first.
    expect(body).toMatch(/qualifying the part with the government/i);
    // And the honest limit on it — this order closes first.
    expect(body).toMatch(/later orders/i);
    // NO FIRST PERSON. Hunter never says "I" about a rule DLA wrote.
    expect(body).not.toMatch(/\b(I|my|we|our)\b/);
    // NO PROMISED TIMESCALE. We do not know how long qualification takes.
    expect(body).not.toMatch(/\b(week|weeks|month|months|day|days|year|years)\b/i);
  });

  it("is a ruling, not one of our gaps, and stays out of For you", () => {
    for (const m of ["1", "2"]) {
      const order = coded(m, "T");

      expect(ourGap(order)).toBeNull();
      // Nothing on this surface holds the member's CAGE code, so nothing can
      // say she is on DLA's qualified list. The verdict never becomes
      // permission.
      expect(mayBid(order)).toBe(false);
      expect(eligibleByCode(order)).toBe(false);
      expect(gapNote(order)).toBeNull();
    }
  });

  it("treats a reserved or unauthorised letter as a data error, not an abstention", () => {
    // 2-201.2 marks E, F, J and W "(Reserved)" and I and X "(Not authorized)".
    // DH-29 built this distinction for the impossible AMC/AMSC pair and it
    // covers these six for free: Exhibit I gives none of them a row, so no
    // method pairs with them. No second mechanism was added.
    for (const letter of ["E", "F", "I", "J", "W", "X"]) {
      for (const m of METHODS) expect(verdictOf(m, letter)).toBe(HEAD.dataError);
    }
  });

  it("never lets AMSC O reach a verdict", () => {
    // 2-201.2(o): "The part was not assigned an AMSC when it entered the
    // inventory ... Only AMC O is valid" — where that letter stands for the
    // digit 0. So `0O` is the admitted gap `codesKnown()` owns, and every
    // other pair on this row is a data error.
    expect(codesKnown(coded("0", "O"))).toBe(false);
    expect(restrictionOf(coded("0", "O"))).toBeNull();
    for (const m of METHODS) expect(verdictOf(m, "O")).toBe(HEAD.dataError);
  });
});

describe("the AMC's closing effect on an open suffix", () => {
  it("gives the commercial letter its own tier under AMC 3, 4 and 5", () => {
    // THE MUTATION TARGET. Give `3Z` an open verdict — put "3" into
    // `OPEN_METHODS` — and the direction-of-error case below fails.
    //
    // 2-201.2(z): "This part is a commercial product, nondevelopmental item, or
    // commercially available off-the-shelf item ... If one source is available,
    // AMCs 3, 4, or 5 are valid."
    for (const m of ["3", "4", "5"]) {
      const r = restrictionOf(coded(m, "Z"));

      expect(r?.headline).toBe(HEAD.commercial);
      expect(r?.route).toBe("none");
      expect(r?.fixable).toBe(false);
      expect(r?.body).toMatch(/commercial product/i);
      expect(r?.body).toMatch(/one supplier/i);
    }
  });

  it("no longer sends a commercial part under a sole-source method to a mentor", () => {
    // The defect DH-33 was raised on: the board said "I am not sure" about an
    // order it understood completely. 80 of them on the ledger's cut.
    for (const m of ["3", "4", "5"]) {
      expect(restrictionOf(coded(m, "Z"))?.route).not.toBe("unknown");
    }
  });

  it("keeps the two closed tiers apart, in the headline and in the body", () => {
    // A commercial part she could buy herself and a part only one company
    // makes are different facts, and the restricted page groups on the
    // headline. One sentence over both would be the S/V/Y mistake again.
    const commercial = restrictionOf(coded("3", "Z"));
    const oneSupplier = restrictionOf(coded("3", "H"));

    expect(commercial?.headline).not.toBe(oneSupplier?.headline);
    expect(commercial?.body).not.toBe(oneSupplier?.body);
    // Neither claims "the maker": 2-201.1(f) makes AMC 5 a sole source
    // contractor "which is not the actual manufacturer", and the live cut
    // carries `5Z`.
    for (const r of [restrictionOf(coded("5", "Z")), restrictionOf(coded("5", "H"))]) {
      expect(r?.body).not.toMatch(/maker|manufacturer/i);
    }
  });

  it("offers no form on either closed tier", () => {
    // Sending her to file a Source Approval Request on an order DLA is not
    // competing is the permissive error this file's header calls worse than
    // saying nothing.
    for (const letter of ["Z", ...ONE_SOURCE_LETTERS]) {
      const r = restrictionOf(coded("3", letter));

      expect(r?.fixable).toBe(false);
      expect(r?.body).not.toMatch(/Source Approval Request/i);
      expect(r?.body).not.toMatch(/\bform\b/i);
    }
  });
});

describe("MOVES NO ORDER ONTO THE BOARD", () => {
  // THE DIRECTION THAT MATTERS, AND IT IS PROVED RATHER THAN SAMPLED. Every
  // input `mayBid()` reads is one of the two acquisition codes, so enumerating
  // the pairs enumerates the function. This holds over any corpus, today's and
  // any later one, which is the property DH-29 built into `mayBid()` itself.
  const CODES = [null, "0", ...METHODS];

  it("says she may bid on exactly four pairs, and on no other input", () => {
    const open: string[] = [];
    for (const m of [...CODES]) {
      for (const a of [null, "0", ...LETTERS]) {
        if (mayBid(coded(m, a))) open.push(`${m}${a}`);
      }
    }

    expect(open.sort()).toEqual(["1G", "1Z", "2G", "2Z"]);
  });

  it("never returns a restriction that reads as an invitation", () => {
    // A tier that costs her an order she could not have won is the cheap error.
    // A tier that costs her an afternoon is not. So no closed tier may carry
    // `fixable` without the Source Approval Request route that earns it.
    for (const letter of LETTERS) {
      for (const m of METHODS) {
        const r = restrictionOf(coded(m, letter));
        if (r?.fixable === true) expect(r.route).toBe("sar");
      }
    }
  });

  it("returns no restriction only where she may bid or we could not read", () => {
    // The other way the direction could break: a readable, non-open pair
    // falling out of `restrictionOf()` as `null` renders on no restricted list
    // at all, which is the silent loss `isUnverifiedSuffix()` was built for.
    for (const letter of [...LETTERS, "0"]) {
      for (const m of CODES) {
        const order = coded(m, letter);
        if (restrictionOf(order) === null) {
          expect(mayBid(order) || !codesKnown(order)).toBe(true);
        }
      }
    }
  });
});

// ── THE LIVE 500-ROW CUT, SHARED BY EVERY MEASUREMENT BELOW ──────────────
//
// Hoisted to module scope so DH-33's tally and DH-34's are counted over ONE
// census rather than two copies of it. A second transcription would be a
// second corpus the moment either was corrected.
/**
 * The board's first page, counted by acquisition code pair.
 *
 * MEASURED 10 September 2026 against the live corpus, replaying the feed's
 * own query: `{ sourceType: 'dibbs', dibbsStatus: {$ne:null}, postedDate:
 * {$ne:null} }` plus the `asOf` date cut, sorted `{postedDate:-1, oppKey:1}`,
 * capped at `SMALL_ORDERS_FEED_LIMIT` and joined to `nsn_records`. `asOf`
 * came back 2026-09-07 and the corpus filter matched 13,418 orders.
 *
 * IT IS NOT THE LEDGER'S TABLE AND THE DIFFERENCE IS REAL. GOAL-dibbs.md
 * records `1G` at 122 and `3Z` at 72 on a cut taken the same day; this one
 * reads 49 and 32, with 276 of the 500 rows joining to no NSN record at all.
 * The corpus is ingested continuously, so the two cuts are two different
 * sets. Nothing here is copied from that table.
 *
 * `--` is an order that joined to no record; `00` is DLA's own sentinel.
 */
const LIVE_CODE_CENSUS: Record<string, number> = {
  "3D": 39,
  "--": 276,
  "3Q": 4,
  "3C": 11,
  "00": 15,
  "1G": 49,
  "5Z": 1,
  "1R": 6,
  "3Z": 32,
  "3R": 6,
  "1C": 14,
  "4Z": 6,
  "3L": 9,
  "3H": 2,
  "2G": 4,
  "1P": 4,
  "3B": 4,
  "4H": 1,
  "4R": 1,
  "1B": 5,
  "1Z": 2,
  "1T": 3,
  "1L": 1,
  "2C": 1,
  "3P": 2,
  "5D": 1,
  "5Q": 1,
};

/** How many of the 500 rows land under each headline. */
const landings = (): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [pair, count] of Object.entries(LIVE_CODE_CENSUS)) {
    const head = verdictOf(pair.slice(0, 1), pair.slice(1));
    out[head] = (out[head] ?? 0) + count;
  }
  return out;
};
const at = (head: string) => landings()[head] ?? 0;

describe("the corpus impact, measured on a live 500-row board page", () => {
  it("counts the whole page", () => {
    expect(Object.values(LIVE_CODE_CENSUS).reduce((a, b) => a + b, 0)).toBe(500);
  });

  it("moves 56 orders out of 'Not clear who may sell this one'", () => {
    // 60 before this feature — every pair below whose letter fell through.
    const before = ["3Q", "5Z", "3Z", "4Z", "3L", "3H", "4H", "1T", "1L", "5Q"];
    expect(before.reduce((n, p) => n + LIVE_CODE_CENSUS[p], 0)).toBe(60);
    // 1 after. It was 4 until the qualified-list tier took the three `1T`
    // rows; the survivor is `1L`, whose letter (l) 2-201.2(g) does not name
    // and whose paragraph this surface has not resolved into a verdict.
    expect(at(HEAD.unruled)).toBe(1);
    expect(at(HEAD.qpl)).toBe(3);
  });

  it("lands 39 of them on the commercial tier and 17 on the one-supplier tier", () => {
    // `3Z` 32 + `4Z` 6 + `5Z` 1, and `3Q` 4 + `3L` 9 + `3H` 2 + `4H` 1 + `5Q` 1.
    expect(at(HEAD.commercial)).toBe(39);
    expect(at(HEAD.oneSupplier)).toBe(17);
  });

  it("MOVES NO ORDER ONTO THE BOARD, over the live page", () => {
    // The structural proof above holds over any corpus. This is the same
    // property counted on the cut the member is looking at: 55 biddable
    // orders before this feature and 55 after — `1G` 49, `2G` 4, `1Z` 2.
    expect(at(HEAD.biddable)).toBe(55);
    // And the admitted gap did not move either. Nothing here re-reads a
    // record, so no order may join or leave it.
    expect(at(HEAD.unreadable)).toBe(291);
  });

  it("leaves the ruled tiers where DH-29 left them", () => {
    // Untouched by this feature, and counted so a later change cannot move
    // them in silence. `1C`/`2C`/`3C` = 26; B, D, P and R = 68.
    expect(at(HEAD.sar)).toBe(26);
    expect(at(HEAD.noRoute)).toBe(68);
    expect(at(HEAD.dataError)).toBe(0);
  });
});

// ── DH-34 · WHAT REACHES HER BOARD, AND WHAT STILL DOES NOT ───────────────
//
// `heldBack()` withheld an order on four grounds and only one of them is a
// fact about the ORDER. `ruled` is DLA's restriction and it still withholds.
// `unread` (no code reached us) and `unruled` (a code reached us and we hold
// no ruling) are OURS, and an order carrying either is on the main list now.
//
// **THE SET THAT REACHES THE BOARD IS NOT THE SET THAT MAY BID.** Everything
// below counts the first. `mayBid()` is enumerated over all 196 pairs further
// up this file and is unchanged — the case named "says she may bid on exactly
// four pairs, and on no other input" still pins it to `1G`, `1Z`, `2G`, `2Z`.
describe("the board is wider than the verdict, and the two are told apart", () => {
  it("puts BOTH of our gaps on the board and DLA's refusal nowhere near it", () => {
    // One pair per tier, read through the same functions the board reads.
    expect(ourGap(coded(null, null))).toBe("unread");
    expect(ourGap(coded("0", "G"))).toBe("unread");
    // `1L` is the largest unruled pair now that the qualified-list tier rules
    // `1T`. 2-201.2(l) is the below-threshold screening code and (g) does not
    // name it, so it still reaches a mentor.
    expect(ourGap(coded("1", "L"))).toBe("unruled");
    expect(ourGap(coded("1", "D"))).toBe("unruled");
    // DLA's own refusal, in every shape this surface rules. `1Q` and `1T` are
    // the two limited-competition tiers, and both are rulings rather than
    // gaps. Every one stays held back.
    for (const pair of ["1C", "1B", "3Z", "3H", "1Q", "1T"]) {
      expect(ourGap(coded(pair.slice(0, 1), pair.slice(1)))).toBeNull();
    }
    // And an order she may bid is not a gap either.
    expect(ourGap(coded("1", "G"))).toBeNull();
  });

  it("GAINS `mayBid()` NOTHING — the board moved and the verdict did not", () => {
    // THE DIRECTION THAT MATTERS, stated against this feature's own predicate.
    // Reaching the board and being permitted to bid are two different facts,
    // and conflating them is how a member is told she may bid something she
    // may not. Enumerated over every input `mayBid()` reads, exactly as the
    // enumeration above does, so it holds over any corpus.
    for (const m of [null, "0", ...METHODS]) {
      for (const a of [null, "0", ...LETTERS]) {
        const order = coded(m, a);
        if (ourGap(order) != null) expect(mayBid(order)).toBe(false);
        if (mayBid(order)) expect(ourGap(order)).toBeNull();
      }
    }
  });

  it("keeps the two gaps in two sentences, on every pair that reaches one", () => {
    // "No code reached me" and "I hold no ruling for the code that did" are
    // different facts. One sentence over both would tell her we looked and
    // failed at an order we never looked at.
    const unread = gapNote(coded(null, null));
    const unruled = gapNote(coded("1", "L"));

    expect(unread?.body).not.toBe(unruled?.body);
    expect(unread?.card).not.toBe(unruled?.card);
    // The unread arm no longer restates its cause — the order page's verdict
    // body says it one line above. What it must NEVER do is claim a code
    // arrived, which is the `unruled` fact and a different gap.
    expect(unread?.body).not.toContain("The record has DLA's code");
    expect(unruled?.body).toContain("The record has DLA's code, but not what it means.");
  });

  /**
   * `card` IS WHAT THE BOARD ROW RENDERS, and nothing asserted it.
   *
   * Trimming the note's body once dropped this field from the `unread` arm and
   * all 1,416 cases still passed — vitest does not typecheck, and the row that
   * would have rendered `undefined` is not built in any of them. The commit
   * gate caught it. This case means the suite catches it next time.
   */
  it("gives every note a row headline, on both arms", () => {
    for (const m of [null, "0", ...METHODS]) {
      for (const a of [null, "0", ...LETTERS]) {
        const note = gapNote(coded(m, a));
        if (note == null) continue;
        expect(typeof note.card).toBe("string");
        expect(note.card.trim()).not.toBe("");
      }
    }
  });

  it("ends every note by refusing the permission claim", () => {
    // THE MUTATION TARGET. A note that implies permission is the one failure
    // this tier cannot afford, and it costs her an afternoon rather than an
    // order she was never going to win.
    for (const m of [null, "0", ...METHODS]) {
      for (const a of [null, "0", ...LETTERS]) {
        const note = gapNote(coded(m, a));
        if (note == null) continue;
        expect(note.body).toContain("That does not mean you may bid this one.");
        expect(note.body).toContain("This is a gap in the source data, not a rule about you.");
      }
    }
  });
});

describe("what DH-34 moves, measured on the same live 500-row board page", () => {
  /**
   * The census above, re-read against the live corpus on 10 September 2026 by
   * replaying the same query: the corpus filter with its `asOf` cut, sorted
   * `{postedDate:-1, oppKey:1}`, capped at 500 and joined to `nsn_records`.
   * `asOf` came back 2026-09-07 and the filter matched 13,418 orders — the
   * same page DH-33 measured, so the two features' figures are comparable.
   *
   * Counted by acquisition code pair, which is what decides both facts. The
   * board's other cuts — the quoting status, the $15,000 cap, her categories
   * and her filters — are unchanged by this feature and apply to every tier
   * alike, so they are not modelled here and no row count is claimed for them.
   */
  const onBoard = (pair: string): boolean => {
    const order = coded(pair.slice(0, 1), pair.slice(1));
    return mayBid(order) || ourGap(order) != null;
  };
  const countWhere = (want: (pair: string) => boolean): number =>
    Object.entries(LIVE_CODE_CENSUS)
      .filter(([pair]) => want(pair))
      .reduce((n, [, count]) => n + count, 0);

  it("moves 292 of the 500 orders onto the list, and holds 153 back", () => {
    // 55 were on the board before DH-34 and 347 are on it now. The 292 are the
    // coverage gap made visible: 276 rows joined to no NSN record at all and 15
    // carry DLA's `00` sentinel — 291 `unread` — plus the one `1L` record whose
    // letter we hold no ruling for.
    //
    // IT WAS 350 AND 150 UNTIL THE QUALIFIED-LIST TIER. The three `1T` rows
    // moved the other way: they carried our own gap and now carry DLA's
    // ruling, so they leave the board for `/small-orders/restricted`. That is
    // the direction this suite watches, and it is the cheap one — an order she
    // could not have won without qualifying first.
    expect(countWhere((p) => onBoard(p))).toBe(347);
    expect(countWhere((p) => !onBoard(p))).toBe(153);
    expect(countWhere((p) => ourGap(coded(p.slice(0, 1), p.slice(1))) === "unread")).toBe(291);
    expect(countWhere((p) => ourGap(coded(p.slice(0, 1), p.slice(1))) === "unruled")).toBe(1);
  });

  it("changes the biddable count by nothing at all", () => {
    // 55 before, 55 after — `1G` 49, `2G` 4, `1Z` 2. The board grew by 292
    // orders and not one of them gained a verdict, and the qualified-list tier
    // took three off it without touching this number either.
    expect(countWhere((p) => mayBid(coded(p.slice(0, 1), p.slice(1))))).toBe(55);
    expect(at(HEAD.biddable)).toBe(55);
  });

  it("leaves DLA's own refusal exactly where DH-33 left it, plus the new tier", () => {
    // 26 Source Approval Request + 68 no route + 39 commercial + 17 one
    // supplier = 150, unchanged, and every one of them is still held back.
    // Counted here so a later change cannot move a refusal onto the board in
    // silence.
    expect(at(HEAD.sar) + at(HEAD.noRoute) + at(HEAD.commercial) + at(HEAD.oneSupplier)).toBe(150);
    for (const head of [HEAD.sar, HEAD.noRoute, HEAD.commercial, HEAD.oneSupplier]) {
      expect(at(head)).toBeGreaterThan(0);
    }
    // And the three `1T` rows the qualified-list tier added to the held-back
    // pool. 150 + 3 is the 153 the case above counts.
    expect(at(HEAD.qpl)).toBe(3);
  });
});
