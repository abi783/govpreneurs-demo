// @vitest-environment jsdom
// Tests for the demo's Hunter feed and chat. They read the story, so a change to
// the story that breaks a claim here is a change to look at.
// The caterer's facts are named here; hunter.agency.test.ts holds the agency's.

import { beforeEach, describe, expect, it } from "vitest";
import { MEMBER } from "../member";
import { OPPORTUNITIES, FOR_YOU } from "../story/opportunities";
import { PERSONA } from "../story/persona";
import { daysUntil } from "../../lib/format";
import { clearDemoState } from "../runtime/store";
import { allRows, forYouRows, rowById, savedRows } from "./data";
import { toDiscoverDto, toPreviewDto } from "./dto";
import { facetCounts } from "./facets";
import { applyFilters, pageOf, runFeed, sortRows } from "./query";
import { generatedLine, hunterLine } from "./facts";
import { takesFor } from "./takes";
import { allNaicsRows, naicsDescriptions, searchNaics, searchPsc } from "./naicsData";
import { publishFeedContext } from "./feedContext";
import { handleHunterMessage } from "./chat/engine";
import { CANON } from "./chat/intents";
import type { ServerFilters } from "../../lib/discoverApi";
import type { HunterFilterDelta, HunterTurnResponse } from "../../lib/hunterChat";

const CATERER = MEMBER === "caterer";

const BANNED_WORDS = /\b(win|wins|winning|guarantee\w*|no-bid|lean bid)\b/i;
const OLD_PERSONA =
  /\broof(ing|er|s)?\b|\bMarcus\b|Williams Construction|\b238160\b|Amira's Kitchen|\bDEMO-[A-Z]+-\d+|HigherGov/i;

beforeEach(() => {
  clearDemoState("workspace.savedOpps");
  clearDemoState("hunter.chat");
  publishFeedContext({
    tab: "for_you",
    lane: "all",
    filters: {},
    sort: { field: "match", order: "desc" },
  });
});

describe("feed rows", () => {
  it("lists For You in Hunter's rank order", () => {
    const page = runFeed("for_you", forYouRows(), {});
    expect(page.data.map((r) => r.id)).toEqual(FOR_YOU.map((o) => o.id));
    expect(page.total).toBe(FOR_YOU.length);
  });

  it("lists every opportunity on the All tab", () => {
    expect(runFeed("all", allRows(), {}).total).toBe(OPPORTUNITIES.length);
  });

  it("lists the saved opportunities on the Saved tab", () => {
    const saved = OPPORTUNITIES.filter((o) => o.saved)
      .map((o) => o.id)
      .sort();
    expect(
      runFeed("saved", savedRows(), {})
        .data.map((r) => r.id)
        .sort(),
    ).toEqual(saved);
  });

  it("fills every field of every row, with no undefined, NaN or old-persona text", () => {
    for (const row of allRows()) {
      const d = toDiscoverDto(row);
      expect(d.agency.name).toBeTruthy();
      expect(d.placeOfPerformance.city).toBeTruthy();
      expect(d.geminiPlainEnglishTitle).toBe(row.o.plainTitle);
      expect(["priority", "strong", "stretch", "low"]).toContain(d.tier);
      expect(typeof d.matchBreakdown.eligible).toBe("boolean");
      expect(Number.isNaN(new Date(d.responseDeadline).getTime())).toBe(false);
      expect(Number.isNaN(new Date(d.postedDate).getTime())).toBe(false);
      const text = JSON.stringify([d, toPreviewDto(row)]);
      expect(text).not.toMatch(/undefined|NaN/);
      expect(text).not.toMatch(OLD_PERSONA);
    }
  });

  it("shows the story's number of days to close, at any hour", () => {
    for (const row of allRows()) {
      expect(daysUntil(row.closesAt, new Date())).toBe(row.o.closesInDays);
      for (const hour of [0, 6, 12, 18, 23]) {
        const now = new Date(new Date(row.closesAt).getTime() - row.o.closesInDays * 86_400_000);
        now.setHours(hour, 30);
        expect(daysUntil(row.closesAt, now)).toBe(row.o.closesInDays);
      }
    }
  });

  it("counts a notice posted within 7 days as new this week", () => {
    const weekAgo = Date.now() - 7 * 86_400_000;
    for (const row of allRows()) {
      const isNew = new Date(row.postedAt).getTime() >= weekAgo;
      expect(isNew).toBe(row.o.postedDaysAgo <= 7);
    }
  });
});

