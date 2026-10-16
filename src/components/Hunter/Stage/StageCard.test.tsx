// @vitest-environment jsdom
//
// Feature 13 — the stage-card canvas shell.
//
// The harness reproduces the feed's composition shape from ARCHITECTURE §3(d):
// a summary row, then `StageCardMount`, then the active filter chips, then the
// opportunity list. The point of every test here is that the mount is a SIBLING
// of the list, never a wrapper around it.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import type { EligibilityPayload } from "../../../lib/hunterChat";
import { StageStoreProvider, useStageStore } from "../../../lib/hunter/stageStore";
import { StageCardMount } from "./StageCard";

function payload(over: Partial<EligibilityPayload> = {}): EligibilityPayload {
  return {
    oppKey: "opp-1",
    title: "Dining facility attendant services",
    agency: "Department of the Army",
    verdict: "certify_to_qualify",
    verdictLabel: "Certify to qualify",
    soleSource: false,
    rows: [
      { field: "Set-aside", value: "SDVOSB set-aside", status: "fail" },
      { field: "NAICS", value: "722310 — Food service contractors", status: "pass" },
      { field: "Place of performance", value: "Fayetteville, NC", status: "warn" },
      { field: "Deadline", value: "Closes in 21 days", status: "neutral" },
    ],
    note: "Registering the certification is the one blocker.",
    ...over,
  };
}

/** Drives the store from inside the provider, the way the chat overlay does. */
function Driver({ first, second }: { first: EligibilityPayload; second: EligibilityPayload }) {
  const { showArtifact, dismissArtifact } = useStageStore();
  return (
    <div>
      <button type="button" onClick={() => showArtifact({ kind: "scorecard", payload: first })}>
        drive first
      </button>
      <button type="button" onClick={() => showArtifact({ kind: "scorecard", payload: second })}>
        drive second
      </button>
      <button type="button" onClick={dismissArtifact}>
        drive dismiss
      </button>
    </div>
  );
}

function Harness({
  resultCount = 5,
  first = payload(),
  second = payload({ oppKey: "opp-2", title: "Grounds maintenance" }),
}: {
  resultCount?: number;
  first?: EligibilityPayload;
  second?: EligibilityPayload;
}) {
  return (
    <StageStoreProvider>
      <Driver first={first} second={second} />
      <div data-testid="opps-summary-row">5 matches</div>
      <StageCardMount resultCount={resultCount} />
      <div className="fd-active-chips__row" role="list" data-testid="chips">
        <span role="listitem" className="opps-bar__chip">
          North Carolina
        </span>
        <span role="listitem" className="opps-bar__chip">
          SDVOSB
        </span>
      </div>
      <div data-testid="opp-list">
        <article data-testid="opp-card">Dining facility attendant services</article>
        <article data-testid="opp-card">Grounds maintenance</article>
      </div>
    </StageStoreProvider>
  );
}

function setMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function stageCards(): NodeListOf<Element> {
  return document.querySelectorAll(".stage-card");
}

beforeEach(() => {
  cleanup();
  setMotion(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StageCardMount — the feed stays alive underneath (13a)", () => {
  it("renders nothing until an artifact is set", () => {
    render(<Harness />);
    expect(stageCards()).toHaveLength(0);
    expect(screen.getByTestId("opp-list")).toBeTruthy();
  });

  it("keeps the opportunity list and the filter chips in the DOM, un-remounted", () => {
    render(<Harness />);
    const listBefore = screen.getByTestId("opp-list");
    const chipsBefore = screen.getByTestId("chips");
    const chipLabels = Array.from(chipsBefore.querySelectorAll(".opps-bar__chip")).map(
      (n) => n.textContent,
    );

    fireEvent.click(screen.getByText("drive first"));

    expect(stageCards()).toHaveLength(1);
    // Same DOM nodes, not equivalent ones: a wrapper would have remounted them.
    expect(screen.getByTestId("opp-list")).toBe(listBefore);
    expect(screen.getByTestId("chips")).toBe(chipsBefore);
    expect(screen.getAllByTestId("opp-card")).toHaveLength(2);
    expect(
      Array.from(screen.getByTestId("chips").querySelectorAll(".opps-bar__chip")).map(
        (n) => n.textContent,
      ),
    ).toEqual(chipLabels);
  });

  it("mounts the stage between the summary row and the chips", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));
    const nodes = Array.from(document.querySelectorAll("[data-testid], .stage-card"));
    const order = nodes.map((n) => n.getAttribute("data-testid") ?? "stage-card");
    expect(order.indexOf("stage-card")).toBeGreaterThan(order.indexOf("opps-summary-row"));
    expect(order.indexOf("stage-card")).toBeLessThan(order.indexOf("chips"));
  });
});

