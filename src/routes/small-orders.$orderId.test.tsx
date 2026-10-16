// @vitest-environment jsdom
//
// Feature 9 — the "Who is buying" fact never renders a label with nothing, or
// half of nothing, beside it.
//
// `buyerContact.name` is `''` when the solicitation names no contracting
// officer (D10 — `MicroOrder` types it non-nullable `string`, and that shape is
// frozen). The fact used to interpolate it unconditionally, so an unnamed
// officer printed "DLA Troop Support · " — a separator with nothing after it,
// on the page she works the order from.
//
// Rendered rather than asserted as a string, because the rule is about what
// reaches the DOM. `WhoIsBuyingFact` is exercised in isolation the way
// `wallet.test.tsx` exercises `LedgerList`, so the router and the member store
// stay out of it.
// Two more pieces of the same page are exercised the same way below:
// `MissingOrder`, which must tell an unfetched feed apart from an absent order,
// and `OrderOnDlaLink`, which must render nothing rather than a dead control.
// DH-30 adds `lookupOrder` and `askRecordRoute`, which are where "we have not
// fetched this order" and "this order is not there" are held apart.
import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  askRecordRoute,
  lookupOrder,
  MissingOrder,
  OrderGapNote,
  OrderOnDlaLink,
  WhoIsBuyingFact,
} from "./small-orders.$orderId";
import {
  mayBid,
  openVerdict,
  ourGap,
  restrictionOf,
  type OurGap,
} from "../lib/microPurchases/relevance";
import type { MicroOrder } from "../lib/microPurchases/order";
import { CORPUS, MICRO_ORDERS, TODAY } from "../lib/mock/microPurchaseOrders";
import type { BoardFeed } from "../lib/microPurchases/feed";
import {
  LIVE_MAPPED_ORDERS,
  LIVE_MAPPED_UNCATEGORISED,
} from "../lib/microPurchases/liveMapperOutput.fixture";
import { readSourceFile } from "../lib/microPurchases/sourceScan.testkit";

afterEach(cleanup);

/** A feed a SERVER handed us, which is the only state in which "that order is
 *  not here" is a fact. The other two states are `undefined` (still asking) and
 *  `null` (asked and failed), and neither needs a builder. */
function servedFeed(): BoardFeed {
  return {
    orders: MICRO_ORDERS,
    asOf: TODAY.toISOString().slice(0, 10),
    postedOnLabel: CORPUS.postedOn,
    count: MICRO_ORDERS.length,
    // What she was served OUT OF. The bundled corpus is served whole, so the
    // two numbers are equal here.
    total: MICRO_ORDERS.length,
    boardTotal: MICRO_ORDERS.length,
  };
}

/** The rendered value cell of the one fact under test. */
function renderedValue(container: HTMLElement): string | null {
  const value = container.querySelector(".key-info-value");
  return value ? value.textContent : null;
}

describe("WhoIsBuyingFact", () => {
  it("prints the buying office and the officer, separated, when the order paper names both", () => {
    const { container } = render(
      <WhoIsBuyingFact buyer="DLA Troop Support" contactName="A. Contracting-Officer" />,
    );

    expect(screen.getByText("Who is buying")).toBeTruthy();
    expect(renderedValue(container)).toBe("DLA Troop Support · A. Contracting-Officer");
  });

  it("prints the buying office ALONE — no trailing separator — when the name is empty", () => {
    const { container } = render(<WhoIsBuyingFact buyer="DLA Troop Support" contactName="" />);

    expect(screen.getByText("Who is buying")).toBeTruthy();
    expect(renderedValue(container)).toBe("DLA Troop Support");
    expect(container.textContent).not.toContain("·");
  });

  it("treats a whitespace-only name as no name at all", () => {
    const { container } = render(<WhoIsBuyingFact buyer="DLA Troop Support" contactName="   " />);

    expect(renderedValue(container)).toBe("DLA Troop Support");
    expect(container.textContent).not.toContain("·");
  });

  it("prints the officer alone when the order paper names no buying office", () => {
    const { container } = render(<WhoIsBuyingFact buyer="" contactName="A. Contracting-Officer" />);

    expect(renderedValue(container)).toBe("A. Contracting-Officer");
    expect(container.textContent).not.toContain("·");
  });

  it("renders no label at all when the order paper names neither", () => {
    const { container } = render(<WhoIsBuyingFact buyer="" contactName="" />);

    expect(screen.queryByText("Who is buying")).toBeNull();
    expect(container.textContent).toBe("");
  });
});