describe("filters, sort and page", () => {
  const all = () => allRows();

  it.runIf(CATERER)("filters by every facet", () => {
    const cases: [ServerFilters, (r: ReturnType<typeof allRows>[number]) => boolean][] = [
      [{ setAsides: ["WOSB"] }, (r) => r.setAside === "WOSB"],
      [{ setAsides: ["SB"] }, (r) => r.setAside === "SBA"],
      [{ setAsides: ["FULL_OPEN"] }, (r) => !r.setAside],
      [{ scopes: ["fed"] }, (r) => r.o.scope === "fed"],
      [{ scopes: ["sled"] }, (r) => r.o.scope === "sled"],
      [{ naicsCodes: ["722320"] }, (r) => r.o.naics === "722320"],
      [{ location: { states: ["VA"] } }, (r) => r.state === "VA"],
      [{ location: { cities: ["Fayetteville"] } }, (r) => r.city === "Fayetteville"],
      [{ noticeTypes: ["sources_sought"] }, (r) => r.o.noticeType === "Sources Sought"],
      [{ noticeTypes: ["rfq"] }, (r) => r.o.noticeType === "Request for Quote"],
      [{ dueWindow: ["2_weeks"] }, (r) => r.o.closesInDays <= 14],
      [{ dueWindow: ["60_plus"] }, (r) => r.o.closesInDays >= 60],
      [{ postedWithin: 7 }, (r) => r.o.postedDaysAgo <= 7],
      [{ valueRange: { min: null, max: 500_000 } }, (r) => r.low !== null && r.low <= 500_000],
      [
        { valueRange: { min: 1_000_000, max: null } },
        (r) => r.high !== null && r.high >= 1_000_000,
      ],
      [{ agencies: ["Department of the Army"] }, (r) => r.o.agency === "Department of the Army"],
      [{ search: "mackall" }, (r) => /mackall/i.test(r.haystack)],
    ];
    for (const [filters, expected] of cases) {
      const got = applyFilters(all(), filters).map((r) => r.id);
      expect(got, JSON.stringify(filters)).toEqual(
        all()
          .filter(expected)
          .map((r) => r.id),
      );
      expect(got.length, JSON.stringify(filters)).toBeGreaterThan(0);
    }
  });

  it.runIf(CATERER)("searches titles, agency, place and codes", () => {
    const find = (q: string) => applyFilters(all(), { search: q }).map((r) => r.id);
    expect(find("Fort Bragg dining")).toContain("W912EE-26-R-0066");
    expect(find("catering").length).toBeGreaterThan(3);
    expect(find("Veterans Affairs")).toContain("VA247-26-R-0112");
    expect(find("722330")).toContain("W912PM-26-Q-0102");
    expect(find("Virginia Beach")).toEqual(["VBPS-2026-RFP-14"]);
    expect(find("meal")).toEqual(find("meals"));
    expect(find("zzzz")).toEqual([]);
  });

  it.runIf(CATERER)("sorts by deadline, value, newest and match", () => {
    const rows = all();
    const deadlines = sortRows(rows, { field: "deadline", order: "asc" }, "all").map(
      (r) => r.o.closesInDays,
    );
    expect(deadlines).toEqual([...deadlines].sort((a, b) => a - b));
    const latest = sortRows(rows, { field: "deadline", order: "desc" }, "all").map(
      (r) => r.o.closesInDays,
    );
    expect(latest).toEqual([...latest].sort((a, b) => b - a));
    const newest = sortRows(rows, { field: "newest", order: "desc" }, "all").map(
      (r) => r.o.postedDaysAgo,
    );
    expect(newest).toEqual([...newest].sort((a, b) => a - b));
    const value = sortRows(rows, { field: "value", order: "desc" }, "all");
    expect(value[value.length - 1].low).toBeNull();
    const mids = value.filter((r) => r.low !== null).map((r) => (r.low! + r.high!) / 2);
    expect(mids).toEqual([...mids].sort((a, b) => b - a));
    const small = sortRows(rows, { field: "value", order: "asc" }, "all").filter(
      (r) => r.low !== null,
    );
    expect((small[0].low! + small[0].high!) / 2).toBeLessThanOrEqual(
      (small[1].low! + small[1].high!) / 2,
    );
    const byScore = sortRows(rows, { field: "match", order: "desc" }, "all").map(
      (r) => r.o.hunter.score,
    );
    expect(byScore).toEqual([...byScore].sort((a, b) => b - a));
    // "Recently saved" puts the newest bookmark first.
    const saved = sortRows(savedRows(), { field: "saved", order: "desc" }, "saved");
    expect(saved.map((r) => r.id)).toEqual(savedRows().map((r) => r.id));
  });

  it.runIf(CATERER)("pages with totalPages = ceil(total / limit)", () => {
    const page = pageOf(all(), 2, 20);
    expect(page.data.length).toBe(20);
    expect(page.totalPages).toBe(Math.ceil(all().length / 20));
    expect(pageOf(all(), 3, 20).data.length).toBe(all().length - 40);
    expect(pageOf([], 1, 50)).toMatchObject({ total: 0, totalPages: 1, data: [] });
  });

  it("agrees with its own facet counts", () => {
    for (const tab of ["for_you", "all"] as const) {
      const rows = tab === "for_you" ? forYouRows() : allRows();
      const base: ServerFilters = { scopes: ["fed"] };
      const counts = facetCounts(base, tab);
      const total = (f: ServerFilters) => applyFilters(rows, { ...base, ...f }).length;
      for (const [state, n] of Object.entries(counts.states)) {
        if (n > 0) expect(total({ location: { states: [state] } }), `${tab} ${state}`).toBe(n);
      }
      for (const [city, n] of Object.entries(counts.cities)) {
        expect(total({ location: { cities: [city] } }), `${tab} ${city}`).toBe(n);
      }
      for (const [code, n] of Object.entries(counts.naics)) {
        expect(total({ naicsCodes: [code] }), `${tab} ${code}`).toBe(n);
      }
      for (const [id, n] of Object.entries(counts.setAsides)) {
        expect(total({ setAsides: [id] }), `${tab} ${id}`).toBe(n);
      }
      const bounds: Record<string, { min: number | null; max: number | null }> = {
        under_25k: { min: 0, max: 25_000 },
        "25k_100k": { min: 25_000, max: 100_000 },
        "100k_500k": { min: 100_000, max: 500_000 },
        "500k_1m": { min: 500_000, max: 1_000_000 },
        "1m_5m": { min: 1_000_000, max: 5_000_000 },
        "5m_plus": { min: 5_000_000, max: null },
      };
      for (const [id, n] of Object.entries(counts.valueBuckets)) {
        expect(total({ valueRange: bounds[id] }), `${tab} ${id}`).toBe(n);
      }
      for (const [id, n] of Object.entries(counts.dueWindow)) {
        expect(total({ dueWindow: [id] }), `${tab} ${id}`).toBe(n);
      }
    }
  });

  it("leaves out a facet's own filter when it counts that facet", () => {
    // Filter on a state with no rows: the state counts still show NC, so the filter is left out.
    const counts = facetCounts({ location: { states: ["ZZ"] } }, "all");
    expect(counts.states.NC).toBeGreaterThan(0);
  });
});