describe("the stage brings itself into view", () => {
  // The stage sits ABOVE the feed, and the member is usually reading the rail
  // when it changes — a tool turn just answered, or they clicked the thread's
  // mini card to re-show one. Without this the card they asked for could open
  // off-screen with nothing saying so.
  function spyScroll() {
    const scroll = vi.fn();
    // jsdom implements no layout, so the method is simply ABSENT on the
    // prototype — which is why the component guards on the method rather than
    // on the element, and why this has to install it rather than spy on it.
    (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = scroll;
    return scroll;
  }

  it("scrolls the card into view when an artifact lands", () => {
    const scroll = spyScroll();
    render(<Harness />);
    expect(scroll).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("drive first"));

    expect(scroll).toHaveBeenCalledTimes(1);
    // Centred, not top-aligned: the point is to see the card AND keep the list
    // it sits above in view.
    expect(scroll.mock.calls[0][0]).toMatchObject({ block: "center" });
  });

  it("scrolls again when a second artifact replaces the first", () => {
    // Re-showing from the thread is the same motion as a fresh turn: the store
    // increments its key, so the effect must fire again rather than sit still.
    const scroll = spyScroll();
    render(<Harness />);

    fireEvent.click(screen.getByText("drive first"));
    fireEvent.click(screen.getByText("drive second"));

    expect(scroll).toHaveBeenCalledTimes(2);
  });

  it("does not animate the scroll when the member asked for reduced motion", () => {
    setMotion(true);
    const scroll = spyScroll();
    render(<Harness />);

    fireEvent.click(screen.getByText("drive first"));

    expect(scroll.mock.calls[0][0]).toMatchObject({ behavior: "auto" });
  });

  it("animates it otherwise", () => {
    setMotion(false);
    const scroll = spyScroll();
    render(<Harness />);

    fireEvent.click(screen.getByText("drive first"));

    expect(scroll.mock.calls[0][0]).toMatchObject({ behavior: "smooth" });
  });

  it("costs only the scroll where the browser cannot do it", () => {
    // jsdom's own condition: no `scrollIntoView` at all. An unguarded call threw
    // out of the effect and took 47 unrelated tests with it.
    delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
    render(<Harness />);

    expect(() => fireEvent.click(screen.getByText("drive first"))).not.toThrow();
    expect(stageCards()).toHaveLength(1);
  });
});

describe("one artifact at a time (13b)", () => {
  it("replaces the first artifact with the second", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));
    expect(document.querySelector(".stage-card")?.textContent).toContain(
      "Dining facility attendant services",
    );

    fireEvent.click(screen.getByText("drive second"));

    expect(stageCards()).toHaveLength(1);
    expect(document.querySelector(".stage-card")?.textContent).toContain("Grounds maintenance");
  });

  it("still shows exactly one card when the same artifact is shown twice", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));
    fireEvent.click(screen.getByText("drive first"));
    expect(stageCards()).toHaveLength(1);
  });
});

