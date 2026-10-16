import { describe, it, expect } from "vitest";
import { closedSetFor, selectedFromValue, valueFromSelected } from "./askOptions";

describe("closedSetFor — which fields are closed", () => {
  it("covers the three fixed-value profile fields", () => {
    expect(closedSetFor("service_states")?.kind).toBe("fixed");
    expect(closedSetFor("set_asides")?.kind).toBe("fixed");
    expect(closedSetFor("naics_codes")?.kind).toBe("searched");
  });

  it("leaves genuinely open-ended fields free text", () => {
    for (const field of [
      "capability_summary",
      "core_capabilities",
      "past_performance",
      "credentials",
      "bonding_capacity",
    ]) {
      expect(closedSetFor(field)).toBeNull();
    }
  });
});

describe("state options", () => {
  const set = closedSetFor("service_states");
  const options = set?.kind === "fixed" ? set.options : [];

  it("offers the 50 states + DC, labelled by name and valued by code", () => {
    expect(options).toHaveLength(51);
    const texas = options.find((o) => o.id === "TX");
    expect(texas?.label).toBe("Texas");
    // The stored value is the code — that is what `popState` matching keys off.
    expect(texas?.detail).toBe("TX");
  });

  it("is sorted by name, so a member scans it alphabetically", () => {
    expect(options[0].label).toBe("Alabama");
    expect(options.map((o) => o.label)).toEqual(
      [...options.map((o) => o.label)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has no option that is not a real USPS code", () => {
    for (const o of options) expect(o.id).toMatch(/^[A-Z]{2}$/);
  });
});

describe("set-aside options", () => {
  const set = closedSetFor("set_asides");
  const options = set?.kind === "fixed" ? set.options : [];

  it("reuses the filter drawer's chip ids, so the stored token is one the backend already reads", () => {
    expect(options.map((o) => o.id)).toEqual([
      "VOSB",
      "SB",
      "8A",
      "WOSB",
      "HUBZone",
      "MWDBE",
      "NATIVE_TRIBAL",
    ]);
  });

  it("excludes full-and-open — a filter concept, not a qualification held", () => {
    expect(options.find((o) => o.id === "FULL_OPEN")).toBeUndefined();
  });
});

describe("the submitted value", () => {
  it("is the comma-list the fact write boundary already expects", () => {
    expect(valueFromSelected(["TX", "NC"])).toBe("TX, NC");
  });

  it("round-trips what is already on file, unchanged", () => {
    const onFile = "TX, NC";
    expect(valueFromSelected(selectedFromValue(onFile))).toBe(onFile);
  });

  it("tolerates the spacing variants a typed answer left behind", () => {
    expect(selectedFromValue("TX,NC ,  GA")).toEqual(["TX", "NC", "GA"]);
    expect(selectedFromValue("TX, ")).toEqual(["TX"]);
    expect(selectedFromValue(undefined)).toEqual([]);
  });

  it("dedupes, so picking the same token twice cannot double it", () => {
    expect(valueFromSelected(["TX", "NC", "TX"])).toBe("TX, NC");
  });
});