describe("Hunter's take", () => {
  it("gives every story opportunity a line, with no verdict or win words", () => {
    const takes = takesFor(OPPORTUNITIES.map((o) => o.id));
    expect(takes.length).toBe(OPPORTUNITIES.length);
    for (const t of takes) {
      expect(t.line.length, t.oppKey).toBeGreaterThan(30);
      expect(t.line.length, t.oppKey).toBeLessThanOrEqual(260);
      expect(t.line, t.oppKey).not.toMatch(BANNED_WORDS);
      expect(t.line, t.oppKey).not.toMatch(OLD_PERSONA);
      expect(t.line, t.oppKey).not.toMatch(/undefined|NaN/);
    }
  });

  it("uses the story line where the story has one", () => {
    for (const o of FOR_YOU) expect(hunterLine(rowById(o.id)!)).toBe(o.hunter.line);
  });

  it.runIf(CATERER)("builds a true line from the facts where it has none", () => {
    const row = rowById("W912PM-26-Q-0102")!; // Meal delivery, Fort Bragg, 610K-890K, SBA
    const line = generatedLine(row);
    expect(line).toContain("Meal delivery to Fort Bragg legacy housing");
    expect(line).toContain("small-business set-aside");
    expect(line).toContain("mobile-food code");
    const far = generatedLine(rowById("VBPS-2026-RFP-14")!);
    expect(far).toContain("230 miles");
    expect(far).toContain("outside your 200-mile area");
    expect(generatedLine(rowById("W912EE-27-S-0004")!)).toMatch(/not a bid yet/);
  });

  it("leaves out a key that the story does not hold", () => {
    expect(takesFor(["nope-1"])).toEqual([]);
  });
});

