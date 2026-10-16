// Characterisation of the three DTO fields the PR-39 facts grid reads —
// setAside, noticeType and naicsCode — plus the two card fields the mapper must
// never invent. These tests pin current behaviour. They do not ask the mapper to
// change. Features 3, 5 and 8 build on what they record.
import { mapToCardOpportunity, DiscoverV2OpportunityDto } from "./discoverMapper";

/** Card fields the Discover mapper never writes, because the feed carries no source for them. */
const NEVER_MAPPED_FIELDS = ["subAgency", "valueIsEstimate"] as const;

/** DTO fields the live feed can send as an empty string, or omit. */
type OptionalDtoField = "setAside" | "naicsCode";

const DEADLINE_ISO = "2026-12-01T12:00:00.000Z";
const POSTED_ISO = "2026-09-01T12:00:00.000Z";

/** Builds a minimal valid Discover DTO, with the given fields overridden. */
function makeDto(overrides: Partial<DiscoverV2OpportunityDto> = {}): DiscoverV2OpportunityDto {
  return {
    id: "opp-1",
    title: "Test Opportunity",
    scope: "fed",
    geminiPlainEnglishTitle: null,
    agency: { name: "USACE" },
    noticeType: "Solicitation",
    responseDeadline: DEADLINE_ISO,
    postedDate: POSTED_ISO,
    setAside: "SDVOSBC",
    naicsCode: "722310",
    valEstLow: null,
    valEstHigh: null,
    placeOfPerformance: { city: "Raleigh", state: "NC" },
    status: "active",
    quickSummary: null,
    relevanceScore: 80,
    tier: "priority",
    matchReasons: [],
    matchBreakdown: { eligible: true },
    scoreBreakdown: { businessCategoryMatch: 30, certificationMatch: 25, locationMatch: 20 },
    ...overrides,
  };
}

/** Builds a DTO with one optional field absent, as the live feed sometimes sends it. */
function dtoWithout(field: OptionalDtoField): DiscoverV2OpportunityDto {
  const dto = makeDto();
  Reflect.deleteProperty(dto, field);
  return dto;
}

// ─── (a) setAside ────────────────────────────────────────────────────────────

describe("mapToCardOpportunity — setAside provenance", () => {
  it("passes the DTO set-aside code through unchanged", () => {
    expect(mapToCardOpportunity(makeDto({ setAside: "WOSB" })).setAside).toBe("WOSB");
  });

  it("passes a raw Full-and-Open value through without normalising it", () => {
    const raw = "Full and Open Competition (No Set-Aside)";
    expect(mapToCardOpportunity(makeDto({ setAside: raw })).setAside).toBe(raw);
  });

  it("returns undefined when the DTO set-aside is an empty string", () => {
    expect(mapToCardOpportunity(makeDto({ setAside: "" })).setAside).toBeUndefined();
  });

  it("returns undefined when the DTO omits the set-aside", () => {
    expect(mapToCardOpportunity(dtoWithout("setAside")).setAside).toBeUndefined();
  });
});

// ─── (b) noticeType ──────────────────────────────────────────────────────────

describe("mapToCardOpportunity — noticeType provenance", () => {
  it("passes the DTO notice type through for a contract", () => {
    expect(mapToCardOpportunity(makeDto({ noticeType: "Solicitation" })).noticeType).toBe(
      "Solicitation",
    );
  });

  it("returns null when the DTO notice type is empty and the category is not a product buy", () => {
    expect(mapToCardOpportunity(makeDto({ noticeType: "", category: "contract" })).noticeType).toBe(
      null,
    );
  });

  it("returns null when the DTO notice type is empty and the category is absent", () => {
    expect(mapToCardOpportunity(makeDto({ noticeType: "" })).noticeType).toBe(null);
  });

  it("returns null when the DTO notice type is empty on a forecast", () => {
    expect(mapToCardOpportunity(makeDto({ noticeType: "", category: "forecast" })).noticeType).toBe(
      null,
    );
  });

  it("forces RFQ for a product buy, over the source notice type (PRD CAT-4)", () => {
    const card = mapToCardOpportunity(
      makeDto({ noticeType: "Solicitation", category: "product_buy" }),
    );
    expect(card.noticeType).toBe("RFQ");
  });

  it("forces RFQ for a product buy whose DTO notice type is empty (PRD CAT-4)", () => {
    expect(
      mapToCardOpportunity(makeDto({ noticeType: "", category: "product_buy" })).noticeType,
    ).toBe("RFQ");
  });
});

// ─── (c) naicsCode ───────────────────────────────────────────────────────────

describe("mapToCardOpportunity — naicsCode provenance", () => {
  it("passes the DTO NAICS code through unchanged", () => {
    expect(mapToCardOpportunity(makeDto({ naicsCode: "311999" })).naicsCode).toBe("311999");
  });

  it("returns undefined when the DTO NAICS code is an empty string", () => {
    expect(mapToCardOpportunity(makeDto({ naicsCode: "" })).naicsCode).toBeUndefined();
  });

  it("returns undefined when the DTO omits the NAICS code", () => {
    expect(mapToCardOpportunity(dtoWithout("naicsCode")).naicsCode).toBeUndefined();
  });

  it("never resolves a NAICS description — that is the hook's work, not the mapper's", () => {
    expect(mapToCardOpportunity(makeDto()).naicsDescription).toBeUndefined();
  });
});

// ─── (d) fields the mapper never sets ────────────────────────────────────────

describe("mapToCardOpportunity — fields the mapper never sets", () => {
  for (const field of NEVER_MAPPED_FIELDS) {
    it(`does not set ${field}`, () => {
      const card = mapToCardOpportunity(makeDto());
      expect(Object.hasOwn(card, field)).toBe(false);
      expect(card[field]).toBeUndefined();
    });
  }
});
