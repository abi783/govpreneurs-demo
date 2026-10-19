// @vitest-environment jsdom
// The agency's Hunter: the same engines as hunter.test.ts, checked against Lantern
// Row Creative's story. Runs with DEMO_MEMBER=agency.

import { beforeEach, describe, expect, it } from "vitest";
import { MEMBER } from "../member";
import { FOR_YOU, HERO_IDS, OPPORTUNITIES } from "../story/opportunities";
import { KEY_PARTNER } from "../story/persona";
import { clearDemoState } from "../runtime/store";
import { allRows, forYouRows, rowById, savedRows } from "./data";
import { toDiscoverDto } from "./dto";
import { facetCounts } from "./facets";
import { applyFilters, pageOf, sortRows } from "./query";
import { generatedLine } from "./facts";
import { takesFor } from "./takes";
import { searchNaics, searchPsc } from "./naicsData";
import { publishFeedContext } from "./feedContext";
import { handleHunterMessage } from "./chat/engine";
import { CANON } from "./chat/intents";
import type { ServerFilters } from "../../lib/discoverApi";
import type { HunterFilterDelta, HunterTurnResponse } from "../../lib/hunterChat";

/** The words the member scan (demo-storyboard/tools/scan-member.mjs) bans on the agency's pages. */
const CATERING =
  /\b(cater\w*|meals?|kitchen|food[- ]?(service|handler)?|cooks?|dining|menus?|ServSafe|Haddad|Amira|722310|Camp Mackall|Womack|Carolina Dining)\b/i;
const BANNED_WORDS = /\b(win|wins|winning|guarantee\w*|no-bid|lean bid)\b/i;

const hero = () => rowById(HERO_IDS.hero)!;
const twin = () => rowById(HERO_IDS.twin)!;
const teamUp = () => rowById(HERO_IDS.teamUp)!;

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

/** Everything the member sees from one answer. */
const shown = (r: HunterTurnResponse) =>
  `${r.chatReply} ${JSON.stringify(r.uiPayload)} ${JSON.stringify(r.suggestions ?? [])}`;

/** The starter buttons the rail draws for the agency (HunterChatOverlay.buildStarterChips), and the openers. */
const STARTERS = [
  "Why does the Family Advocacy ad campaign at Fort Bragg match me?",
  "Am I ready to bid the Family Advocacy ad campaign at Fort Bragg?",
  "Compare my top 3 — which should I chase?",
  "Find Advertising Agencies work in NC",
  "Am I a good fit for the Family Advocacy ad campaign at Fort Bragg?",
  "Which of these best fits me?",
  "Compare my saved opps — which should I pursue?",
  "What's out there for me right now?",
  "What's new since last week?",
  "Which of these am I actually ready for?",
  "Why does the top match fit?",
  "What's a WOSB set-aside?",
  "Only woman-owned set-asides",
  "Only federal",
  "Under $100K",
  "Work in Virginia",
  "What is a sources sought?",
];

