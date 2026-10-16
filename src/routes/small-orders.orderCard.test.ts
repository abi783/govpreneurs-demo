// ONE CARD, ONE ATTRIBUTION — the shape of Hunter's answer on an order page.
//
// The verdict and the price were two stacked cards. On an order whose codes we
// could not read BOTH rendered, so the page showed one speaker saying "I cannot
// tell if you can bid this one." and then, in a second card with a second
// byline in a different size, "I do not know what this one sells for." Two
// cards, two chips, one voice, one order.
//
// SOURCE-SCANNED, not rendered, and the reason matters. What is being asserted
// is the SHAPE of the page — how many attributions exist, and what order the
// blocks sit in — and three of the four states this file cares about need a
// router, a member store and a served corpus to reach through the DOM. The
// repo already scans source for exactly this class of claim; `stylesheet.test`
// and the citation gates are the precedent.
//
// The gates themselves are NOT asserted here. `verdictShows` and `priceShows`
// are behaviour, they are covered where behaviour is covered, and restating
// them as source text would pin the spelling rather than the rule.
import { describe, expect, it } from "vitest";
import { readSourceFile } from "../lib/microPurchases/sourceScan.testkit";

const PAGE = readSourceFile("routes/small-orders.$orderId.tsx");

describe("Hunter's card on the order page", () => {
  /**
   * THE WHOLE POINT. A second `.ai-attr` on this page means a second byline,
   * which is the defect being fixed however it is spelled.
   */
  it("carries exactly one Hunter attribution", () => {
    const chips = PAGE.match(/<div className="ai-attr">/g) ?? [];
    expect(chips).toHaveLength(1);
  });

  it("puts the attribution in the stronger of the two shapes that existed", () => {
    // The 24px bare-name chip was the weaker rendering, and the note beside it
    // said so. The surviving chip is the 40px one with its evidence line.
    expect(PAGE).toContain('<AgentAvatar agent="hunter" size={40} />');
    expect(PAGE).not.toContain('<AgentAvatar agent="hunter" size={24} />');
  });

  it("has no separate price card left to hold a second byline", () => {
    expect(PAGE).not.toContain('className="ai-surface mp-price"');
  });

  /**
   * The card is amber because amber marks the machine-written claim. It used to
   * mark only the price, so a reader learned the tint meant "price" rather than
   * "Hunter", while the computed verdict sat in neutral chrome beside it.
   */
  it("wears the AI surface on the whole card, not on half of it", () => {
    expect(PAGE).toContain('<section className="ai-surface mp-verdict">');
  });

  /**
   * THE UNIT WARNING IS NOT A BLOCK ANY MORE.
   *
   * It rendered below the award record — a warning read second — so it was
   * moved into this card above the price. Beside the price it then said what
   * the How many cell had begun saying, so the block went and the sentence
   * stayed: `unitWarning()` is now part of the count's own hint, which is the
   * attached form this page prefers.
   *
   * This case guards the sentence, not the box. The words that carry the
   * hundred-fold mistake must still reach the page from somewhere.
   */
  it("keeps the unit warning on the page, on the count rather than in a box", () => {
    expect(PAGE).not.toContain('className="mp-unitbox"');
    expect(PAGE).toContain("unitHint");
    // The hint is composed on the How many cell, which is why it must be read
    // there and not beside the price.
    const hint = PAGE.indexOf("const unitHint");
    const strip = PAGE.indexOf('className="mp-keyfacts__hint"');
    expect(hint).toBeGreaterThan(-1);
    expect(strip).toBeGreaterThan(-1);
  });

  /** The record carries the code the whole verdict turns on. */
  it("keeps the acquisition code in the record, as evidence", () => {
    expect(PAGE).toContain('label="Acquisition code"');
    // It must not restate the reading — that is Hunter's card, one screen up.
    expect(PAGE).toContain("Hunter reads it at the top of this page.");
  });
});
