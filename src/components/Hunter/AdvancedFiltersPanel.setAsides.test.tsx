// @vitest-environment jsdom
//
// Feature V4 — the set-aside facet answers an eligibility question, not just a
// filter one. The member's own set-asides sit under "You qualify"; the rest sit
// under "Other set-asides".
//
// Two things this file guards that are easy to lose:
//
// 1. The badge must NEVER say "verified". `GET /opportunities/filters/defaults`
//    returns `setAsides: string[]` and no provenance, so the client cannot tell
//    a self-certified code from one SAM's `cert_flag` confirms. The badge
//    claims where we read the code, not who checked it.
// 2. The grouping costs no network call. It reads the defaults the route has
//    already fetched, through `prefilledValues`.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";

import { AdvancedFiltersPanel } from "./AdvancedFiltersPanel";
import {
  applyProfileDefaults,
  emptyFilters,
  setValues,
  type OpportunityFilters,
} from "../../lib/opportunityFilters";

const QUALIFY = "8A";
const QUALIFY_LABEL = "8(a)";
const ALSO_QUALIFY = "HUBZone";
const OTHER = "SB";
const OTHER_LABEL = "Small Business (Total)";

const BADGE = "You qualify · from your profile";
const ASK_LABEL = "Ask Hunter: do I qualify?";

function memberFilters(setAsides: string[], selected: string[] = []): OpportunityFilters {
  const base = applyProfileDefaults(emptyFilters(), {
    naics: [],
    setAsides,
    states: [],
    cities: [],
  });
  return setValues(base, "setAsides", selected);
}

function renderPanel(filters: OpportunityFilters) {
  const onChange = vi.fn();
  const view = render(<AdvancedFiltersPanel filters={filters} onChange={onChange} opps={[]} />);
  return { onChange, view };
}

// The "Ask Hunter" control is the set-aside facet's own, so it is the stable
// way to scope queries to that facet and not to the seven others.
const askButton = () => screen.getByRole("button", { name: ASK_LABEL });
const facet = () => askButton().closest(".of-acc-content") as HTMLElement;
const group = (name: RegExp) => within(facet()).getByRole("group", { name });
const optionNames = (el: HTMLElement) =>
  within(el)
    .getAllByRole("option")
    .map((o) => o.textContent ?? "");
// The badge's own words split across two spans, so match the element and read
// its whole text.
const badges = () =>
  within(facet()).queryAllByText((_content, el) => el?.classList.contains("of-qual") ?? false);

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  cleanup();
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdvancedFiltersPanel — set-aside eligibility grouping", () => {
  it("puts exactly the member's own set-asides under You qualify", () => {
    renderPanel(memberFilters([QUALIFY, ALSO_QUALIFY]));

    const qualify = optionNames(group(/^you qualify$/i));
    expect(qualify).toHaveLength(2);
    expect(qualify.join(" ")).toContain(QUALIFY_LABEL);
    expect(qualify.join(" ")).toContain("HUBZone");

    const others = optionNames(group(/^other set-asides$/i));
    expect(others.join(" ")).toContain(OTHER_LABEL);
    expect(others.join(" ")).not.toContain(QUALIFY_LABEL);
    expect(others.length).toBeGreaterThan(1);
  });

  it("badges the qualifying option with its source and never says verified", () => {
    const { view } = renderPanel(memberFilters([QUALIFY]));

    const found = badges();
    expect(found).toHaveLength(1);
    expect(found[0].textContent).toBe(BADGE);
    expect(within(group(/^you qualify$/i)).getAllByRole("option")[0].textContent).toContain(BADGE);
    expect(view.container.innerHTML.toLowerCase()).not.toContain("verified");
  });

  it("renders one ungrouped list when the member has no set-asides on file", () => {
    renderPanel(memberFilters([]));

    expect(within(facet()).queryAllByRole("group")).toHaveLength(0);
    expect(badges()).toHaveLength(0);
    expect(within(facet()).getAllByRole("listbox")).toHaveLength(1);
    expect(
      within(facet())
        .getAllByRole("option")
        .filter((o) => o.textContent?.includes(OTHER_LABEL)),
    ).toHaveLength(1);
  });

  it("Select all takes only its own group and leaves the other group's picks", () => {
    const { onChange } = renderPanel(memberFilters([QUALIFY, ALSO_QUALIFY], [OTHER]));

    fireEvent.click(within(group(/^you qualify$/i)).getByRole("button", { name: "Select all" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as OpportunityFilters;
    expect(next.setAsides).toEqual([OTHER, QUALIFY, ALSO_QUALIFY]);
  });

  it("asks Hunter the eligibility question instead of answering it here", () => {
    const heard = vi.fn();
    window.addEventListener("commandbar:ask-hunter", heard);
    renderPanel(memberFilters([QUALIFY]));

    fireEvent.click(screen.getByRole("button", { name: ASK_LABEL }));

    expect(heard).toHaveBeenCalledTimes(1);
    const detail = (heard.mock.calls[0][0] as CustomEvent<{ text: string }>).detail;
    expect(detail.text).toMatch(/qualify/i);
    window.removeEventListener("commandbar:ask-hunter", heard);
  });

  it("fires no network request for any of it", () => {
    renderPanel(memberFilters([QUALIFY, ALSO_QUALIFY]));

    fireEvent.click(within(group(/^you qualify$/i)).getByRole("button", { name: "Select all" }));
    fireEvent.click(screen.getByRole("button", { name: ASK_LABEL }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
