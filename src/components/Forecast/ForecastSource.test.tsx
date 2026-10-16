// @vitest-environment jsdom
//
// Forecast source: a federal publisher links to its department's forecast site when the
// API sends one. Without a site, and on a local forecast, the box reads as before.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ForecastSource } from "./ForecastSource";
import type { ScoredForecast } from "../../lib/forecasts/engine";
import { SCORED_FORECASTS } from "../../lib/forecasts/__fixtures__/scored";
import type { HigherGovForecast } from "../../lib/forecasts/records";

const DHS = { name: "Department of Homeland Security", url: "https://apfs-cloud.dhs.gov/" };
const FEDERAL = SCORED_FORECASTS.find((x) => x.lane === "federal") as ScoredForecast;
const LOCAL = SCORED_FORECASTS.find((x) => x.lane === "sled") as ScoredForecast;

/** A federal forecast from USCIS with no direct link, and the given site. */
function uscis(overrides: Partial<HigherGovForecast> = {}): ScoredForecast {
  return {
    ...FEDERAL,
    record: {
      ...FEDERAL.record,
      agencyName: "Citizen and Immigration Services",
      sourceName: null,
      sourceLink: null,
      hgTitle: "Detainee Meals",
      sourceId: "F2026075039",
      ...overrides,
    },
  };
}

afterEach(cleanup);

describe("ForecastSource", () => {
  it("links the publisher and the search hint to the department forecast site", () => {
    render(<ForecastSource f={uscis({ publisherSite: DHS })} />);
    const who = screen.getByRole("link", { name: "Citizen and Immigration Services" });
    expect(who.getAttribute("href")).toBe(DHS.url);
    expect(who.getAttribute("target")).toBe("_blank");
    expect(who.getAttribute("rel")).toBe("noopener noreferrer");
    expect(who.closest("p")?.textContent?.trim()).toBe(
      "Published by Citizen and Immigration Services",
    );

    const site = screen.getByRole("link", {
      name: "Department of Homeland Security forecast site",
    });
    expect(site.getAttribute("href")).toBe(DHS.url);
    expect(site.closest("p")?.textContent?.replace(/\s+/g, " ")).toBe(
      "There is no public link to this forecast. Search the Department of Homeland Security forecast site for their title or this number.",
    );
  });

  it("reads as before when there is no site", () => {
    render(<ForecastSource f={uscis({ publisherSite: null })} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Published by Citizen and Immigration Services")).toBeTruthy();
    expect(
      screen.getByText(
        "There is no public link to this forecast. Search the Citizen and Immigration Services website for their title or this number.",
      ),
    ).toBeTruthy();
  });

  it("links nothing when the site fails the vendor rule", () => {
    render(
      <ForecastSource
        f={uscis({ publisherSite: { ...DHS, url: "https://www.highergov.com/agency/468/" } })}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/highergov/i);
  });

  it("never links a local forecast's publisher", () => {
    render(<ForecastSource f={{ ...LOCAL, record: { ...LOCAL.record, publisherSite: DHS } }} />);
    expect(document.querySelector(".fc-origin__site")).toBeNull();
  });
});
