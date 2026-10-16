// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AnchorHTMLAttributes } from "react";
import type { CardOpportunity } from "../../lib/mock/opportunities";
import { glossFor } from "../../lib/filterGlosses";
import { dueDateLabel } from "../../lib/oppDisplay";

// The card links out with TanStack's <Link>, which needs a router context the
// card itself does not own. Stand it in as a plain anchor so the test asserts
// the card's own markup.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...rest}>{children}</a>
  ),
}));

import { OpportunityCard } from "./OpportunityCard";

const GRID_CELLS = 6;
const CLOSING_IN_A_MONTH = 30;
const CLOSING_TOMORROW = 1;

function card(overrides: Partial<CardOpportunity> = {}): CardOpportunity {
  return {
    id: "LOCAL-FS-0001",
    title: "Food service support",
    agency: "Department of Test",
    agencyAbbrev: "DoT",
    workType: "Solicitation",
    value: "$1.2M",
    location: "Austin, TX",
    closeDateAbsolute: "2026-12-01",
    daysUntilClose: CLOSING_IN_A_MONTH,
    matchTier: "good",
    matchScore: 70,
    hunterReasoning: "It fits.",
    mode: "prime",
    scope: "fed",
    category: "contract",
    noticeType: "Solicitation",
    ...overrides,
  };
}

const renderCard = (opp: CardOpportunity, hideHuntersTake = false) =>
  render(
    <OpportunityCard
      opp={opp}
      saved={false}
      onToggleSaved={vi.fn()}
      hideHuntersTake={hideHuntersTake}
      feedTab="for_you"
    />,
  );

function cells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".opp-facts-grid__cell"));
}

/** Finds the grid cell whose key starts with the given label. */
function cellFor(container: HTMLElement, label: string): HTMLElement | undefined {
  return cells(container).find((cell) =>
    cell.querySelector(".opp-facts-grid__k")?.textContent?.startsWith(label),
  );
}

function valueOf(container: HTMLElement, label: string): HTMLElement | null {
  return cellFor(container, label)?.querySelector<HTMLElement>(".opp-facts-grid__v") ?? null;
}

function dueDateValue(container: HTMLElement, opp: CardOpportunity): HTMLElement | null {
  return valueOf(container, dueDateLabel(opp.noticeType));
}

beforeEach(() => {
  cleanup();
});

