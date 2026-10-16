// @vitest-environment jsdom
//
// The forecast list card's take line: the AI line when the server gave one, else the
// rule-built line. The rule-built line is always there first, so no skeleton can stick.
//
// The card's fit chip (ARCHITECTURE-forecasts-paginated.md, section 9): the tier of
// the member's `matches` row, on every tab. No match row, no chip. A card that is no
// longer open shows no chip either. The engine's own fit never makes a chip.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to: _to,
    params: _params,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    to?: string;
    params?: unknown;
    children?: ReactNode;
  }) => <a {...rest}>{children}</a>,
}));
vi.mock("../../lib/api", () => ({ API_BASE_URL: "http://api.test", apiFetch: vi.fn() }));

import { ForecastCard } from "./ForecastCard";
import { FIT_CHIP, KICKER, LIFECYCLE_LABEL } from "../../lib/forecasts/copy";
import type { ScoredForecast } from "../../lib/forecasts/engine";
import type { ForecastMatchRead, ForecastMatchTier } from "../../lib/forecastsApi";

const RULE_LINE = "The kind of work your business does.";
const AI_LINE = "This is roofing work, which is what your business does.";

/** A strong match row: the fit kicker shows only beside a "bid" chip. */
const STRONG: ForecastMatchRead = { tier: "strong", finalScore: 72 };

function forecast(
  fit: ScoredForecast["fit"] = "good",
  lifecycle: ScoredForecast["lifecycle"] = "open",
): ScoredForecast {
  return {
    id: "fc-1",
    lane: "federal",
    lifecycle,
    fit,
    facts: { title: "Roof repair at the depot", why: RULE_LINE },
    record: { agencyName: "Department of the Army" },
    value: null,
    place: { label: null, ourRead: false },
    timing: { label: "Q1 2027", ourRead: false },
    whoMayBid: { kind: "not_shared", text: "Not shared" },
    boughtBefore: { text: "Not shared" },
    foundIn: null,
  } as unknown as ScoredForecast;
}

afterEach(cleanup);

describe("ForecastCard expected date passed", () => {
  it("marks a forecast past its expected date, and never says closed or no longer open", () => {
    const { container } = render(
      <ForecastCard
        forecast={forecast("good", "stale")}
        tracked={false}
        onToggleTracked={vi.fn()}
      />,
    );
    expect(screen.getByText(LIFECYCLE_LABEL.passed)).toBeTruthy();
    expect(LIFECYCLE_LABEL.passed).toBe("Expected date passed");
    expect(container.textContent ?? "").not.toMatch(/no longer open|closed|out of date/i);
  });

  it("carries no mark on an open forecast", () => {
    render(<ForecastCard forecast={forecast()} tracked={false} onToggleTracked={vi.fn()} />);
    expect(screen.queryByText(LIFECYCLE_LABEL.passed)).toBeNull();
  });
});

describe("ForecastCard take line", () => {
  it("shows the rule-built line and the fit kicker when there is no AI line", () => {
    render(
      <ForecastCard
        forecast={forecast()}
        match={STRONG}
        tracked={false}
        onToggleTracked={vi.fn()}
      />,
    );
    expect(screen.getByText(RULE_LINE)).toBeTruthy();
    expect(screen.getByText(KICKER.fits)).toBeTruthy();
  });

  it("shows the AI line in place of the rule-built line", () => {
    render(
      <ForecastCard
        forecast={forecast()}
        aiTake={AI_LINE}
        tracked={false}
        onToggleTracked={vi.fn()}
      />,
    );
    expect(screen.getByText(AI_LINE)).toBeTruthy();
    expect(screen.queryByText(RULE_LINE)).toBeNull();
  });

  it("labels an AI line as Hunter's take, never as why it fits", () => {
    render(
      <ForecastCard
        forecast={forecast("best")}
        match={STRONG}
        aiTake={AI_LINE}
        tracked={false}
        onToggleTracked={vi.fn()}
      />,
    );
    expect(screen.getByText(KICKER.take)).toBeTruthy();
    expect(screen.queryByText(KICKER.fits)).toBeNull();
  });

  it("falls back to the rule-built line for an empty AI line", () => {
    render(
      <ForecastCard
        forecast={forecast()}
        match={STRONG}
        aiTake="  "
        tracked={false}
        onToggleTracked={vi.fn()}
      />,
    );
    expect(screen.getByText(RULE_LINE)).toBeTruthy();
    expect(screen.getByText(KICKER.fits)).toBeTruthy();
  });

  it("renders money in an AI line the same way as in the rule-built line", () => {
    render(
      <ForecastCard
        forecast={forecast()}
        aiTake="The estimate is $250,000 for this roofing work."
        tracked={false}
        onToggleTracked={vi.fn()}
      />,
    );
    expect(screen.getByText("$250,000")).toBeTruthy();
  });
});

describe("ForecastCard fit chip", () => {
  const chip = () => document.querySelector(".fc-fit");
  const verdict = () => document.querySelector(".fc-card")?.getAttribute("data-verdict") ?? null;

  function renderCard(match: ForecastMatchRead | null, f = forecast()) {
    render(<ForecastCard forecast={f} match={match} tracked={false} onToggleTracked={vi.fn()} />);
  }

  it.each<[ForecastMatchTier, "bid" | "lean" | "pass"]>([
    ["priority", "bid"],
    ["strong", "bid"],
    ["stretch", "lean"],
    ["low", "pass"],
  ])("shows the %s match row as the %s chip", (tier, want) => {
    renderCard({ tier, finalScore: 50 });
    expect(chip()?.textContent).toBe(FIT_CHIP[want]);
    expect(chip()?.classList.contains(`fc-fit--${want}`)).toBe(true);
    expect(verdict()).toBe(want);
  });

  it("shows no chip when the card has no match row, whatever the engine says", () => {
    renderCard(null, forecast("best"));
    expect(chip()).toBeNull();
    expect(verdict()).toBeNull();
    // The fit kicker belongs to a "bid" chip, so a card with no row says "Hunter's take".
    expect(screen.getByText(KICKER.take)).toBeTruthy();
    expect(screen.queryByText(KICKER.fits)).toBeNull();
  });

  it("shows no chip on a card that is no longer open, even with a strong row", () => {
    renderCard(STRONG, forecast("good", "stale"));
    expect(chip()).toBeNull();
    expect(verdict()).toBeNull();
  });

  it("does not call a stretch or low row a fit in the kicker", () => {
    renderCard({ tier: "stretch", finalScore: 45 }, forecast("best"));
    expect(screen.getByText(KICKER.take)).toBeTruthy();
    expect(screen.queryByText(KICKER.fits)).toBeNull();
  });
});