/**
 * THREE STATES, NOT ONE SENTENCE.
 *
 * The page settled on "That order is not here any more." whenever it could not
 * find the order, and that conflated three facts. The bundled corpus renders
 * while the request is in flight — 13 to 21 seconds on the measured endpoint —
 * so a live order printed a designed sentence as a lie on every reload, every
 * shared link and every refresh, for roughly twenty seconds.
 *
 * `feed.ts` already names the three states and this reads them: `undefined` is
 * "not answered yet", a served feed is an answer, and `null` is a fetch that
 * failed. Only the middle one earns the sentence.
 */
describe("MissingOrder", () => {
  it("says the order is gone ONLY when a server answered and it was not there", () => {
    render(<MissingOrder miss="gone" />);

    expect(screen.getByText("That order is not here any more.")).toBeTruthy();
  });

  it("does not say it while the request is still open", () => {
    // The request has not answered. We know nothing about this order yet.
    render(<MissingOrder miss="asking" />);

    expect(screen.queryByText("That order is not here any more.")).toBeNull();
    expect(screen.getByText("Getting this order from DLA.")).toBeTruthy();
  });

  it("does not say it when the fetch failed — it says we could not ask", () => {
    render(<MissingOrder miss="unreachable" />);

    expect(screen.queryByText("That order is not here any more.")).toBeNull();
    expect(screen.getByText("This order from DLA did not load. Check again later.")).toBeTruthy();
  });
});

// ── DH-30 · a bookmarked order beyond the loaded pages ────────────────────
//
// The board holds ONE PAGE now (DH-28), so an order on page three is missing
// from the feed we hold and is perfectly alive. The page used to read that miss
// as "that order is not here any more", which is two different facts wearing
// one sentence:
//
//   · WE HAVE NOT FETCHED IT — a shortcoming of ours, and the order renders
//     once the record route answers;
//   · IT IS NOT THERE — the server read the id and holds nothing, which is the
//     honest sentence and keeps it.
//
// `lookupOrder` is where the two are told apart, so the cases below assert them
// APART. A suite that only proved the good case would pass just as well the day
// somebody collapses them again.
describe("lookupOrder", () => {
  /** An order the board's page really did serve. */
  const held = MICRO_ORDERS[0];

  /** An order beyond the page — real mapper output the served feed omits. */
  const beyond = LIVE_MAPPED_ORDERS[0];

  it("reads an order straight off the page the board served", () => {
    // No record route involved: the board already holds this one, so nothing
    // is fetched and nothing waits.
    expect(lookupOrder(held.id, servedFeed(), null)).toEqual({
      state: "found",
      order: held,
      asOf: servedFeed().asOf,
    });
  });

  it("RENDERS AN ORDER THE BOARD'S PAGE MISSED, once the record route serves it", () => {
    // The bookmarked link. This is the defect: before DH-30 this state was
    // "That order is not here any more." over a live order.
    const found = lookupOrder(beyond.id, servedFeed(), { state: "order", order: beyond });

    // And it is judged on the SAME corpus day as an order off the board. A
    // second clock for a bookmarked order would price it against another day.
    expect(found).toEqual({ state: "found", order: beyond, asOf: servedFeed().asOf });
  });

  it("says GONE only when the record route answered that it holds no such order", () => {
    // The other half of the pair. A member whose order really has closed out
    // of the corpus still gets the honest sentence.
    expect(lookupOrder("dibbs-never-existed", servedFeed(), { state: "absent" })).toEqual({
      state: "gone",
    });
  });

  it("CONCLUDES NOTHING while the record route is still answering", () => {
    // `null` is "we have not been told yet". The board answered and missed;
    // the order fetch is open. Saying anything here is the same defect on a
    // shorter timescale.
    expect(lookupOrder(beyond.id, servedFeed(), null)).toEqual({ state: "asking" });
  });

  it("says we could not ask when the record route failed — never that it is gone", () => {
    expect(lookupOrder(beyond.id, servedFeed(), { state: "unreachable" })).toEqual({
      state: "unreachable",
    });
  });

  it("waits on the board itself before it asks about one order", () => {
    // The feed request is still open, so the page knows nothing about any
    // order yet — and a record-route answer cannot have arrived.
    expect(lookupOrder(beyond.id, undefined, null)).toEqual({ state: "asking" });
  });

  it("keeps the failed-board sentence when the board itself did not arrive", () => {
    // A failed board is not evidence about one order, and the page has no
    // corpus day to judge the order against — see `askRecordRoute`.
    expect(lookupOrder(beyond.id, null, null)).toEqual({ state: "unreachable" });
  });
});