describe.runIf(MEMBER === "agency")("Hunter for the agency", () => {
  describe("feed, filters and search", () => {
    it("maps every set-aside to the drawer's ids, the veteran-owned one included", () => {
      const cases: [ServerFilters, (r: ReturnType<typeof allRows>[number]) => boolean][] = [
        [{ setAsides: ["WOSB"] }, (r) => r.setAside === "WOSB"],
        [{ setAsides: ["SB"] }, (r) => r.setAside === "SBA"],
        [{ setAsides: ["VOSB"] }, (r) => r.setAside === "SDVOSBC"],
        [{ setAsides: ["FULL_OPEN"] }, (r) => !r.setAside],
        [{ naicsCodes: ["512110"] }, (r) => r.o.naics === "512110"],
        [{ location: { states: ["VA"] } }, (r) => r.state === "VA"],
        [{ noticeTypes: ["sources_sought"] }, (r) => r.o.noticeType === "Sources Sought"],
        [{ search: "family advocacy" }, (r) => /family advocacy/i.test(r.haystack)],
      ];
      for (const [filters, expected] of cases) {
        const got = applyFilters(allRows(), filters).map((r) => r.id);
        expect(got, JSON.stringify(filters)).toEqual(
          allRows()
            .filter(expected)
            .map((r) => r.id),
        );
        expect(got.length, JSON.stringify(filters)).toBeGreaterThan(0);
      }
      expect(teamUp().setAsideIds).toEqual(["VOSB"]);
      expect(facetCounts({}, "for_you").setAsides.VOSB).toBe(1);
      expect(facetCounts({}, "for_you").setAsides.FULL_OPEN).toBe(
        forYouRows().filter((r) => !r.setAside).length,
      );
      expect(toDiscoverDto(teamUp()).matchBreakdown.eligible).toBe(false);
    });

    it("searches titles, agency, place and codes", () => {
      const find = (q: string) => applyFilters(allRows(), { search: q }).map((r) => r.id);
      expect(find("Family Advocacy")).toEqual(
        expect.arrayContaining([HERO_IDS.hero, HERO_IDS.twin]),
      );
      expect(find("video").length).toBeGreaterThan(3);
      expect(find("Veterans Affairs")).toContain(HERO_IDS.teamUp);
      expect(find("512110")).toContain("FA4809-27-Q-0016");
      expect(find("Norfolk")).toEqual(["N00189-27-Q-0040"]);
      expect(find("campaign")).toEqual(find("campaigns"));
      expect(find("zzzz")).toEqual([]);
    });

    it("sorts and pages", () => {
      const rows = allRows();
      const deadlines = sortRows(rows, { field: "deadline", order: "asc" }, "all").map(
        (r) => r.o.closesInDays,
      );
      expect(deadlines).toEqual([...deadlines].sort((a, b) => a - b));
      const mids = sortRows(rows, { field: "value", order: "desc" }, "all").map(
        (r) => (r.low! + r.high!) / 2,
      );
      expect(mids).toEqual([...mids].sort((a, b) => b - a));
      expect(pageOf(rows, 2, 10).data.length).toBe(10);
      expect(pageOf(rows, 3, 10).data.length).toBe(rows.length - 20);
    });

    it("carries an advertising PSC, not a food one", () => {
      for (const row of allRows()) expect(row.psc, row.id).toMatch(/^(R701|R708|T001)$/);
      expect(rowById("MWR-FB-27-0006")!.psc).toBe("T001");
    });
  });

  describe("Hunter's lines", () => {
    it("gives every opportunity a true line with the agency's words, never the caterer's", () => {
      const takes = takesFor(OPPORTUNITIES.map((o) => o.id));
      expect(takes.length).toBe(OPPORTUNITIES.length);
      for (const t of takes) {
        expect(t.line.length, t.oppKey).toBeLessThanOrEqual(260);
        expect(t.line, t.oppKey).not.toMatch(BANNED_WORDS);
        expect(t.line, t.oppKey).not.toMatch(CATERING);
        expect(t.line, t.oppKey).not.toMatch(/undefined|NaN/);
      }
    });

    it("builds a line from the facts where the story has none", () => {
      const raleigh = generatedLine(rowById("RAL-WC-2027-12")!);
      expect(raleigh).toContain("Water-saving campaign for the City of Raleigh");
      expect(raleigh).toContain("your advertising code");
      expect(raleigh).toContain("65 miles from your office");
      const far = generatedLine(rowById("N00189-27-Q-0040")!);
      expect(far).toContain("220 miles");
      expect(far).toContain("outside your 200-mile area");
      expect(generatedLine(rowById("47PD0227Q0019")!)).toContain("your graphic-design code");
      expect(generatedLine(rowById("CFPUA-COM-2027-06")!)).toContain("your public-relations code");
    });

    it("shows the twin's provider lock and the team-up's set-aside on the card", () => {
      expect(toDiscoverDto(twin()).matchReasons).toContain("Names one provider's own app and crew");
      expect(toDiscoverDto(teamUp()).matchReasons).toContain("For veteran-owned firms");
    });
  });

  describe("code lookups", () => {
    it("finds marketing words and codes first", () => {
      expect(searchNaics("advertising")[0].code).toBe("541810");
      expect(searchNaics("video")[0].code).toBe("512110");
      expect(searchNaics("pr")[0].code).toBe("541820");
      expect(searchNaics("design")[0].code).toBe("541430");
      expect(searchNaics("social media").map((r) => r.code)).toContain("541810");
      expect(searchNaics("5418").map((r) => r.code)).toEqual(
        expect.arrayContaining(["541810", "541820"]),
      );
      expect(searchPsc("advertising")[0].code).toBe("R701");
      expect(searchPsc("R70")[0].code).toBe("R701");
    });
  });

  describe("chat", () => {
    it("answers every starter and opener with a specific reply about her business", () => {
      for (const q of STARTERS) {
        const r = ask(q);
        expect(r.chatReply, q).not.toMatch(/not sure what you mean/);
        expect(shown(r), q).not.toMatch(CATERING);
        expect(shown(r), q).not.toMatch(/undefined|NaN|\[object/);
      }
    });

    it("explains why the Family Advocacy campaign matches her", () => {
      const r = ask("Why does the Family Advocacy ad campaign at Fort Bragg match me?");
      expect(r.chatReply).toContain("number 1");
      expect(r.chatReply).toContain("your advertising code, NAICS 541810");
      expect(r.chatReply).toContain("woman-owned");
      expect(r.chatReply).toContain("$215K a year");
      expect(r.chatReply).toContain("12 miles from your office");
      expect(r.chatReply).toMatch(/Grant's call/);
      expect(r.uiPayload.kind).toBe("matches");
    });

    it("checks readiness: the hero fits, the twin names one provider, the team-up is a subcontract", () => {
      const ready = ask("Am I ready to bid the Family Advocacy ad campaign at Fort Bragg?");
      expect((ready.uiPayload.data as { verdict: string }).verdict).toBe("eligible");
      expect(ready.actPayload).toBeUndefined();
      expect(ready.chatReply).toMatch(/^Yes\./);

      const lock = ask("Am I ready to bid the Family Advocacy TV and streaming ads at Fort Bragg?");
      expect((lock.uiPayload.data as { verdict: string }).verdict).toBe("ineligible");
      expect(lock.chatReply).toMatch(/one provider/);
      expect(lock.chatReply).toMatch(/still ranks number 3/);

      const team = ask("Am I ready to bid the Veterans Affairs Sources Sought notice?");
      expect(team.chatReply).toMatch(/^Not as prime\./);
      expect(team.chatReply).toContain("Service-disabled veteran-owned (SDVOSB)");
      expect(team.chatReply).toContain(KEY_PARTNER.name);

      expect(ask("Will I win the Family Advocacy one?").chatReply).toMatch(/nobody can promise/);
    });

    it("compares the top 3 on value, distance and set-aside, and points to Grant", () => {
      const r = ask("Compare my top 3 — which should I chase?");
      expect(r.uiPayload.kind).toBe("compare");
      const data = r.uiPayload.data as {
        opps: { oppKey: string }[];
        rows: { field: string; values: string[] }[];
      };
      expect(data.opps.map((o) => o.oppKey)).toEqual(FOR_YOU.slice(0, 3).map((o) => o.id));
      expect(data.rows.find((x) => x.field === "Miles from your office")!.values).toEqual([
        "12 miles",
        "150 miles",
        "12 miles",
      ]);
      expect(r.chatReply).toMatch(/Grant/);
    });

    it("sorts the list by readiness, with the twin and the team-up named for what they are", () => {
      const r = ask("Which of these am I actually ready for?");
      expect(r.chatReply).toMatch(
        /Not possible today \(1\): Family Advocacy TV and streaming ads at Fort Bragg\. The work names one provider/,
      );
      expect(r.chatReply).toMatch(
        /A stretch on your own \(1\): VA's national health-care hiring campaign \(sources sought\)\./,
      );
    });

    it("changes the feed for each filter, and the count it states is the feed's count", () => {
      const cases: [string, (f: HunterFilterDelta) => void][] = [
        ["Only woman-owned set-asides", (f) => expect(f.setAsides).toEqual(["WOSB"])],
        ["Only federal", (f) => expect(f.scope).toEqual({ fed: true, sled: false })],
        [
          "Show only state and local",
          (f) => {
            expect(f.scope).toEqual({ fed: false, sled: true });
            expect(f.cities).toBeUndefined();
          },
        ],
        ["Under $100K", (f) => expect(f.valueRange).toEqual({ min: null, max: 100_000 })],
        ["What's new since last week?", (f) => expect(f.postedWithin).toBe(7)],
        ["near Fayetteville", (f) => expect(f.cities).toEqual(["Fayetteville", "Fort Bragg"])],
        ["Show me Fort Bragg ads", (f) => expect(f.search).toBe("Fort Bragg advertising")],
        ["Show video jobs", (f) => expect(f.search).toBe("video")],
        ["Show me recruiting campaigns", (f) => expect(f.search).toBe("recruit")],
        [
          "Find Advertising Agencies work in NC",
          (f) => {
            expect(f.naics).toEqual(["541810"]);
            expect(f.states).toEqual(["NC"]);
          },
        ],
        ["Work in Virginia", (f) => expect(f.states).toEqual(["VA"])],
      ];
      for (const [q, check] of cases) {
        const r = ask(q);
        expect(r.uiPayload.kind, q).toBe("discovery");
        const data = r.uiPayload.data as { filters: HunterFilterDelta; tab?: string };
        check(data.filters);
        const f = data.filters;
        const server: ServerFilters = {};
        if (f.setAsides) server.setAsides = f.setAsides;
        if (f.scope) server.scopes = f.scope.fed ? ["fed"] : ["sled"];
        if (f.valueRange) server.valueRange = f.valueRange;
        if (f.cities || f.states) server.location = { cities: f.cities, states: f.states };
        if (f.postedWithin) server.postedWithin = f.postedWithin;
        if (f.naics) server.naicsCodes = f.naics;
        if (f.search) server.search = f.search;
        const rows = applyFilters(data.tab === "all" ? allRows() : forYouRows(), server);
        const stated = r.chatReply.match(
          /(\d+) (matches|opportunities) fit|One (match|opportunity) fits/,
        );
        expect(stated, `${q}: ${r.chatReply}`).toBeTruthy();
        expect(stated![1] ? Number(stated![1]) : 1, q).toBe(rows.length);
        expect(shown(r), q).not.toMatch(CATERING);
      }
      const va = ask("Work in Virginia");
      expect((va.uiPayload.data as { tab?: string }).tab).toBe("all");
      expect(va.chatReply).toMatch(/Norfolk, 220 miles from your office/);
    });

    it("defines the terms with her own story", () => {
      const terms: [string, RegExp][] = [
        [
          "What is a sources sought?",
          /the VA asks which firms could run its national health-care hiring campaign/,
        ],
        ["what is a NAICS code", /541810, Advertising Agencies/],
        ["what is a PSC", /R701/],
        ["what is an RFQ", /Family Advocacy ad campaign at Fort Bragg is one/],
        ["what is a bond", /never needed one/],
        ["what is a prime and a sub", new RegExp(KEY_PARTNER.name)],
        ["what is a recompete", /September 2027/],
        ["what is a clearance", /None of the work on your list needs one/],
        ["what is a set-aside", /1 veteran-owned/],
      ];
      for (const [q, rx] of terms) expect(ask(q).chatReply, q).toMatch(rx);
    });

    it("knows her business, her mentor and her bids", () => {
      const p = ask("what do you know about my business");
      expect(p.uiPayload.kind).toBe("profile");
      expect(p.chatReply).toMatch(
        /9 employees, a studio and edit suite, and a 2-person video crew/,
      );
      const rows = (p.uiPayload.data as { rows: { label: string; value: string }[] }).rows;
      expect(rows.map((r) => r.label)).toContain("Team and studio");
      expect(rows.map((r) => r.label)).not.toContain("Largest bond");
      expect(ask("can you write my proposal").chatReply).toMatch(
        /Family Advocacy ad campaign at Fort Bragg quote\. Ava has 3 questions/,
      );
      expect(ask("how do I get certified").chatReply).toMatch(/WOSB/);
      expect(ask("who is the incumbent for the VA one").chatReply).toMatch(/Grant/);
      expect(ask("We also make Spanish-language videos").uiPayload.kind).toBe("profile_update");
    });

    it("never says a catering word, a verdict word or undefined, and leads nowhere dead, to a depth of 3", () => {
      const seen = new Set<string>();
      const queue: [string, number][] = [...STARTERS, ...CANON].map((q) => [q, 0]);
      while (queue.length > 0) {
        const [q, depth] = queue.shift()!;
        if (seen.has(q)) continue;
        seen.add(q);
        const r = ask(q);
        expect(r.chatReply, q).not.toMatch(/not sure what you mean/);
        expect(shown(r), q).not.toMatch(CATERING);
        expect(shown(r), q).not.toMatch(BANNED_WORDS);
        expect(shown(r), q).not.toMatch(/undefined|NaN|\[object/);
        if (depth < 3) for (const c of r.suggestions ?? []) queue.push([c, depth + 1]);
      }
      expect(seen.size).toBeGreaterThan(30);
    });

    it("answers the openers on every tab", () => {
      for (const tab of ["for_you", "all", "saved"] as const) {
        for (const q of [
          "What's out there for me right now?",
          "What's new since last week?",
          "Which of these am I actually ready for?",
        ]) {
          const visible = tab === "saved" ? savedRows().map((r) => r.id) : undefined;
          const r = ask(q, tab, visible);
          expect(r.chatReply, `${tab} ${q}`).not.toMatch(/not sure what you mean/);
          expect(shown(r), `${tab} ${q}`).not.toMatch(CATERING);
        }
      }
    });

    it("talks about her codes on the Forecasts page", () => {
      const visibleOpps = [
        {
          oppKey: "fc-1",
          title: "Recruitment marketing campaign follow-on",
          location: "Multiple sites",
        },
        { oppKey: "fc-2", title: "Family program outreach", location: "Fort Bragg, NC" },
      ];
      const r = handleHunterMessage({
        message: "Why does the Family program outreach match me?",
        tab: "for_you",
        surface: "forecasts",
        visibleOpps,
      });
      expect(r.chatReply).toMatch(
        /advertising and marketing work \(NAICS 541810 and your other four\)/,
      );
      expect(shown(r)).not.toMatch(CATERING);
    });
  });
});