describe("NAICS and PSC lookups", () => {
  it("describes every code in the story and the profile", () => {
    const codes = [
      ...new Set([
        ...OPPORTUNITIES.map((o) => o.naics),
        PERSONA.primaryNaics,
        ...PERSONA.secondaryNaics.map((n) => n.code),
      ]),
    ];
    const got = naicsDescriptions(codes).map((r) => r.code);
    expect(got.sort()).toEqual([...codes].sort());
  });

  it.runIf(CATERER)("finds food-service words and codes first", () => {
    expect(searchNaics("catering")[0].code).toBe("722320");
    expect(searchNaics("food")[0].code).toBe("722310");
    expect(searchNaics("mobile food")[0].code).toBe("722330");
    expect(searchNaics("7223").map((r) => r.code)).toEqual(
      expect.arrayContaining(["722310", "722320", "722330"]),
    );
    expect(searchNaics("cafeteria").map((r) => r.code)).toContain("722514");
    expect(searchNaics("janitor").map((r) => r.code)).toContain("561720");
    expect(searchNaics("zzzz")).toEqual([]);
    expect(searchPsc("food")[0].code).toBe("S203");
    expect(searchPsc("S20").length).toBeGreaterThan(2);
  });

  it("holds no text about roof work", () => {
    expect(JSON.stringify(allNaicsRows())).not.toMatch(OLD_PERSONA);
  });
});

// ── Chat ────────────────────────────────────────────────────────────────────

function ask(
  message: string,
  tab: "for_you" | "all" | "saved" = "for_you",
  visible?: string[],
): HunterTurnResponse {
  const rows =
    visible ?? (tab === "for_you" ? FOR_YOU.map((o) => o.id) : OPPORTUNITIES.map((o) => o.id));
  return handleHunterMessage({
    message,
    tab,
    surface: "feed",
    visibleOpps: rows.map((id) => ({ oppKey: id, title: rowById(id)!.o.plainTitle })),
  });
}

const STARTERS = [
  "Why does the Field meals for Camp Mackall training rotations match me?",
  "Am I ready to bid the Field meals for Camp Mackall training rotations?",
  "Compare my top 3 — which should I chase?",
  "What's out there for me right now?",
  "What's new since last week?",
  "Which of these am I actually ready for?",
  "Why does the top match fit?",
  "What's an SDVOSB set-aside?",
  "Show me Food Service Contractors work in NC",
  "Do I qualify for these set-asides?",
  "Compare my saved opps — which should I pursue?",
  "Find Food Service Contractors work in NC",
  "Am I a good fit for the Drill-weekend meals for the NC National Guard in Hope Mills?",
  "Which of these best fits me?",
  "Am I eligible for the Meals for three Cumberland County elementary schools?",
  "What's a WOSB set-aside?",
  "Why does the Fort Bragg Sources Sought notice match me?",
];

