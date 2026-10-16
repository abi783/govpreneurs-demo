import { describe, it, expect } from "vitest";

import { restateChips } from "./restateChips";
import type { DiscoveryPayload } from "../hunterChat";

const discovery = (over: Partial<DiscoveryPayload> = {}): DiscoveryPayload => ({
  filters: {},
  note: null,
  ...over,
});
const feed = (over: Partial<DiscoveryPayload> = {}) => restateChips("discovery", discovery(over));

// THE RULE THIS ROW LIVES BY. "Using …" is a claim about what Hunter DID, so
// every chip must come from the payload the server actually returned. The
// prototype scripts these strings per scenario; deriving them is the whole
// difference between a caption and a decoration.
describe("restateChips — nothing to say", () => {
  it("says nothing without a payload", () => {
    expect(restateChips(undefined, undefined)).toEqual([]);
    expect(restateChips("discovery", null)).toEqual([]);
  });

  it("says nothing for a kind it does not recognise", () => {
    // An unknown kind is a guess waiting to happen. No row instead.
    expect(restateChips("something_new", { anything: true })).toEqual([]);
  });

  it("says nothing for the kinds that need no restating", () => {
    // The feed itself is the evidence for these; a chip would narrate a click
    // the member just made.
    for (const kind of ["switch_tab", "save", "reset", "none"]) {
      expect(restateChips(kind, { tab: "for_you", saved: [], unsaved: [] })).toEqual([]);
    }
  });
});

describe("restateChips — a feed turn", () => {
  it("says nothing when the turn narrowed nothing", () => {
    expect(feed()).toEqual([]);
  });

  it("says nothing for an unbounded value range", () => {
    expect(feed({ filters: { valueRange: { min: null, max: null } } })).toEqual([]);
  });

  it("reports a floor, a ceiling and a band in the shape asked for", () => {
    expect(feed({ filters: { valueRange: { min: 500_000, max: null } } })[0]).toBe("Value ≥ $500K");
    expect(feed({ filters: { valueRange: { min: null, max: 600_000 } } })[0]).toBe("Value ≤ $600K");
    expect(feed({ filters: { valueRange: { min: 250_000, max: 1_000_000 } } })[0]).toBe(
      "$250K–$1M",
    );
  });

  it("names the scope last, reading it off `fresh`", () => {
    expect(feed({ filters: { states: ["TX"] } }).at(-1)).toBe("On your current list");
    expect(feed({ filters: { states: ["TX"] }, fresh: true }).at(-1)).toBe("Starting fresh");
  });

  it("never emits a scope chip on its own", () => {
    // `fresh` is not a narrowing. Without a filter there is nothing to be "on
    // your current list" ABOUT, and the row would assert a filter never applied.
    expect(feed({ fresh: false })).toEqual([]);
    expect(feed({ fresh: true })).toEqual([]);
  });

  it("caps a long list and keeps a short one whole", () => {
    expect(feed({ filters: { states: ["TX", "NC", "VA", "CA"] } })[0]).toBe("TX +3 more");
    expect(feed({ filters: { states: ["TX", "NC"] } })[0]).toBe("TX, NC");
  });

  it("ignores blank values rather than rendering an empty chip", () => {
    expect(feed({ filters: { states: ["", "  "] } })).toEqual([]);
  });

  it("orders what was narrowed before the scope it was narrowed in", () => {
    expect(feed({ filters: { states: ["TX"], valueRange: { min: 500_000, max: null } } })).toEqual([
      "TX",
      "Value ≥ $500K",
      "On your current list",
    ]);
  });
});

// Every tool turn gets a row, not just a feed filter — the prototype restates
// readiness checks, comparisons, checklists and research the same way. The
// shape is always WHAT THE TOOL IS, then WHAT IT RAN ON.
describe("restateChips — a tool turn", () => {
  it("names the readiness check and the notice it ran on", () => {
    expect(restateChips("eligibility", { title: "Dining hall food service" })).toEqual([
      "Readiness check",
      "Dining hall food service",
    ]);
  });

  it("names two compared notices, and counts more than two", () => {
    expect(
      restateChips("compare", { opps: [{ title: "Dining hall" }, { title: "Pope galley" }] }),
    ).toEqual(["Compare", "Dining hall vs Pope galley"]);

    expect(
      restateChips("compare", { opps: [{ title: "A" }, { title: "B" }, { title: "C" }] }),
    ).toEqual(["Compare", "3 opportunities"]);
  });

  it("counts the shortlist, and says nothing for an empty one", () => {
    expect(restateChips("matches", { rows: [{}, {}, {}] })).toEqual(["Best matches", "Top 3"]);
    // "Top 0" is not a shortlist.
    expect(restateChips("matches", { rows: [] })).toEqual([]);
  });

  it("restates the member's own research question", () => {
    expect(
      restateChips("web_research", {
        query: "WOSB verification timeline",
        answer: "",
        citations: [],
      }),
    ).toEqual(["Web research", "WOSB verification timeline"]);
  });

  it("names the checklist and its gap", () => {
    expect(restateChips("act", { gap: { title: "Fort Bragg dining hall" } })).toEqual([
      "Action checklist",
      "Fort Bragg dining hall",
    ]);
  });

  it("falls back to the tool name when the payload carries no subject", () => {
    // The tool DID run, so the row still earns its place — it just cannot say
    // what it ran on, and does not invent one.
    expect(restateChips("eligibility", { title: "" })).toEqual(["Readiness check"]);
    expect(restateChips("compare", { opps: [] })).toEqual(["Compare"]);
    expect(restateChips("act", { gap: { title: null } })).toEqual(["Action checklist"]);
    expect(restateChips("web_research", { query: "" })).toEqual(["Web research"]);
  });

  it("restates a profile answer as her own business profile", () => {
    expect(restateChips("profile", { rows: [] })).toEqual(["Your business profile"]);
    // A count of changes that WAIT for Save. It never says "updated".
    expect(restateChips("profile_update", { cards: [{}, {}], notes: [] })).toEqual([
      "Profile update",
      "2 changes to review",
    ]);
    expect(restateChips("profile_update", { cards: [{}], notes: [] })).toEqual([
      "Profile update",
      "1 change to review",
    ]);
    expect(restateChips("profile_update", { cards: [], notes: [] })).toEqual(["Profile update"]);
  });

  it("shortens a long title rather than spilling the row", () => {
    const long = "Dining Facility Full Food Service — Fort Bragg, North Carolina, Phase II";
    const [, subject] = restateChips("eligibility", { title: long });
    expect(subject.length).toBeLessThanOrEqual(42);
    expect(subject.endsWith("…")).toBe(true);
    // Still recognisably the same notice.
    expect(long.startsWith(subject.slice(0, 20))).toBe(true);
  });

  it("survives a malformed payload rather than throwing into the reply", () => {
    // These are model-shaped. A missing field must cost the row, never the turn.
    expect(() => restateChips("eligibility", {})).not.toThrow();
    expect(() => restateChips("compare", {})).not.toThrow();
    expect(() => restateChips("matches", {})).not.toThrow();
    expect(() => restateChips("act", {})).not.toThrow();
    expect(() => restateChips("discovery", {})).not.toThrow();
  });
});