describe("OpportunityCard facts grid", () => {
  // ─── (a) two columns by three rows, always ─────────────────────────────────

  it("renders exactly six cells for a plain contract opportunity", () => {
    const { container } = renderCard(card());

    expect(cells(container)).toHaveLength(GRID_CELLS);
    expect(container.querySelector(".opp-summary-facts")).toBeNull();
  });

  // ─── (b) the due-date cell keeps the target's dynamic label ────────────────

  it("labels the due date with dueDateLabel for a solicitation", () => {
    const opp = card({ noticeType: "Solicitation" });
    const { container } = renderCard(opp);

    expect(dueDateLabel(opp.noticeType)).toBe("Proposal Due Date");
    expect(dueDateValue(container, opp)?.textContent).toBe("Closes in 30 days");
  });

  it("states an absent deadline rather than printing NaN", () => {
    // WHAT THE MEMBER SAW: "Proposal Due Date: Closes in NaN days".
    //
    // `responseDeadline` is `""` for an opportunity with no `dueDate` (the
    // backend maps `dueDate?.toISOString() ?? ""`), so `daysUntilClose` is NaN.
    // Every comparison against NaN is false, so the value fell past `< 0`,
    // `=== 0` and `=== 1` and reached the template.
    const opp = card({ daysUntilClose: Number.NaN });
    const { container } = renderCard(opp);

    const value = dueDateValue(container, opp)?.textContent ?? "";
    expect(value).toBe("No deadline on file");
    expect(value).not.toMatch(/NaN/);
  });

  it("gives an unknown deadline no urgency colour", () => {
    // It must not read as a calm deadline that was checked, nor borrow the red
    // a closed notice earns.
    const opp = card({ daysUntilClose: Number.NaN });
    const { container } = renderCard(opp);

    const cls = dueDateValue(container, opp)?.className ?? "";
    expect(cls).not.toContain("opp-deadline--critical");
    expect(cls).not.toContain("opp-deadline--urgent");
    expect(cls).not.toContain("opp-deadline--closed");
  });

  it("labels the due date with dueDateLabel for a presolicitation", () => {
    const opp = card({ noticeType: "Presolicitation" });
    const { container } = renderCard(opp);

    expect(dueDateLabel(opp.noticeType)).toBe("Response Due Date");
    expect(dueDateValue(container, opp)).not.toBeNull();
  });

  it("renders an uncoloured expected posting for a forecast", () => {
    const { container } = renderCard(card({ category: "forecast" }));

    const value = valueOf(container, "Expected posting");
    expect(value).not.toBeNull();
    expect(value?.className).not.toMatch(/opp-deadline--/);
    expect(cellFor(container, "Response Due Date")).toBeUndefined();
    expect(cellFor(container, "Proposal Due Date")).toBeUndefined();
    expect(cells(container)).toHaveLength(GRID_CELLS);
  });

  // ─── (c) an absent notice type still holds its cell ────────────────────────

  it("renders 'Not stated' when the notice type is null", () => {
    const { container } = renderCard(card({ noticeType: null }));

    const none = cellFor(container, "Notice type")?.querySelector(".opp-facts-grid__v-none");
    expect(none?.textContent).toBe("Not stated");
    expect(cells(container)).toHaveLength(GRID_CELLS);
  });

  // ─── (d) Scope carries the feature-3 NAICS description ─────────────────────

  it("shows the resolved NAICS description in the Scope cell", () => {
    const { container } = renderCard(
      card({ naicsCode: "722310", naicsDescription: "Food Service Contractors" }),
    );

    expect(valueOf(container, "Scope")?.textContent).toBe("Food Service Contractors");
  });

  it("falls back to the bare code and invents no label when the description is absent", () => {
    const { container } = renderCard(card({ naicsCode: "722310" }));

    expect(valueOf(container, "Scope")?.textContent).toBe("722310");
    expect(container.textContent).not.toContain("Food Service Contractors");
  });

  it("keeps the Scope cell and states nothing when there is no NAICS code", () => {
    const { container } = renderCard(card());

    const none = cellFor(container, "Scope")?.querySelector(".opp-facts-grid__v-none");
    expect(none?.textContent).toBe("Not stated");
    expect(cells(container)).toHaveLength(GRID_CELLS);
  });

  // ─── (e) only real urgency gets colour ─────────────────────────────────────

  it("gives a comfortable deadline no soft colour", () => {
    const opp = card({ daysUntilClose: CLOSING_IN_A_MONTH });
    const { container } = renderCard(opp);

    expect(dueDateValue(container, opp)?.className).not.toContain("opp-deadline--soft");
  });

  it("colours a deadline that is one day away as critical", () => {
    const opp = card({ daysUntilClose: CLOSING_TOMORROW });
    const { container } = renderCard(opp);

    expect(dueDateValue(container, opp)?.className).toContain("opp-deadline--critical");
  });

  // ─── (f) a product buy adds one wide order cell ────────────────────────────

  it("adds a wide order cell for a product buy that carries DIBBS facts", () => {
    const { container } = renderCard(
      card({
        category: "product_buy",
        dibbs: { quantity: 1200, deliverDays: 30, fastAward: false },
      }),
    );

    const wide = container.querySelectorAll(".opp-facts-grid__cell--wide");
    expect(wide).toHaveLength(1);
    expect(wide[0].querySelector(".opp-facts-grid__k")?.textContent).toBe("Order:");
    expect(wide[0].querySelector(".opp-facts-grid__v")?.textContent).toBe(
      "1,200 units · deliver in 30 days",
    );
    expect(cells(container)).toHaveLength(GRID_CELLS + 1);
  });

  it("adds no order cell when the DIBBS payload states no quantity and no delivery", () => {
    const { container } = renderCard(
      card({
        category: "product_buy",
        dibbs: { quantity: null, deliverDays: null, fastAward: false },
      }),
    );

    expect(container.querySelectorAll(".opp-facts-grid__cell--wide")).toHaveLength(0);
    expect(cells(container)).toHaveLength(GRID_CELLS);
  });

  // ─── (g) the top edge differs when no Hunter take sits above the grid ──────

  it("marks the summary block flush and drops the divider when the take is hidden", () => {
    const { container } = renderCard(card(), true);

    const block = container.querySelector(".opp-summary-block");
    expect(block?.classList.contains("opp-summary-block--flush")).toBe(true);
    expect(container.querySelector(".opp-card-hr")).toBeNull();
    expect(container.querySelector(".opp-why-block")).toBeNull();
  });

  it("keeps the divider and the plain top edge when the take is shown", () => {
    const { container } = renderCard(card(), false);

    const block = container.querySelector(".opp-summary-block");
    expect(block?.classList.contains("opp-summary-block--flush")).toBe(false);
    expect(container.querySelector(".opp-card-hr")).not.toBeNull();
    expect(container.querySelector(".opp-why-block")).not.toBeNull();
  });
});

