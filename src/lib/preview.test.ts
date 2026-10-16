import { shouldShowPreview, mapPreviewToCard, type PreviewOpportunityDto } from "./preview";

describe("shouldShowPreview", () => {
  const gate = { hasLiveMatches: false, hasProfileVector: false, profileIndexing: false };

  it("true when there is no live match and no profile vector", () => {
    expect(shouldShowPreview(gate)).toBe(true);
  });
  it("false while profile is indexing (matches-generating wins)", () => {
    expect(shouldShowPreview({ ...gate, profileIndexing: true })).toBe(false);
  });
  it("false when the member has a live match, even without a vector", () => {
    expect(shouldShowPreview({ ...gate, hasLiveMatches: true })).toBe(false);
  });
  it("false for an embedded member with no live match (honest empty feed, not the preview)", () => {
    expect(shouldShowPreview({ ...gate, hasProfileVector: true })).toBe(false);
  });
  it.each([null, undefined])("false when the live-match read is unknown (%s)", (hasLiveMatches) => {
    expect(shouldShowPreview({ ...gate, hasLiveMatches })).toBe(false);
  });
});

const DTO: PreviewOpportunityDto = {
  id: "abc",
  title: "Re-roof",
  scope: "sled",
  agency: { name: "USACE" },
  noticeType: "Solicitation",
  responseDeadline: "2026-08-01T00:00:00.000Z",
  postedDate: "2026-07-01T00:00:00.000Z",
  setAside: "SDVOSB",
  naicsCode: "238160",
  classificationCode: "Z2AA",
  placeOfPerformance: { state: "NC", city: "Fort Bragg", zip: "28307" },
  valEstLow: 100,
  valEstHigh: 200,
  quickSummary: "A roof job",
};

describe("mapPreviewToCard", () => {
  it("maps to a card with no verdict signal (neutral tier, no eligibility)", () => {
    const card = mapPreviewToCard(DTO);
    expect(card.id).toBe("abc");
    expect(card.title).toBe("Re-roof");
    expect(card.agency).toBe("USACE");
    expect(card.scope).toBe("sled");
    expect(card.location).toBe("Fort Bragg, NC");
    expect(card.eligibilityFlag).toBeNull();
    expect(card.hunterReasoning).toBeNull();
    expect(card.matchScore).toBe(0);
  });

  it("writes the value estimate as the ranked feed does", () => {
    const value = (valEstLow: number | null, valEstHigh: number | null) =>
      mapPreviewToCard({ ...DTO, valEstLow, valEstHigh }).value;
    expect(value(5_000_000, 10_000_000)).toBe("$5M–$10M");
    expect(value(100_000_000, null)).toBe("$100M or more");
    expect(value(null, 5_000_000)).toBe("Up to $5M");
    expect(value(100_000_000, 100_000_000_000)).toBe("$100M or more");
    expect(value(0, 0)).toBe("NA");
  });
});

// The card reads a day count of 0 as "Closes today". The Saved feed keeps
// expired opportunities, so an expired or missing deadline must never map to 0.
describe("mapPreviewToCard — daysUntilClose", () => {
  const HOUR_MS = 3_600_000;
  const DAY_MS = 24 * HOUR_MS;
  const closingIn = (msFromNow: number) =>
    mapPreviewToCard({ ...DTO, responseDeadline: new Date(Date.now() + msFromNow).toISOString() })
      .daysUntilClose;

  it("is negative for a deadline that passed days ago", () => {
    expect(closingIn(-10 * DAY_MS)).toBeLessThan(0);
  });

  it("is negative for a deadline that passed hours ago", () => {
    expect(closingIn(-3 * HOUR_MS)).toBe(-1);
  });

  it("counts whole days for a future deadline", () => {
    expect(closingIn(5 * DAY_MS - HOUR_MS)).toBe(5);
  });

  it("is NaN when there is no deadline on file", () => {
    expect(mapPreviewToCard({ ...DTO, responseDeadline: "" }).daysUntilClose).toBeNaN();
  });
});