describe.runIf(CATERER)("Hunter chat on the Forecasts page", () => {
  const visibleOpps = [
    {
      oppKey: "fc-1",
      title: "Dining facility food service at Fort Liberty",
      location: "Fort Liberty, NC",
    },
    { oppKey: "fc-2", title: "Hospital patient meal service", location: "Durham, NC" },
    { oppKey: "fc-3", title: "School nutrition program", location: "Raleigh, NC" },
  ];
  const forecast = (message: string) =>
    handleHunterMessage({ message, tab: "for_you", surface: "forecasts", visibleOpps });

  it("answers the starter buttons and follows its own follow-up buttons without a dead end", () => {
    const seen = new Set<string>();
    const queue = [
      "Why does the Dining facility food service at Fort Liberty match me?",
      "Am I ready to bid the Dining facility food service at Fort Liberty?",
      "Compare my top 3 — which should I chase?",
      "Which of these best fits me?",
      "Find Food Service Contractors work in NC",
      "Compare my saved opps — which should I pursue?",
      "Am I eligible for the Hospital patient meal service?",
    ];
    while (queue.length > 0) {
      const q = queue.shift()!;
      if (seen.has(q)) continue;
      seen.add(q);
      const r = forecast(q);
      expect(r.chatReply, q).not.toMatch(/not sure what you mean/);
      expect(r.chatReply, q).not.toMatch(BANNED_WORDS);
      expect(`${r.chatReply}${JSON.stringify(r.uiPayload)}`, q).not.toMatch(/undefined|NaN/);
      queue.push(...(r.suggestions ?? []));
    }
    expect(seen.size).toBeGreaterThan(8);
  });

  it("says what a forecast is, and never lists story opportunities there", () => {
    expect(forecast("what is a forecast").chatReply).toMatch(/plans to buy/);
    const best = forecast("What should I look at first?");
    expect(best.chatReply).toContain("Dining facility food service at Fort Liberty");
    expect(JSON.stringify(best)).not.toContain("Camp Mackall");
  });
});

