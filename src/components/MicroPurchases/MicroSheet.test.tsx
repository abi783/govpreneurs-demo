// @vitest-environment jsdom
//
// The shell, and only the shell.
//
// The owner read the "Narrow this down" filter as a separate PAGE, and the
// geometry says she is right: `.mp-sheet-scrim` pins its child to the bottom
// edge and `.mp-sheet` is 88vh tall, so on a desktop viewport the sheet fills
// the screen. The opportunities list already owns the look a filter should
// wear — `FiltersDrawer`'s `.fd-overlay` / `.fd-panel` side panel — so the
// filter now wears it.
//
// This file guards the three things that change together and must not drift:
// the narrow filter wears the panel, the bottom-sheet variant keeps its own
// shell — floating over the board — and every focus behaviour `MicroSheet` adds to Radix survives the
// swap. The a11y block runs against the PANEL variant on purpose — that is the
// path the re-skin created, and the one a hand-rolled second dialog would have
// broken.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { NarrowSheet } from "./NarrowSheet";
import { MicroSheet } from "./MicroSheet";
import { NO_FILTERS, EMPTY_CONTEXT } from "../../lib/microPurchases/relevance";
import { type BoardFeed } from "../../lib/microPurchases/feed";
import type { MicroCategory } from "../../lib/microPurchases/categories";
import { CORPUS, MICRO_ORDERS, TODAY } from "../../lib/mock/microPurchaseOrders";

afterEach(cleanup);

/** A board that ARRIVED, drawn over the committed sample records.
 *
 *  It used to read `getBoardFeed()`, which seeded itself with those records
 *  before any request. Nothing seeds itself now — first paint is a spinner — so
 *  the populated feed this sheet needs to count rows against is built here. */
const FEED: BoardFeed = {
  orders: MICRO_ORDERS,
  asOf: TODAY.toISOString().slice(0, 10),
  postedOnLabel: CORPUS.postedOn,
  count: MICRO_ORDERS.length,
  // Nothing was capped, so the page IS the board (DH-05).
  total: MICRO_ORDERS.length,
  boardTotal: MICRO_ORDERS.length,
};

/** A feed that arrived carrying nothing. Drives the zero-state line. */
const EMPTY_FEED: BoardFeed = {
  orders: [],
  asOf: "",
  postedOnLabel: "",
  count: 0,
  total: 0,
  boardTotal: 0,
};

function renderNarrowSheet(onClose: () => void = () => undefined) {
  return render(
    <NarrowSheet
      selected={NO_FILTERS}
      categories={[]}
      member={EMPTY_CONTEXT}
      sort="best"
      feed={FEED}
      onApply={() => undefined}
      onClose={onClose}
    />,
  );
}

/** Radix portals the dialog to `document.body`, so the class check reads the
 *  whole document rather than the render container. */
function inDocument(selector: string): Element | null {
  return document.querySelector(selector);
}

describe("the small-orders filter wears the opportunities page's panel", () => {
  it("opens as a side panel, not as a full-height bottom sheet", () => {
    renderNarrowSheet();

    expect(inDocument(".fd-overlay")).not.toBeNull();
    expect(inDocument(".fd-panel")).not.toBeNull();
    expect(inDocument(".fd-body")).not.toBeNull();
    expect(inDocument(".mp-sheet-scrim")).toBeNull();
    expect(inDocument(".mp-sheet")).toBeNull();
  });

  it("names itself in the panel's own header, the way the opportunities drawer does", () => {
    renderNarrowSheet();

    expect(inDocument(".fd-head .t-label")?.textContent).toBe("Refine");
    expect(inDocument(".fd-title")?.textContent).toBe("Narrow this down");
    // Radix wires the dialog to its title; the panel header holds that title.
    const dialog = screen.getByRole("dialog");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(document.getElementById(labelledBy ?? "")).toBe(inDocument(".fd-title"));
  });

  it("keeps its questions, its live count and its sticky foot", () => {
    renderNarrowSheet();

    expect(screen.getByRole("radiogroup", { name: /how big/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Show \d+ orders?$/ })).toBeTruthy();
    // The foot is the filter's, not the shell's — a re-skin that swallowed it
    // would take the sticky bar and the Clear control with it.
    expect(inDocument(".fd-body > .mp-sheet__foot")).not.toBeNull();
  });

  it("still says nothing matches rather than offering a dead button", () => {
    render(
      <NarrowSheet
        selected={NO_FILTERS}
        categories={[]}
        member={EMPTY_CONTEXT}
        sort="best"
        feed={EMPTY_FEED}
        onApply={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText(/No orders match/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Show \d+ orders?$/ })).toBeNull();
  });
});

