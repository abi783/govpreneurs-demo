// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";

// The hook reads the learned-fact endpoint on mount; stub the client so no
// network is touched and each case chooses what the read returns.
vi.mock("./hunterChat", () => ({ fetchProfileFacts: vi.fn() }));

import { buildKnowsYouFacts, useKnowsYouFacts } from "./knowsYouFacts";
import { fetchProfileFacts, type StoredProfileFact } from "./hunterChat";
import type { BusinessProfile } from "./businessProfile";

const fetchMock = vi.mocked(fetchProfileFacts);

const PROFILE: BusinessProfile = {
  ghlLocationId: "loc-1",
  primaryNaics: "238160",
  naicsLabels: { "238160": "Roofing Contractors" },
  cities: ["houston"],
  stateCodes: ["tx"],
  socioEconomicCerts: ["8A"],
  certifications: [],
  capabilityStatementUrl: null,
  uei: null,
  cage: null,
  ein: null,
  website: null,
};

function fact(over: Partial<StoredProfileFact> = {}): StoredProfileFact {
  return { id: "f1", label: "Crew size", value: "12 field technicians", ...over };
}

beforeEach(() => {
  cleanup();
  fetchMock.mockReset();
});

describe("buildKnowsYouFacts", () => {
  it("labels the profile rows, then appends the learned facts", () => {
    const facts = buildKnowsYouFacts(PROFILE, [fact()]);

    expect(facts.map((f) => [f.label, f.value])).toEqual([
      ["Category", "Roofing Contractors"],
      ["Location", "Houston, TX"],
      ["Set-asides", "8(a)"],
      ["Crew size", "12 field technicians"],
    ]);
  });

  it("omits a profile row the member has nothing on file for", () => {
    const facts = buildKnowsYouFacts(
      { ...PROFILE, cities: [], stateCodes: [], socioEconomicCerts: [] },
      [],
    );

    expect(facts.map((f) => f.label)).toEqual(["Category"]);
  });

  it("joins multiple values into one row rather than repeating the label", () => {
    const facts = buildKnowsYouFacts(
      { ...PROFILE, socioEconomicCerts: ["8A", "HZC"], isSmall: true },
      [],
    );

    expect(facts.find((f) => f.label === "Set-asides")?.value).toBe(
      "8(a), HUBZone, Small Business set-aside",
    );
  });

  it("flags an inferred fact and only an inferred fact", () => {
    const facts = buildKnowsYouFacts(null, [
      fact({ id: "a", confidence_tag: "inferred" }),
      fact({ id: "b", label: "Bonding capacity", value: "$2M", confidence_tag: "attested" }),
      fact({ id: "c", label: "Credentials", value: "OSHA 30", confidence_tag: "document_backed" }),
    ]);

    expect(facts.map((f) => f.inferred)).toEqual([true, false, false]);
  });

  it("drops a learned fact the profile already states", () => {
    const facts = buildKnowsYouFacts(PROFILE, [
      fact({ id: "dup", label: "Trade", value: "roofing contractors" }),
    ]);

    expect(facts.filter((f) => /roofing contractors/i.test(f.value))).toHaveLength(1);
  });

  it("drops a learned fact that repeats one part of a joined profile row", () => {
    const facts = buildKnowsYouFacts({ ...PROFILE, socioEconomicCerts: ["8A", "HZC"] }, [
      fact({ id: "dup", label: "Set-asides", value: "HUBZone" }),
    ]);

    expect(facts.filter((f) => f.value === "HUBZone")).toHaveLength(0);
  });

  it("returns nothing for a brand-new member with no profile and no facts", () => {
    expect(buildKnowsYouFacts(null, [])).toEqual([]);
  });
});

