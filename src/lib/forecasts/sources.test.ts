// The forecast page's sources. Two promises are held here: the page never names or links
// to HigherGov, and every link it shows is a direct one to the government's own page, as
// HigherGov showed or returned it (Shyam, 17 September 2026).

import { describe, expect, it } from "vitest";
import * as COPY from "./copy";
import * as GRANT_COPY from "./grantCopy";
import { FORECAST_FACTS } from "./__fixtures__/facts";
import {
  HIGHERGOV_FORECASTS,
  PRIOR_AWARDS,
  SOURCE_DOCUMENTS,
  SOURCE_FILES,
} from "./__fixtures__/forecastRecords";
import { SCORED_FORECASTS } from "./__fixtures__/scored";
import { readForecast } from "./grant";

const HIGHERGOV = /higher\s*gov/i;

/** Every string a function-valued copy entry can produce, called with sample arguments. */
function copyText(value: unknown): string {
  if (typeof value === "function") return String(value("1", "2", "3"));
  if (value && typeof value === "object")
    return Object.values(value as Record<string, unknown>)
      .map(copyText)
      .join(" ");
  return typeof value === "string" ? value : "";
}

describe("the page never names HigherGov", () => {
  it("in any copy the forecast pages read", () => {
    expect(copyText(COPY)).not.toMatch(HIGHERGOV);
    expect(copyText(GRANT_COPY)).not.toMatch(HIGHERGOV);
    expect(JSON.stringify(FORECAST_FACTS)).not.toMatch(HIGHERGOV);
    expect(JSON.stringify(SOURCE_DOCUMENTS)).not.toMatch(HIGHERGOV);
  });

  it("in any read Grant gives", () => {
    for (const f of SCORED_FORECASTS) {
      expect(JSON.stringify(readForecast(f))).not.toMatch(HIGHERGOV);
      expect(JSON.stringify(f.steps)).not.toMatch(HIGHERGOV);
    }
  });
});

describe("source links are direct", () => {
  const links = [
    ...HIGHERGOV_FORECASTS.flatMap((r) => (r.sourceLink ? [r.sourceLink.url] : [])),
    ...Object.values(PRIOR_AWARDS).flatMap((a) => (a.noticeUrl ? [a.noticeUrl] : [])),
    ...SCORED_FORECASTS.flatMap((f) => {
      const read = readForecast(f);
      return [
        ...(read.evidence.lastBid?.documents.map((d) => d.href) ?? []),
        ...read.win.flatMap((w) => (w.link ? [w.link.href] : [])),
      ];
    }),
  ];

  it("and none goes to HigherGov", () => {
    expect(links.length).toBeGreaterThan(0);
    for (const url of links) {
      expect(url).toMatch(/^https:\/\//);
      expect(url).not.toMatch(HIGHERGOV);
    }
  });

  it("opens the forecast itself only on federal records, and a meetings page only on local ones", () => {
    for (const r of HIGHERGOV_FORECASTS) {
      if (r.sourceLink?.opens === "forecast") expect(r.lane).toBe("federal");
      if (r.sourceLink?.opens === "meetings") expect(r.lane).toBe("sled");
      if (r.lane === "sled") expect(r.sourceName).toBeNull();
    }
  });

  it("covers the records HigherGov gave a link for, and leaves the rest without one", () => {
    const linked = HIGHERGOV_FORECASTS.filter((r) => r.sourceLink).length;
    expect(linked).toBe(30);
    // A federal record with no link still names who published it, or falls back to the buyer.
    const charlotte = HIGHERGOV_FORECASTS.find((r) => r.id === "fed-boxed-meals-charlotte");
    expect(charlotte?.sourceLink).toBeNull();
    expect(charlotte?.sourceName).toBe("Department of Defense");
  });
});

describe("documents in the record", () => {
  it("are listed only for local records, with a name and a size", () => {
    const ids = new Set(HIGHERGOV_FORECASTS.map((r) => r.id));
    for (const [id, files] of Object.entries(SOURCE_FILES)) {
      expect(ids.has(id)).toBe(true);
      expect(id.startsWith("sled-")).toBe(true);
      for (const file of files) {
        expect(file.fileName.length).toBeGreaterThan(0);
        expect(file.sizeBytes).toBeGreaterThan(0);
      }
    }
    expect(SOURCE_FILES["fed-boxed-meals-charlotte"]).toBeUndefined();
  });
});