// THE SHEET NEVER FLOATED. `.mp-sheet-scrim` holds only a layer and a flex
// layout; `position: fixed`, `inset: 0` and the glass live on `.scrim` in
// components.css. The prototype lists `.mp-sheet-scrim` on that rule. The port
// carried the comment saying so and never the selector, so here the scrim was
// an ordinary block at the end of <body>: "What do you sell?" rendered BELOW the
// board, with the board's last lines showing above it and nothing dimmed.
// The overlay now wears `.scrim` by name, the way the panel wears `.fd-overlay`.
describe("the bottom sheet floats over the board", () => {
  it("wears the app's glass overlay on the same element as its own scrim", () => {
    render(
      <MicroSheet title="What do you sell?" onClose={() => undefined}>
        <p>A sheet</p>
      </MicroSheet>,
    );

    const scrim = inDocument(".mp-sheet-scrim");
    expect(scrim).not.toBeNull();
    expect(scrim?.classList.contains("scrim")).toBe(true);
  });

  it("the overlay it wears is pinned to the viewport", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/components.css"), "utf8");
    const rule = /(^|\n)\.scrim\s*\{([^}]*)\}/.exec(css)?.[2] ?? "";

    expect(rule).toMatch(/position:\s*fixed/);
    expect(rule).toMatch(/inset:\s*0/);
  });
});