describe.runIf(CATERER)("Hunter chat", () => {
  it("answers every starter and opener with a specific reply, never the fallback", () => {
    for (const q of STARTERS) {
      const r = ask(q);
      expect(r.chatReply, q).not.toMatch(/not sure what you mean/);
      expect(r.chatReply.length, q).toBeGreaterThan(40);
    }
  });

  it("explains why the top match fits, with the story's own facts", () => {
    const r = ask("Why does the Field meals for Camp Mackall training rotations match me?");
    expect(r.chatReply).toContain("722310");
    expect(r.chatReply).toContain("woman-owned");
    expect(r.chatReply).toContain("$660K");
    expect(r.chatReply).toContain("45 miles");
    expect(r.chatReply).toMatch(/Grant/);
    expect(r.uiPayload.kind).toBe("matches");
  });

  it("compares ranks 1 to 3 on value, distance and set-aside, and points to Grant", () => {
    const r = ask("Compare my top 3 — which should I chase?");
    expect(r.uiPayload.kind).toBe("compare");
    const data = r.uiPayload.data as {
      opps: { oppKey: string }[];
      rows: { field: string; values: string[] }[];
    };
    expect(data.opps.map((o) => o.oppKey)).toEqual(FOR_YOU.slice(0, 3).map((o) => o.id));
    const fields = data.rows.map((x) => x.field);
    expect(fields).toEqual(
      expect.arrayContaining(["Value", "Miles from your kitchen", "Who can compete"]),
    );
    expect(data.rows.find((x) => x.field === "Miles from your kitchen")!.values).toEqual([
      "45 miles",
      "3 miles",
      "3 miles",
    ]);
    expect(r.chatReply).toMatch(/Grant/);
    expect(r.chatReply).not.toMatch(/go for/i);
  });

  it("checks readiness with a card, and refuses to promise a win", () => {
    const hero3 = ask("Am I ready to bid the Dining support at a restricted Camp Mackall site?");
    expect((hero3.uiPayload.data as { verdict: string }).verdict).toBe("ineligible");
    expect(hero3.chatReply).toMatch(/clearance/i);
    const hero2 = ask("Am I ready to bid the Run two Fort Bragg dining halls?");
    expect(hero2.chatReply).toContain("Carolina Dining Group");
    const hero1 = ask("Am I ready to bid the Field meals for Camp Mackall training rotations?");
    expect(hero1.actPayload).toBeTruthy();
    const win = ask("Will I win the Camp Mackall one?");
    expect(win.chatReply).toMatch(/nobody can promise|cannot tell you/i);
  });

  it("changes the feed for each filter intent, and the count it states is the feed's count", () => {
    const cases: [string, (f: Record<string, unknown>) => void][] = [
      ["Show only woman-owned set-asides", (f) => expect(f.setAsides).toEqual(["WOSB"])],
      ["only federal", (f) => expect(f.scope).toEqual({ fed: true, sled: false })],
      ["only state and local", (f) => expect(f.scope).toEqual({ fed: false, sled: true })],
      ["under $500K", (f) => expect(f.valueRange).toEqual({ min: null, max: 500_000 })],
      ["over $1 million", (f) => expect(f.valueRange).toEqual({ min: 1_000_000, max: null })],
      [
        "between 200k and 600k",
        (f) => expect(f.valueRange).toEqual({ min: 200_000, max: 600_000 }),
      ],
      ["near Fayetteville", (f) => expect(f.cities).toContain("Fort Bragg")],
      ["what's new this week", (f) => expect(f.postedWithin).toBe(7)],
      ["show sources sought", (f) => expect(f.noticeTypes).toEqual(["sources_sought"])],
      ["closing in 30 days", (f) => expect(f.dueWindow).toEqual(["30_days"])],
      ["Fort Bragg dining halls", (f) => expect(f.search).toBe("Fort Bragg dining")],
      ["show me school meals", (f) => expect(f.search).toBe("school")],
      ["jobs in Raleigh", (f) => expect(f.cities).toEqual(["Raleigh"])],
      ["catering jobs", (f) => expect(f.search).toBe("catering")],
    ];
    for (const [q, check] of cases) {
      const r = ask(q);
      expect(r.uiPayload.kind, q).toBe("discovery");
      const data = r.uiPayload.data as { filters: Record<string, unknown>; tab?: string };
      check(data.filters);
      // The count in the words is the count the feed returns for the same filters.
      const tab = data.tab === "all" ? "all" : "for_you";
      const server: ServerFilters = {};
      const f = data.filters as HunterFilterDelta;
      if (f.setAsides) server.setAsides = f.setAsides;
      if (f.scope)
        server.scopes =
          f.scope.fed && !f.scope.sled
            ? ["fed"]
            : f.scope.sled && !f.scope.fed
              ? ["sled"]
              : undefined;
      if (f.valueRange) server.valueRange = f.valueRange;
      if (f.cities || f.states) server.location = { cities: f.cities, states: f.states };
      if (f.postedWithin) server.postedWithin = f.postedWithin;
      if (f.noticeTypes) server.noticeTypes = f.noticeTypes;
      if (f.dueWindow) server.dueWindow = f.dueWindow;
      if (f.search) server.search = f.search;
      const rows = applyFilters(tab === "all" ? allRows() : forYouRows(), server);
      expect(rows.length, q).toBeGreaterThan(0);
      const stated = r.chatReply.match(
        /(\d+) (matches|opportunities) fit|One (match|opportunity) fits/,
      );
      expect(stated, `${q}: ${r.chatReply}`).toBeTruthy();
      expect(stated![1] ? Number(stated![1]) : 1, q).toBe(rows.length);
    }
  });

  it("opens All opportunities when nothing on For You fits", () => {
    const r = ask("work in VA");
    expect((r.uiPayload.data as { tab?: string }).tab).toBe("all");
    expect(r.chatReply).toMatch(/Virginia Beach/);
  });

  it("starts fresh when her filters and the new change leave nothing", () => {
    publishFeedContext({
      tab: "for_you",
      lane: "all",
      filters: { setAsides: ["WOSB"], valueRange: { min: null, max: 500_000 } },
      sort: { field: "match", order: "desc" },
    });
    const r = ask("work in VA");
    expect((r.uiPayload.data as { fresh?: boolean }).fresh).toBe(true);
    expect(r.chatReply).toMatch(/started fresh/);
  });

  it("explains a set-aside she does not hold, and changes nothing", () => {
    const r = ask("show only SDVOSB set-asides");
    expect(r.uiPayload.kind).toBe("none");
    expect(r.chatReply).toMatch(/not open to you/);
  });

  it("moves between tabs, resets and saves", () => {
    expect(ask("show my saved ones").uiPayload).toMatchObject({
      kind: "switch_tab",
      data: { tab: "saved" },
    });
    expect(ask("show all opportunities").uiPayload).toMatchObject({
      kind: "switch_tab",
      data: { tab: "all" },
    });
    expect(ask("back to my matches").uiPayload).toMatchObject({
      kind: "switch_tab",
      data: { tab: "for_you" },
    });
    expect(ask("start over").uiPayload.kind).toBe("reset");
    const before = savedRows().map((r) => r.id);
    const target = FOR_YOU.find((o) => !before.includes(o.id))!;
    const saved = ask(`Save the ${target.plainTitle}`);
    expect(saved.uiPayload).toMatchObject({ kind: "save", data: { saved: [target.id] } });
    expect(savedRows().map((r) => r.id)).toContain(target.id);
    const gone = ask(`Remove the ${target.plainTitle} from my saved`);
    expect(gone.uiPayload).toMatchObject({ kind: "save", data: { unsaved: [target.id] } });
    expect(savedRows().map((r) => r.id)).not.toContain(target.id);
  });

  it("defines the terms a member asks about", () => {
    const terms: [string, RegExp][] = [
      ["what is a sources sought", /early notice/],
      ["what is a WOSB set-aside", /woman-owned small businesses/],
      ["what's an SDVOSB set-aside", /not an SDVOSB/],
      ["what is a NAICS code", /722310/],
      ["what is a set-aside", /keeps for one kind/],
      ["what is an RFQ", /Request for Quote/],
      ["explain an RFP", /Request for Proposal/],
      ["what does stretch mean", /four tiers/],
      ["what is a capability statement", /one-page/],
      ["what is SAM.gov", /active until/],
      ["what is a bond", /bond/],
      ["what is a clearance", /clearance/],
    ];
    for (const [q, rx] of terms) expect(ask(q).chatReply, q).toMatch(rx);
  });

  it("answers about her profile, the method, one opportunity and the help question", () => {
    expect(ask("what do you know about my business").uiPayload.kind).toBe("profile");
    expect(ask("how do you pick").chatReply).toMatch(/four things/);
    expect(ask("when does the Pope Army Airfield catering close").chatReply).toMatch(
      /closes in 11 days/,
    );
    expect(ask("how much is the Run two Fort Bragg dining halls worth").chatReply).toMatch(
      /\$1\.9M/,
    );
    expect(ask("what can you do").chatReply).toMatch(/discovery agent/);
    expect(ask("what closes first").uiPayload.kind).toBe("matches");
    expect(ask("who is Grant").chatReply).toMatch(/go or no-go/);
  });

  it("proposes a profile change and waits for Save", () => {
    const r = ask("I can now cook 1,500 meals a day");
    expect(r.uiPayload.kind).toBe("profile_update");
    const card = (r.uiPayload.data as { cards: { proposalId: string; label: string }[] }).cards[0];
    expect(card.label).toBe("Daily meal capacity");
  });

  it("routes about 40 typed questions to the right kind of answer", () => {
    const table: [string, string, RegExp?][] = [
      ["hi", "none"],
      ["thanks", "none"],
      ["what can you do", "none"],
      ["what's the best one for me", "matches"],
      ["which one should I do first", "matches"],
      ["anything closing soon", "matches"],
      ["biggest jobs", "matches"],
      ["closest to me", "matches"],
      ["do I need a clearance for any of these", "matches", /Camp Mackall/],
      ["how many opportunities are there", "none", /14 matches/],
      ["how many are woman owned", "none", /3 on Opportunities for you/],
      ["show me what changed", "discovery"],
      ["any state jobs", "discovery"],
      ["small business set asides only", "discovery"],
      ["only open competition", "discovery"],
      ["show me the army ones", "discovery"],
      ["VA hospital work", "discovery"],
      ["food truck jobs", "discovery"],
      ["boxed meals near Goldsboro", "discovery"],
      ["in my size range", "discovery"],
      ["between 300k and 800k", "discovery"],
      ["what about Virginia", "discovery"],
      ["is the Pope Army Airfield job a good fit", "eligibility"],
      ["who is the incumbent for Fort Bragg dining", "none", /Carolina Dining Group/],
      ["what are my chances", "none", /nobody can promise/],
      ["who is my competition", "none", /Grant/],
      ["can you write my proposal", "none", /Ava/],
      ["I need help with my capability statement", "none", /My Business/],
      ["how do I get certified", "none", /Roadmap/],
      ["I also offer halal catering", "profile_update"],
      ["We now have 7 employees", "profile_update"],
      ["show me jobs I can actually win", "none", /nobody can promise/],
      ["tell me a joke", "none", /not sure what you mean/],
    ];
    for (const [q, kind, rx] of table) {
      const r = ask(q);
      expect(r.uiPayload.kind, `${q}: ${r.chatReply}`).toBe(kind);
      if (rx) expect(r.chatReply, q).toMatch(rx);
    }
  });

  it("finds a place or topic by a plain search", () => {
    const r = ask("show me hospital jobs");
    expect(r.uiPayload.kind).toBe("discovery");
    expect(r.chatReply).toMatch(/Patient meals at the Fayetteville VA Medical Center/);
  });

  it("offers three close questions for words it does not know", () => {
    const r = ask("blorp flurb zzz");
    expect(r.suggestions?.length).toBe(3);
    const near = ask("what about money for kitchens");
    expect(near.suggestions?.length).toBe(3);
  });

  it("never says a verdict word, a win word, old persona text or undefined", () => {
    const questions = [
      ...STARTERS,
      ...CANON,
      "show only woman-owned set-asides under $500K near Fayetteville",
    ];
    for (const q of questions) {
      const r = ask(q);
      const text = `${r.chatReply} ${JSON.stringify(r.uiPayload)} ${JSON.stringify(r.suggestions ?? [])}`;
      expect(text, q).not.toMatch(BANNED_WORDS);
      expect(text, q).not.toMatch(OLD_PERSONA);
      expect(text, q).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it("leads nowhere dead: every follow-up button gets a real answer, to a depth of 3", () => {
    const seen = new Set<string>();
    const queue: [string, number][] = STARTERS.map((q) => [q, 0]);
    while (queue.length > 0) {
      const [q, depth] = queue.shift()!;
      if (seen.has(q)) continue;
      seen.add(q);
      const r = ask(q);
      expect(r.chatReply, q).not.toMatch(/not sure what you mean/);
      if (depth < 3) for (const c of r.suggestions ?? []) queue.push([c, depth + 1]);
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it("answers the first-meeting openers on every tab", () => {
    for (const tab of ["for_you", "all", "saved"] as const) {
      for (const q of [
        "What's out there for me right now?",
        "What's new since last week?",
        "Which of these am I actually ready for?",
      ]) {
        const visible = tab === "saved" ? savedRows().map((r) => r.id) : undefined;
        const r = ask(q, tab, visible);
        expect(r.chatReply, `${tab} ${q}`).not.toMatch(/not sure what you mean/);
      }
    }
  });
});