describe("askRecordRoute", () => {
  it("asks about an order the board answered without", () => {
    expect(askRecordRoute(LIVE_MAPPED_ORDERS[0].id, servedFeed())).toBe(true);
  });

  it("does not ask for an order the board already served", () => {
    expect(askRecordRoute(MICRO_ORDERS[0].id, servedFeed())).toBe(false);
  });

  it("does not ask while the board request is open, or after it failed", () => {
    expect(askRecordRoute(LIVE_MAPPED_ORDERS[0].id, undefined)).toBe(false);
    expect(askRecordRoute(LIVE_MAPPED_ORDERS[0].id, null)).toBe(false);
  });
});

describe("the page around that lookup", () => {
  const routeSource = readSourceFile("routes/small-orders.$orderId.tsx");

  it("really asks the record route, and renders only what the lookup resolved", () => {
    // The two functions above decide; this is the page obeying them. Asserted
    // on the source because `OrderPage` reads the router and no spec here
    // boots one — the same reason DH-34's `sendable` gate reads the source.
    expect(routeSource).toMatch(
      /const single = useSingleOrder\(orderId, askRecordRoute\(orderId, feed\)\);/,
    );
    expect(routeSource).toMatch(/const lookup = lookupOrder\(orderId, feed, single\);/);
    expect(routeSource).toMatch(/if \(lookup\.state !== "found"\) \{/);
  });

  it("shows her the feed's own spinner while a fetch is open, not a second one", () => {
    // One wait, one thing to say. `FeedLoadingState` is the board's, and
    // `MissingOrder` is the only place this page renders one.
    expect(routeSource.match(/<FeedLoadingState/g)).toHaveLength(1);
  });
});

// The page renders a verdict, a gap note (DH-34), the sourcing panel, the order
// paper and the send control. All five read the order, so an order that came in
// singly must answer them exactly as the same order off the board does.
describe("an order the record route served drives the whole page", () => {
  it("hands the order to the page WHOLE, not a copy of the part it looked at", () => {
    // Identity, not equality. Every panel on this page is a pure reader of the
    // order, so an order passed through untouched answers all five exactly as
    // the same order off the board does. What the WIRE preserves is asserted
    // field by field in `api.envelope.test.ts`.
    const order = LIVE_MAPPED_ORDERS[0];

    const found = lookupOrder(order.id, servedFeed(), { state: "order", order });

    expect(found.state === "found" && found.order).toBe(order);
  });

  it("renders the DH-34 gap note off a singly-fetched order", () => {
    const gapped = LIVE_MAPPED_ORDERS.find((o) => ourGap(o) != null);
    expect(gapped).toBeTruthy();
    const found = lookupOrder((gapped as MicroOrder).id, servedFeed(), {
      state: "order",
      order: gapped as MicroOrder,
    });
    expect(found.state).toBe("found");

    const { container } = render(<OrderGapNote order={(found as { order: MicroOrder }).order} />);

    expect(container.querySelector(".mp-verdict__gap")).toBeTruthy();
    expect(container.textContent).toContain(
      "This is a gap in the source data, not a rule about you.",
    );
  });
});

/**
 * THE LINK TO DLA'S OWN PAGE.
 *
 * `dlaOrderUrl` is `null` whenever the record carries no DLA URL — and the
 * backend maps a vendor URL to `null` too, so "we hold no link" and "we hold
 * one we may not show" arrive here as the same value. Either way the answer is
 * to render nothing: a control that goes nowhere is worse than no control.
 */
describe("OrderOnDlaLink", () => {
  const DIBBS_URL = "https://www.dibbs.bsm.dla.mil/rfq/rfqrec.aspx?sn=SPE7M026Q0938";

  it("opens the order on DLA's site, in a new tab, with the opener cut", () => {
    const { container } = render(<OrderOnDlaLink url={DIBBS_URL} />);
    const link = container.querySelector("a");

    expect(link?.getAttribute("href")).toBe(DIBBS_URL);
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("names where it goes, in the words the rest of the page uses", () => {
    render(<OrderOnDlaLink url={DIBBS_URL} />);

    expect(screen.getByText("Open this on the DIBBS website")).toBeTruthy();
  });

  // THE SAME CONTROL AS THE ORDER PAPER BENEATH IT. The two are the two ways to
  // reach this order at its source, so they share one shape: a `.mp-paper` card
  // with a kind tag, a title, the destination in small type, and "Open".
  it("wears the order-paper card, and says which site it opens", () => {
    const { container } = render(<OrderOnDlaLink url={DIBBS_URL} />);
    const card = container.querySelector("a.mp-paper");

    expect(card).not.toBeNull();
    expect(card?.querySelector(".mp-paper__kind")?.textContent).toBe("WEB");
    expect(card?.querySelector(".mp-paper__text em")?.textContent).toBe("www.dibbs.bsm.dla.mil");
    expect(card?.querySelector(".mp-paper__go")?.textContent).toBe("Open");
  });

  it("renders NOTHING when we hold no link, never a dead control", () => {
    const { container } = render(<OrderOnDlaLink url={null} />);

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("");
  });
});

/**
 * DH-08 — THE FREIGHT CLAIM IS GONE, AND IT CANNOT COME BACK QUIETLY.
 *
 * `fobDestination` was half-alive. The type and the mapper carry a three-state
 * field, and the page carried a warning that only the `true` arm could reach.
 * That arm is unreachable for every order a member sees: `dibbsDeliveryFob` is
 * NEVER STORED. It is a field that does not exist on the opportunity document,
 * not a field holding `null`, and no raw payload is retained, so the value
 * cannot be recovered from what we hold.
 *
 * WHAT THIS SPEC CAN ASSERT, AND WHY IT IS NOT A FULL-PAGE RENDER. `OrderPage`
 * is not exported, and it reads the router, the feed store and the member
 * store, so no spec in this repo renders it — both route specs render the
 * exported pieces instead. The freight Fact ROW that carried the three arms is
 * already gone: commit 57b9b91c deleted the cell as a product decision, months
 * of "Not stated" on every order. So there is no fob cell left to render.
 *
 * The claim is pinned from both ends instead. The corpus test says the data can
 * never supply the value; the source test says the page states the claim
 * nowhere and reads the field nowhere.
 */
describe("the freight claim on the order page", () => {
  /** The route, read as text. The gate below is about what the SOURCE says, so
   *  it reads the source — a rendered assertion is not available here. */
  const routeSource = readSourceFile("routes/small-orders.$orderId.tsx");

  it("finds no live-mapped order that could reach a freight claim", () => {
    // Real mapper output over live-shaped documents, both populations. Every
    // one abstains, because the mapper has nothing to write.
    const live = [...LIVE_MAPPED_ORDERS, ...LIVE_MAPPED_UNCATEGORISED];

    expect(live.length).toBeGreaterThan(0);
    expect(live.every((order) => order.fobDestination === null)).toBe(true);
  });

  it("states no freight liability for the live order it renders", () => {
    // The sentence must not return, not even quoted in a comment: `rg` over
    // this workspace is DH-08's own criterion, and a quoted copy answers it.
    const order = LIVE_MAPPED_ORDERS[0];

    expect(order.fobDestination).toBeNull();
    expect(routeSource).not.toMatch(/to ship them/i);
  });

  it("reads `fobDestination` nowhere, so no arm of it can render", () => {
    expect(routeSource).not.toMatch(/o\.fobDestination/);
  });
});

// ── DH-34 · the note on an order we could not rule on ─────────────────────
//
// The board shows these orders now, so the page has to say why — and it has to
// say why WITHOUT saying she may bid them. Those are the two halves below, and
// the second one is the whole risk: "I could not rule on this one" is true,
// "you may bid this one" is not, and nothing on this page may imply it.
//
// `OrderGapNote` is exercised in isolation, like `WhoIsBuyingFact` above,
// because the claim is about what reaches the DOM and the page needs a router.
describe("OrderGapNote", () => {
  /** The sentence that refuses the permission claim, on every note. */
  const DENIAL = "That does not mean you may bid this one.";

  /** An order carrying one of the two gaps, taken from real mapper output. */
  const withGap = (gap: OurGap): MicroOrder => {
    const order = LIVE_MAPPED_ORDERS.find((o) => ourGap(o) === gap);
    if (order == null) throw new Error(`the live fixture holds no ${gap} order`);
    return order;
  };

  it("renders nothing at all for an order we could rule on", () => {
    // Both directions: an order she may bid, and one DLA refuses her.
    const biddable = LIVE_MAPPED_ORDERS.find((o) => mayBid(o));
    const refused = LIVE_MAPPED_ORDERS.find((o) => restrictionOf(o)?.route === "none");

    expect(biddable).toBeTruthy();
    expect(refused).toBeTruthy();
    for (const order of [biddable, refused]) {
      cleanup();
      const { container } = render(<OrderGapNote order={order as MicroOrder} />);
      expect(container.querySelector(".mp-verdict__gap")).toBeNull();
    }
  });

  it("NEVER TELLS HER SHE MAY BID, on either gap", () => {
    // THE MUTATION TARGET. Every note ends by saying it is not that claim, and
    // no note may carry the affirmative in any of the spellings this product
    // uses for it — `openVerdict()`'s "You can bid this one.", the board's
    // "open to any seller", or a bare instruction to quote.
    for (const gap of ["unread", "unruled"] as const) {
      cleanup();
      const order = withGap(gap);
      const { container } = render(<OrderGapNote order={order} />);
      const text = container.textContent ?? "";

      // The denial is matched first and then REMOVED, because it contains the
      // affirmative as its own object — "I am not telling you that you may bid
      // this one." A pattern run over the whole note would match the sentence
      // that exists to refuse the claim, which is the shape of gate that
      // passes on a mutation and fails on the honest copy.
      expect(text).toContain(DENIAL);
      const rest = text.replace(DENIAL, "");
      expect(rest).not.toMatch(/you (?:can|may) bid/i);
      expect(rest).not.toMatch(/open to any seller/i);
      expect(rest).not.toMatch(/\bquote\b/i);
      // And the page's own permission tests still refuse, which is what makes
      // the sentence above true rather than merely careful.
      expect(mayBid(order)).toBe(false);
      expect(openVerdict(order)).toBeNull();
    }
  });

  it("says WHICH gap it is, and the two do not read the same", () => {
    // No code at all is a different fact from a code we hold no ruling for.
    // Collapsing them would tell her we looked and failed at an order we never
    // looked at.
    const unread = render(<OrderGapNote order={withGap("unread")} />).container.textContent ?? "";
    cleanup();
    const unruled = render(<OrderGapNote order={withGap("unruled")} />).container.textContent ?? "";

    // See relevance.ts: the unread arm drops its cause because the verdict
    // body carries it. It must still never claim a code arrived.
    expect(unread).not.toContain("The record has DLA's code");
    expect(unruled).toContain("The record has DLA's code, but not what it means.");
    expect(unread).not.toBe(unruled);
  });

  it("names the gap as OURS, so the order is not blamed for it", () => {
    for (const gap of ["unread", "unruled"] as const) {
      cleanup();
      const { container } = render(<OrderGapNote order={withGap(gap)} />);

      // ONE SENTENCE NOW, not two. It read "The gap is on my side. It is not
      // a rule about you." and the second assertion pinned the second half.
      // The two were merged when the note was cut from five sentences to
      // three, so asserting them separately would pin the same clause twice.
      expect(container.textContent).toContain(
        "This is a gap in the source data, not a rule about you.",
      );
      // The abstention is the load-bearing half: naming the gap as ours must
      // never be read as permission.
      expect(container.textContent).toContain("That does not mean you may bid this one.");
    }
  });
});

describe("the page around that note", () => {
  const routeSource = readSourceFile("routes/small-orders.$orderId.tsx");

  it("stands the send control down on every order it could not rule on", () => {
    // The affirmative this page can make is a control, not only a sentence.
    // `sendable` reads `mayBid()`, which DH-34 did not touch, so an order with
    // a gap gets no send block — asserted on the source because the gate is a
    // const the router would otherwise have to boot to reach.
    expect(routeSource).toMatch(/const sendable = mayBid\(o\) && !setAside\?\.needsCertificate;/);
    for (const o of LIVE_MAPPED_ORDERS.filter((x) => ourGap(x) != null)) {
      expect(mayBid(o)).toBe(false);
    }
  });

  it("sends her back to the board she came from, not to the refused list", () => {
    // `onBoard`, not `mayBid`. An order we could not rule on is on the main
    // list now, so a back control reading `mayBid` alone would land her on a
    // page she has never seen and that does not hold the order.
    expect(routeSource).toMatch(/const onBoard = mayBid\(o\) \|\| gap != null;/);
    expect(routeSource).toMatch(/label=\{onBoard \? "Small orders" : "Ones not open to you"\}/);
  });
});

// ── The record states every fact, whatever the acquisition code says ──────
//
// Owner, 16 September 2026: "display all info regardless of the acquisition
// code." The page used to stop at the verdict. `{!cannotBid && (…)}` wrapped
// the whole record — the fact grid, the link to DIBBS, the order paper, the
// sourcing panel, the award history, the cash question, the check-the-paper
// block and the sidebar — and `priceShows` wrapped the price. So an order DLA's
// codes refuse, and an order whose code carries no ruling, each rendered a
// verdict and nothing else. Those facts are the government's record. They are
// the same for every member, and who may supply the part does not change one of
// them.
//
// THE VERDICT DOES NOT MOVE. `bidCell()` still answers "Not open to you" and
// "Not clear from DLA's codes" (pinned in `bidCell.test.tsx`), the send block
// still stands down on `sendable`, and the price INSTRUCTION now states its
// condition rather than dropping out.
//
// ASSERTED ON THE SOURCE, for the reason the block above already records:
// `OrderPage` is not exported and it reads the router and two stores, so no
// spec in this repo renders it. The claim is about which blocks a gate wraps,
// and a gate here is a const.
describe("the record on an order the acquisition code rules against", () => {
  const routeSource = readSourceFile("routes/small-orders.$orderId.tsx");

  it("wraps no factual block in the acquisition-code verdict", () => {
    expect(routeSource).not.toContain("{!cannotBid && (");
    expect(routeSource).not.toContain("const priceShows = !cannotBid;");
    expect(routeSource).not.toContain("const numbersBelow = !cannotBid && cashAsked;");
  });

  it("keeps the record blocks on the page, in one run", () => {
    // Each of these was inside the wrapper above. Named one by one, because a
    // gate that came back around any single block would pass a test that only
    // counted the wrapper.
    for (const block of [
      '<h2 className="mp-h2">What the order says</h2>',
      "<OrderOnDlaLink url={o.dlaOrderUrl} />",
      "<SourcingPanel order={o} now={now} />",
      "<AwardHistory order={o} now={now} />",
      '<p className="mp-price__head">{advice.headline}</p>',
    ]) {
      expect(routeSource).toContain(block);
    }
  });

  it("makes the price instruction state its condition instead of dropping out", () => {
    // `advice.headline` is an INSTRUCTION — "Quote less than $3,800 for each
    // piece." — so on an order the page has not said yes to, the condition
    // comes first. The same shape the certificate refusal already used.
    expect(routeSource).toMatch(/const priceCondition = certRefused/);
    expect(routeSource).toContain("Only if you hold that certificate:");
    expect(routeSource).toContain("Only if DLA lets you supply this part:");
  });

  it("still stands the two ACTIONS down, because neither is a fact", () => {
    // The send block tells her what to type into DIBBS, and Save keeps an order
    // she means to work. An order the codes refuse gets neither.
    expect(routeSource).toMatch(/const sendable = mayBid\(o\) && !setAside\?\.needsCertificate;/);
    expect(routeSource).toMatch(/\{sendable && <SendToDla order=\{o\} now=\{now\} \/>\}/);
    expect(routeSource).toMatch(/\{cannotBid \? null : quoted \?/);
  });

  it("keeps the restriction explainer BESIDE the facts, not instead of them", () => {
    expect(routeSource).toMatch(
      /\{cannotBid && restriction\?\.route === "none" && <p className="mp-deadend">\{SKIP_THIS_ONE\}<\/p>\}/,
    );
    expect(routeSource).toContain("<OrderGapNote order={o} />");
  });
});