describe("OpportunityCard status chips", () => {
  // ─── (a) a judgement about the member sits under the grid, not inside it ────

  it("renders the certification chip inside the chips container and not in the grid", () => {
    const { container } = renderCard(card({ eligibilityFlag: "needs-cert" }));

    const chips = container.querySelector(".opp-summary-chips");
    const cert = container.querySelector(".opp-elig--cert");
    expect(cert).not.toBeNull();
    expect(chips?.contains(cert)).toBe(true);
    expect(container.querySelector(".opp-facts-grid")?.contains(cert)).toBe(false);
  });

  it("places the chips container directly after the grid", () => {
    const { container } = renderCard(card({ eligibilityFlag: "needs-cert" }));

    expect(container.querySelector(".opp-facts-grid + .opp-summary-chips")).not.toBeNull();
  });

  // ─── (b) the container is always present, and empty means no gap ────────────

  it("renders an empty chips container when no chip condition holds", () => {
    const { container } = renderCard(card());

    const chips = container.querySelector(".opp-summary-chips");
    expect(chips).not.toBeNull();
    expect(chips?.childElementCount).toBe(0);
    expect(chips?.textContent).toBe("");
  });

  // ─── (c) the take-free tabs suppress the member judgements ─────────────────

  it("suppresses the eligibility and prereq chips when Hunter's take is hidden", () => {
    const { container } = renderCard(
      card({ eligibilityFlag: "needs-cert", prereqGated: true }),
      true,
    );

    expect(container.querySelector(".opp-summary-chips")).not.toBeNull();
    expect(container.querySelector(".opp-elig--cert")).toBeNull();
    expect(container.querySelector(".opp-prereq-chip")).toBeNull();
  });
});

describe("OpportunityCard summary header", () => {
  // The kicker is gone. The divider above and the title below already mark
  // where Hunter's take ends and the facts begin.

  it("renders the title inside the summary head", () => {
    const { container } = renderCard(card());

    const head = container.querySelector(".opp-summary-head");
    const title = container.querySelector(".opp-title-compact");
    expect(title).not.toBeNull();
    expect(head?.contains(title)).toBe(true);
  });

  it("renders no summary kicker", () => {
    const { container } = renderCard(card());

    expect(container.querySelector(".opp-summary-kicker")).toBeNull();
    expect(container.textContent).not.toContain("Opportunity summary");
  });

  it("keeps the plain-English title in front of the raw notice title", () => {
    const { container } = renderCard(card({ geminiPlainEnglishTitle: "Cook meals for a base" }));

    expect(container.querySelector(".opp-title-compact")?.textContent).toBe(
      "Cook meals for a base",
    );
  });
});

