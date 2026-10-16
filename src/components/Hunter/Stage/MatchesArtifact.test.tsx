// @vitest-environment jsdom
//
// Feature 14 — the ranked shortlist on the stage. It renders what the matching
// engine sent and nothing it worked out itself: `MatchesPayload` carries no
// score and no total, and none appears.
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { MatchesPayload } from "../../../lib/hunterChat";
import { MAX_MATCH_ROWS } from "../../../lib/renderLimits";

// The row is a router link. The router itself is not under test here.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    to,
    params,
  }: {
    children: React.ReactNode;
    className?: string;
    to: string;
    params?: Record<string, string>;
  }) => (
    <a
      className={className}
      href={to.replace(/\$(\w+)/g, (_, name: string) => params?.[name] ?? "")}
    >
      {children}
    </a>
  ),
}));

const { MatchesArtifact } = await import("./MatchesArtifact");

/** A payload shaped exactly as `get_best_matches` returns one. */
function payload(over: Partial<MatchesPayload> = {}): MatchesPayload {
  return {
    rows: [
      {
        oppKey: "opp-a",
        title: "Dining facility attendant services",
        tier: "priority",
        matchReasons: ["Your NAICS 722310", "Within your service radius"],
        dueDate: "2026-10-15T00:00:00.000Z",
        agency: "Department of the Army",
      },
      {
        oppKey: "opp-b",
        title: "Grounds maintenance",
        tier: "stretch",
        matchReasons: [],
        dueDate: null,
        agency: null,
      },
    ],
    ...over,
  };
}

beforeEach(cleanup);

describe("MatchesArtifact renders the live payload", () => {
  it("shows one linked row per match, with its tier and the server's reasons", () => {
    const { container } = render(<MatchesArtifact payload={payload()} />);
    const rows = container.querySelectorAll(".hunter-matches__row");
    expect(rows).toHaveLength(2);
    expect(rows[0].getAttribute("href")).toBe("/opportunities/opp-a");
    expect(rows[0].textContent).toContain("Priority");
    expect(rows[0].textContent).toContain("Dining facility attendant services");
    expect(rows[0].textContent).toContain("Your NAICS 722310");
    expect(rows[1].textContent).toContain("Stretch");
  });

  it("drops the reasons and the meta line out when the row carries neither", () => {
    const { container } = render(<MatchesArtifact payload={payload()} />);
    const rows = container.querySelectorAll(".hunter-matches__row");
    expect(rows[1].querySelector(".hunter-matches__reasons")).toBeNull();
    expect(rows[1].querySelector(".hunter-matches__meta")).toBeNull();
  });

  it("prints no score and no total — the payload carries neither", () => {
    const { container } = render(<MatchesArtifact payload={payload()} />);
    expect(container.textContent).not.toMatch(/\b\d{1,3}\s*%/);
    expect(container.textContent).not.toMatch(/score/i);
  });

  it("labels a tier the union does not name rather than leaving it blank", () => {
    const rows = payload().rows;
    const odd = { ...rows[0], tier: "constructor" as MatchesPayload["rows"][number]["tier"] };
    const { container } = render(<MatchesArtifact payload={{ rows: [odd] }} />);
    expect(container.querySelector(".hunter-matches__tier")?.textContent).toBe("Match");
  });

  it("survives a malformed payload rather than throwing the route away", () => {
    const { container } = render(<MatchesArtifact payload={{} as unknown as MatchesPayload} />);
    expect(container.querySelectorAll(".hunter-matches__row")).toHaveLength(0);
  });

  it("applies MAX_MATCH_ROWS and says how many it did not show", () => {
    const many = Array.from({ length: MAX_MATCH_ROWS + 4 }, (_, i) => ({
      oppKey: `opp-${i}`,
      title: `Opportunity ${i}`,
      tier: "strong" as const,
      matchReasons: [],
      dueDate: null,
      agency: null,
    }));
    const { container } = render(<MatchesArtifact payload={{ rows: many }} />);
    expect(container.querySelectorAll(".hunter-matches__row")).toHaveLength(MAX_MATCH_ROWS);
    expect(container.querySelector(".hunter-matches__more")?.textContent).toBe(
      "and 4 more not shown",
    );
  });

  it("opens a forecast on the forecast page, and calls its date expected, not due", () => {
    const { container } = render(
      <MatchesArtifact
        payload={payload({
          rows: [
            {
              oppKey: "fc-1",
              title: "Park signage program",
              tier: "strong",
              matchReasons: [],
              dueDate: "2026-10-15T00:00:00.000Z",
              agency: "City of Palm Coast",
              sourceType: "sled_forecast",
            },
          ],
        })}
      />,
    );
    const row = container.querySelector("a.hunter-matches__row");
    expect(row?.getAttribute("href")).toBe("/forecasts/fc-1");
    expect(row?.textContent).toContain("Expected");
    expect(row?.textContent).not.toContain("Due");
  });
});
