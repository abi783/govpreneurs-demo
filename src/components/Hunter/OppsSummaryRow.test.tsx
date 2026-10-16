// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import type { BusinessProfile } from "../../lib/businessProfile";

// `useGhlUser` throws outside its provider, and `useBusinessProfile` would issue
// a real fetch. Both are stubbed; `weightingDimensions` stays REAL so the
// "Why these?" assertion below reads the profile through production code.
vi.mock("../../lib/ghlUser", () => ({
  useGhlUser: () => ({ session: { locationId: "loc-1" }, loading: false }),
}));

let profileState: { profile: BusinessProfile | null; loading: boolean } = {
  profile: null,
  loading: false,
};

vi.mock("../../lib/businessProfile", async (orig) => ({
  ...(await orig<typeof import("../../lib/businessProfile")>()),
  useBusinessProfile: () => ({ ...profileState, error: null }),
}));

const { OppsSummaryRow } = await import("./OppsSummaryRow");

const PROFILE: BusinessProfile = {
  ghlLocationId: "loc-1",
  primaryNaics: "238160",
  naicsCodes: ["238160"],
  naicsLabels: { "238160": "Roofing Contractors" },
  stateCodes: ["nc"],
  cities: ["raleigh"],
  socioEconomicCerts: ["SDVOSBC"],
  certifications: [],
  capabilityStatementUrl: "https://example.test/cap.pdf",
  uei: null,
  cage: null,
  ein: null,
  website: null,
};

let reduceMotion = false;

function mockMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduceMotion,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

function renderRow(props: Partial<Parameters<typeof OppsSummaryRow>[0]> = {}) {
  return render(
    <OppsSummaryRow
      matchCount={12}
      newThisWeek={4}
      activeCount={0}
      sort="match"
      onSortChange={() => {}}
      onOpenFilters={() => {}}
      onSaveSearch={() => {}}
      {...props}
    />,
  );
}

describe("OppsSummaryRow", () => {
  beforeEach(() => {
    reduceMotion = false;
    profileState = { profile: null, loading: false };
    mockMatchMedia();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  describe("Save this search", () => {
    it("renders a Save control with an accessible name, right of Sort", () => {
      const { container } = renderRow();
      const save = screen.getByRole("button", { name: "Save this search" });
      expect(save).toBeTruthy();
      expect(save.className).toContain("opps-summary__btn");

      // Placement: last control in the row, after the sort menu.
      const controls = container.querySelector(".opps-summary__controls")!;
      const order = Array.from(controls.children);
      const sortIdx = order.findIndex((el) => el.querySelector(".opps-sort-menu__trigger"));
      expect(sortIdx).toBeGreaterThanOrEqual(0);
      const saveIdx = order.findIndex((el) => el === save || el.contains(save));
      expect(saveIdx).toBeGreaterThan(sortIdx);
    });

    it("opens the shared SaveSearchPopover and posts the name once", () => {
      const onSaveSearch = vi.fn();
      renderRow({ onSaveSearch });

      fireEvent.click(screen.getByRole("button", { name: "Save this search" }));

      const input = screen.getByLabelText("Saved search name") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Raleigh re-roofs" } });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(onSaveSearch).toHaveBeenCalledTimes(1);
      expect(onSaveSearch).toHaveBeenCalledWith("Raleigh re-roofs");
    });
  });

  describe('"new this week"', () => {
    it("prints nothing — not a zero, not a separator — when none are new", () => {
      const { container } = renderRow({ newThisWeek: 0 });
      expect(container.textContent).not.toContain("new this week");
      expect(container.querySelector(".opps-summary__sep")).toBeNull();
    });

    it("prints the count when there are new opportunities", () => {
      const { container } = renderRow({ newThisWeek: 4 });
      expect(container.textContent).toContain("4 new this week");
      expect(container.querySelector(".opps-summary__sep")).not.toBeNull();
    });
  });

  describe("the match count ticker", () => {
    it("carries the CountTicker class and keeps digit grouping", () => {
      const { container } = renderRow({ matchCount: 1234 });
      const ticker = container.querySelector(".count-ticker")!;
      expect(ticker).not.toBeNull();
      expect(ticker.textContent).toBe("1,234");
    });

    it("animates to the new value and settles on the grouped figure", () => {
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        frames.push(cb);
        return frames.length;
      });
      let now = 0;
      vi.spyOn(performance, "now").mockImplementation(() => now);

      const { container, rerender } = renderRow({ matchCount: 0 });
      rerender(
        <OppsSummaryRow
          matchCount={1234}
          newThisWeek={4}
          activeCount={0}
          sort="match"
          onSortChange={() => {}}
          onOpenFilters={() => {}}
          onSaveSearch={() => {}}
        />,
      );

      const ticker = () => container.querySelector(".count-ticker")!.textContent;
      expect(frames.length).toBeGreaterThan(0);

      now = 250;
      act(() => frames.shift()!(now));
      const mid = ticker()!;
      expect(mid).not.toBe("1,234");

      now = 5000;
      act(() => frames.shift()!(now));
      expect(ticker()).toBe("1,234");
    });

    it("renders the final value with no intermediate frames under prefers-reduced-motion", () => {
      reduceMotion = true;
      mockMatchMedia();
      const raf = vi.spyOn(window, "requestAnimationFrame");

      const { container, rerender } = renderRow({ matchCount: 0 });
      rerender(
        <OppsSummaryRow
          matchCount={1234}
          newThisWeek={4}
          activeCount={0}
          sort="match"
          onSortChange={() => {}}
          onOpenFilters={() => {}}
          onSaveSearch={() => {}}
        />,
      );

      expect(container.querySelector(".count-ticker")!.textContent).toBe("1,234");
      expect(raf).not.toHaveBeenCalled();
    });
  });

  describe("Why these?", () => {
    it("names values from the member's real business profile", () => {
      profileState = { profile: PROFILE, loading: false };
      const { container } = renderRow();

      fireEvent.click(screen.getByRole("button", { name: "Why these?" }));

      const reasoning = container.querySelector(".opps-summary__reasoning")!;
      expect(reasoning.textContent).toContain("Roofing Contractors");
      expect(reasoning.textContent).toContain("Raleigh, NC");
      expect(reasoning.textContent).toContain("Service-Disabled Veteran-Owned Small Business");
    });

    it("prompts for a capability statement when the profile has none", () => {
      profileState = { profile: { ...PROFILE, capabilityStatementUrl: null }, loading: false };
      renderRow();

      fireEvent.click(screen.getByRole("button", { name: "Why these?" }));

      expect(screen.getByText("Add a capability statement")).toBeTruthy();
    });
  });
});