describe("status chips styles", () => {
  // Vitest resolves the project root as the working directory.
  const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

  it("carries a .opp-summary-chips rule and an :empty rule that collapses it", () => {
    expect(css).toMatch(/^\.opp-summary-chips\s*\{/m);
    expect(css).toMatch(/^\.opp-summary-chips:empty\s*\{[^}]*display:\s*none/m);
  });
});

describe("OpportunityCard set-aside pill", () => {
  // The backend sends set-aside CODES. `glossFor` keys on those codes, and on
  // the normalised "Full and Open Competition" label.
  const SDVOSB_CODE = "SDVOSBC";
  const RAW_FULL_OPEN = "Full and Open Competition (No Set-Aside)";

  function setAsidePill(container: HTMLElement): HTMLElement | null {
    return container.querySelector<HTMLElement>(".scope-pill--setaside");
  }

  /** Opens the tooltip and returns the text the trigger describes itself with. */
  async function accessibleDescription(trigger: HTMLElement): Promise<string> {
    const describedBy = trigger.getAttribute("aria-describedby") ?? "";
    expect(describedBy).not.toBe("");
    fireEvent.focus(trigger);
    await waitFor(() => expect(document.getElementById(describedBy)).not.toBeNull());
    return document.getElementById(describedBy)?.textContent ?? "";
  }

  // ─── (a) a backend code renders one glossed pill ──────────────────────────

  it("renders one set-aside pill whose accessible description is the code's gloss", async () => {
    const gloss = glossFor(SDVOSB_CODE) ?? "";
    expect(gloss).not.toBe("");
    const { container } = renderCard(card({ setAside: SDVOSB_CODE }));

    expect(container.querySelectorAll(".scope-pill--setaside")).toHaveLength(1);
    const pill = setAsidePill(container) as HTMLElement;
    expect(pill.textContent).toBe(SDVOSB_CODE);
    expect(pill.classList.contains("scope-pill")).toBe(true);
    await expect(accessibleDescription(pill)).resolves.toContain(gloss);
  });

  it("puts the set-aside pill beside the Fed/SLED pill", () => {
    const { container } = renderCard(card({ setAside: SDVOSB_CODE }));

    const metaRight = container.querySelector(".opp-meta-right");
    expect(metaRight?.contains(container.querySelector(".scope-pill--fed"))).toBe(true);
    expect(metaRight?.contains(setAsidePill(container))).toBe(true);
  });

  // ─── (b) no set-aside, no pill ────────────────────────────────────────────

  it("renders no set-aside pill when the opportunity carries no set-aside", () => {
    const { container } = renderCard(card({ setAside: undefined }));

    expect(setAsidePill(container)).toBeNull();
  });

  // ─── (c) a raw Full-and-Open value normalises and still glosses ───────────

  it("normalises a raw Full-and-Open value and still resolves a gloss", async () => {
    const gloss = glossFor(RAW_FULL_OPEN) ?? "";
    expect(gloss).not.toBe("");
    const { container } = renderCard(card({ setAside: RAW_FULL_OPEN }));

    const pill = setAsidePill(container) as HTMLElement;
    expect(pill.textContent).toBe("Full and Open Competition");
    await expect(accessibleDescription(pill)).resolves.toContain(gloss);
  });
});

describe("set-aside pill styles", () => {
  // Vitest resolves the project root as the working directory.
  const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

  it("carries a .scope-pill--setaside rule that neutralises the dotted underline", () => {
    expect(css).toMatch(/^\.scope-pill--setaside\s*\{[^}]*border-bottom:/m);
  });

  it("leaves the shared .scope-pill base rule free of gloss-term overrides", () => {
    const base = /^\.scope-pill\s*\{([^}]*)\}/m.exec(css)?.[1] ?? "";
    expect(base).not.toBe("");
    expect(base).not.toContain("border-bottom");
  });

  it("opens a forecast on the forecast page, and any other card on the opportunity page", () => {
    const forecast = renderCard(card({ category: "forecast" })).container.querySelector("a");
    expect(forecast?.getAttribute("to")).toBe("/forecasts/$forecastId");
    cleanup();
    const contract = renderCard(card()).container.querySelector("a");
    expect(contract?.getAttribute("to")).toBe("/opportunities/$noticeId");
  });
});