// A stored fact's id IS its vocabulary field, so the row that renders it can name
// the journey question to re-open — with no label map on the client.
describe("buildKnowsYouFacts — which rows can be edited", () => {
  it("marks a learned row the journey asks about", () => {
    const facts = buildKnowsYouFacts(null, [
      fact({ id: "specializations", label: "Specializations", value: "Metal roofs" }),
    ]);

    expect(facts[0].editField).toBe("specializations");
  });

  it("leaves a profile-sourced row un-editable", () => {
    const facts = buildKnowsYouFacts(PROFILE, []);

    expect(facts.every((f) => f.editField === undefined)).toBe(true);
  });

  it("leaves a learned row the journey has no question for un-editable", () => {
    // `crew_size` is in the fact vocabulary but not in the milestone config.
    const facts = buildKnowsYouFacts(null, [fact({ id: "crew_size" })]);

    expect(facts[0].editField).toBeUndefined();
  });

  it("keeps the merged location row editable — half of it is the states fact", () => {
    const facts = buildKnowsYouFacts(PROFILE, [
      fact({ id: "service_states", label: "Service states", value: "TX, NM" }),
    ]);

    expect(facts.find((f) => f.label === "Location")?.editField).toBe("service_states");
  });
});

describe("useKnowsYouFacts", () => {
  it("settles to an empty list when the member has nothing on file", async () => {
    fetchMock.mockResolvedValue([]);

    const { result } = renderHook(() => useKnowsYouFacts());

    expect(result.current.loading).toBe(true); // never an empty shell mid-read
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.facts).toEqual([]);
  });

  it("settles to an empty list when the read fails (the client swallows it)", async () => {
    fetchMock.mockResolvedValue([]); // fetchProfileFacts never throws

    const { result } = renderHook(() => useKnowsYouFacts());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.facts).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("exposes the learned facts once the read resolves", async () => {
    fetchMock.mockResolvedValue([fact({ confidence_tag: "inferred" })]);

    const { result } = renderHook(() => useKnowsYouFacts());

    await waitFor(() => expect(result.current.facts).toHaveLength(1));
    expect(result.current.facts[0]).toMatchObject({
      label: "Crew size",
      value: "12 field technicians",
      inferred: true,
    });
  });
});

describe("service states fold into the location row", () => {
  const states = (value: string, over: Partial<StoredProfileFact> = {}) =>
    fact({ id: "ss", label: "Service states", value, ...over });

  it("appends the states served to the profile's city and state", () => {
    const facts = buildKnowsYouFacts(PROFILE, [states("GA, CA")]);
    const location = facts.filter((f) => f.label === "Location");

    // ONE row, not two — the duplication this merge exists to remove.
    expect(location).toHaveLength(1);
    expect(location[0].value).toBe("Houston, TX, GA, CA");
  });

  it("does not repeat the home state the location already names", () => {
    const facts = buildKnowsYouFacts(PROFILE, [states("TX, GA")]);

    expect(facts.find((f) => f.label === "Location")!.value).toBe("Houston, TX, GA");
  });

  it("stands alone as LOCATION when the profile has no location", () => {
    const noLocation: BusinessProfile = { ...PROFILE, cities: [], stateCodes: [] };
    const facts = buildKnowsYouFacts(noLocation, [states("GA, CA")]);
    const location = facts.filter((f) => f.label === "Location");

    expect(location).toHaveLength(1);
    expect(location[0].value).toBe("GA, CA");
  });

  it("marks the merged row unconfirmed when the states were INFERRED", () => {
    // Under-marking would lend a guess the profile's certainty; over-marking
    // only invites a correction, so either half being inferred marks the row.
    const facts = buildKnowsYouFacts(PROFILE, [states("GA", { confidence_tag: "inferred" })]);

    expect(facts.find((f) => f.label === "Location")).toMatchObject({ inferred: true });
  });

  it("leaves the row confirmed when the states were stated", () => {
    const facts = buildKnowsYouFacts(PROFILE, [states("GA", { confidence_tag: "attested" })]);

    expect(facts.find((f) => f.label === "Location")).toMatchObject({ inferred: false });
  });
});