// NO DICTATION, AND THE TWELVE IN TWO COLUMNS. The owner removed "Say it out
// loud": it opened a text box, not a microphone, and pushed the list below the
// fold. With it went the "Hunter heard" note and the "Or pick from these" label,
// whose "or" had nothing left to be an alternative to.
describe("the category list in the filter menu is the list and nothing else", () => {
  it("offers no dictation control, no text field and no 'Hunter heard' note", () => {
    renderNarrowSheet();

    expect(screen.queryByText("Say it out loud")).toBeNull();
    expect(inDocument("textarea")).toBeNull();
    expect(inDocument(".mp-heard")).toBeNull();
    expect(screen.queryByText("Or pick from these")).toBeNull();
    expect(document.querySelectorAll(".mp-cats .mp-cat")).toHaveLength(12);
  });

  it("lays the twelve out in two columns once the sheet has the width", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/small-orders.css"), "utf8");
    const twoUp =
      /@media \(min-width: 560px\)\s*\{\s*\.mp-cats\s*\{[^}]*grid-template-columns:\s*repeat\(2,/;

    expect(css).toMatch(twoUp);
  });
});

// THE POPUP'S DESKTOP RULE MUST FOLLOW THE BASE RULE. Both are `.mp-sheet`, one
// class, so the later one wins. It was written ABOVE the base rule, and the
// base rule's bottom-sheet radius (`r-lg r-lg 0 0`) squared off the popup's
// bottom corners on every desktop — reported from a screenshot, not caught here.
describe("the bottom-sheet popup on a wide screen", () => {
  const css = readFileSync(resolve(process.cwd(), "src/styles/small-orders.css"), "utf8");
  const base = css.search(/\n\.mp-sheet \{/);
  const desktop =
    /@media \(min-width: 720px\) \{\s*\.mp-sheet-scrim \{[^}]*\}\s*\.mp-sheet \{([^}]*)\}/.exec(
      css,
    );

  it("comes after the base sheet rule, so it is not overridden", () => {
    expect(base).toBeGreaterThan(-1);
    expect(desktop).not.toBeNull();
    expect(desktop!.index).toBeGreaterThan(base);
  });

  it("rounds every corner and is wider than the phone sheet", () => {
    expect(desktop![1]).toMatch(/border-radius:\s*var\(--r-lg\);/);
    expect(desktop![1]).toMatch(/max-width:\s*640px;/);
  });
});

// PRE-SELECTED FROM HER PROFILE. When she has picked nothing yet, the filter
// menu opens with the categories her NAICS codes point at already ticked, and
// says where they came from. It is a proposal: nothing is saved until she
// applies, and a choice she has already made is never overwritten by one.
describe("the filter menu proposes categories from her profile", () => {
  function renderWith(
    categories: MicroCategory[],
    suggested: MicroCategory[],
    onApply: (f: unknown, c: MicroCategory[]) => void = () => undefined,
  ) {
    return render(
      <NarrowSheet
        selected={NO_FILTERS}
        categories={categories}
        suggested={suggested}
        member={EMPTY_CONTEXT}
        sort="best"
        feed={FEED}
        onApply={onApply}
        onClose={() => undefined}
      />,
    );
  }

  it("ticks the suggestions and says they came from her NAICS codes", () => {
    renderWith([], ["fasteners", "electrical"]);

    expect(document.querySelectorAll('.mp-cat[aria-pressed="true"]')).toHaveLength(2);
    expect(screen.getByText(/Picked from the NAICS codes in your profile/)).toBeTruthy();
  });

  it("applies the suggestions only when she confirms them", () => {
    const onApply = vi.fn();
    renderWith([], ["fasteners"], onApply);

    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Show orders" }));
    expect(onApply).toHaveBeenCalledWith(NO_FILTERS, ["fasteners"]);
  });

  it("keeps her own picks and makes no proposal once she has chosen", () => {
    renderWith(["hand-tools"], ["fasteners"]);

    expect(document.querySelectorAll('.mp-cat[aria-pressed="true"]')).toHaveLength(1);
    expect(screen.queryByText(/picked these from the NAICS codes/)).toBeNull();
  });
});

// THE COUNT IS ONLY KNOWN WHILE HER CATEGORIES ARE UNCHANGED. The server walks
// her categories, so the rows in hand hold none of a category she has just
// ticked. Counting them would read 0 and take the apply button away.
describe("the filter menu does not count a category it has not fetched", () => {
  it("shows a count while the categories are the ones the board was walked in", () => {
    renderNarrowSheet();

    expect(screen.getByRole("button", { name: /^Show \d+ orders?$/ })).toBeTruthy();
  });

  it("offers Show orders, with no number, once she changes a category", () => {
    render(
      <NarrowSheet
        selected={NO_FILTERS}
        categories={[]}
        member={EMPTY_CONTEXT}
        sort="best"
        feed={EMPTY_FEED}
        onApply={() => undefined}
        onClose={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));

    expect(screen.getByRole("button", { name: "Show orders" })).toBeTruthy();
    expect(screen.queryByText(/No orders match/)).toBeNull();
  });

  it("clears her categories with the other filters", () => {
    const onApply = vi.fn();
    render(
      <NarrowSheet
        selected={NO_FILTERS}
        categories={["filters"]}
        member={EMPTY_CONTEXT}
        sort="best"
        feed={FEED}
        onApply={onApply}
        onClose={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Show orders" }));

    expect(onApply).toHaveBeenCalledWith(NO_FILTERS, []);
  });
});

describe("the bottom sheet keeps its own shell, not the panel's", () => {
  it("renders the sheet shell and none of the panel's classes", () => {
    render(
      <MicroSheet title="What do you sell?" onClose={() => undefined}>
        <p>A sheet</p>
      </MicroSheet>,
    );

    expect(inDocument(".mp-sheet-scrim")).not.toBeNull();
    expect(inDocument(".mp-sheet")).not.toBeNull();
    expect(inDocument(".mp-sheet__title")?.textContent).toBe("What do you sell?");
    expect(inDocument(".fd-overlay")).toBeNull();
    expect(inDocument(".fd-panel")).toBeNull();
    expect(inDocument(".fd-head")).toBeNull();
  });
});

describe("every modal behaviour survives the re-skin", () => {
  it("moves focus to the panel itself, so a screen reader names what opened", () => {
    renderNarrowSheet();

    expect(document.activeElement).toBe(inDocument(".fd-panel"));
  });

  it("gives focus back to the control that opened it", async () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();

    const view = renderNarrowSheet();
    expect(document.activeElement).not.toBe(opener);

    // Radix restores focus from a macrotask, so wait rather than read at once.
    view.unmount();
    await waitFor(() => expect(document.activeElement).toBe(opener));

    opener.remove();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderNarrowSheet(onClose);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes from the panel header's own control", () => {
    const onClose = vi.fn();
    renderNarrowSheet(onClose);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("locks the page behind it and hides it from a screen reader", () => {
    const behind = document.createElement("main");
    document.body.appendChild(behind);

    renderNarrowSheet();

    expect(document.body.hasAttribute("data-scroll-locked")).toBe(true);
    expect(behind.getAttribute("aria-hidden")).toBe("true");

    behind.remove();
  });
});