describe("the dismiss control (13c)", () => {
  it("names the real result count and leaves list and chips untouched", () => {
    render(<Harness resultCount={5} />);
    fireEvent.click(screen.getByText("drive first"));

    const back = screen.getByRole("button", { name: "Back to your 5 results" });
    const listBefore = screen.getByTestId("opp-list");
    const chipsBefore = screen.getByTestId("chips");

    fireEvent.click(back);

    expect(stageCards()).toHaveLength(0);
    expect(screen.getByTestId("opp-list")).toBe(listBefore);
    expect(screen.getByTestId("chips")).toBe(chipsBefore);
    expect(screen.getAllByTestId("opp-card")).toHaveLength(2);
  });

  it("says result, singular, for one result", () => {
    render(<Harness resultCount={1} />);
    fireEvent.click(screen.getByText("drive first"));
    expect(screen.getByRole("button", { name: "Back to your 1 result" })).toBeTruthy();
  });

  it("is first in the card's DOM order", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));
    const card = document.querySelector(".stage-card");
    expect(card?.querySelector("button")?.className).toContain("stage-card__back");
  });

  it("does not dismiss on Escape — the stage is not a modal", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document.querySelector(".stage-card") as Element, { key: "Escape" });
    expect(stageCards()).toHaveLength(1);
  });
});

describe("the live region and reduced motion (13d)", () => {
  it("carries role=region and aria-live=polite, named for the artifact", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));
    const card = document.querySelector(".stage-card") as HTMLElement;
    expect(card.getAttribute("role")).toBe("region");
    expect(card.getAttribute("aria-live")).toBe("polite");
    expect(card.getAttribute("aria-label")).toBe(
      "Readiness check for Dining facility attendant services is on screen",
    );
  });

  it("reveals every row with no stagger timer when motion is reduced", () => {
    setMotion(true);
    const timer = vi.spyOn(window, "setTimeout");
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));

    const rows = document.querySelectorAll(".scorecard__row");
    expect(rows).toHaveLength(4);
    rows.forEach((r) => {
      expect(r.className).toContain("is-in");
      expect(r.className).not.toContain("is-pre");
    });
    expect(document.querySelector(".stage-card")?.className).toContain("is-instant");
    expect(timer).not.toHaveBeenCalled();
  });

  it("staggers the rows when motion is not reduced", () => {
    setMotion(false);
    vi.useFakeTimers();
    try {
      render(<Harness />);
      fireEvent.click(screen.getByText("drive first"));
      expect(document.querySelectorAll(".scorecard__row.is-pre").length).toBeGreaterThan(0);
      act(() => vi.runAllTimers());
      expect(document.querySelectorAll(".scorecard__row.is-pre")).toHaveLength(0);
      expect(document.querySelectorAll(".scorecard__row.is-in")).toHaveLength(4);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("the scorecard keeps four statuses distinct", () => {
  it("maps pass, fail, warn and neutral onto four dots with four names", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));

    const dots = Array.from(document.querySelectorAll(".scorecard__dot"));
    expect(dots.map((d) => d.className.replace("scorecard__dot ", ""))).toEqual([
      "is-missing",
      "is-have",
      "is-marginal",
      "is-confirm",
    ]);
    const names = dots.map((d) => d.getAttribute("aria-label"));
    expect(new Set(names).size).toBe(4);
    expect(names).toContain("We checked this; it is marginal");
    expect(names).toContain("We have not checked this");
  });

  it("renders the verdict, every row field and value, and the note", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("drive first"));
    const card = document.querySelector(".stage-card") as HTMLElement;
    expect(card.textContent).toContain("Certify to qualify");
    expect(card.textContent).toContain("Set-aside");
    expect(card.textContent).toContain("722310 — Food service contractors");
    expect(card.textContent).toContain("Registering the certification is the one blocker.");
  });

  it("drops the note and the sole-source flag out rather than inventing copy", () => {
    render(<Harness first={payload({ note: null, soleSource: false, title: "No note here" })} />);
    fireEvent.click(screen.getByText("drive first"));
    expect(document.querySelector(".scorecard__footnote")).toBeNull();
    expect(document.querySelector(".scorecard__sole")).toBeNull();
  });

  it("shows the sole-source flag when the payload carries it", () => {
    render(<Harness first={payload({ soleSource: true })} />);
    fireEvent.click(screen.getByText("drive first"));
    expect(document.querySelector(".scorecard__sole")).not.toBeNull();
  });
});
