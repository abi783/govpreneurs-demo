// The watch's events as lines: each value goes through the page's own reader, and the
// words hold none of the forbidden words.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { ScoredForecast } from "./engine";
import { DEMO_FIRM, SCORED_FORECASTS } from "./__fixtures__/scored";
import type { ForecastWatchEvent, ForecastWatchNotice } from "./watch";
import { NOT_STATED, WATCH_LINE, WATCH_NOTICE } from "./watchCopy";
import { watchLines, type ChangeLine, type NoticeLine } from "./watchLines";

const FORBIDDEN = /deadline|due|closes|higher\s*gov/i;
/** A percentage, a probability or a raw score: none may reach a member. */
const NUMBERED_CLAIM = /%|percent|\bprobab|\blikel|\b0\.\d/i;

const federal = SCORED_FORECASTS.find((x) => x.lane === "federal") as ScoredForecast;
const local = SCORED_FORECASTS.find((x) => x.lane === "sled") as ScoredForecast;
const ctx = { forecast: federal, firm: DEMO_FIRM };

function eventOf(over: Partial<ForecastWatchEvent> = {}): ForecastWatchEvent {
  return {
    id: "ev1",
    kind: "date_moved",
    field: "expectedOn",
    before: "2027-02-15",
    after: "2027-03-18",
    decided: null,
    notice: null,
    observedAt: "2026-09-27T12:19:00.000Z",
    seenAt: null,
    ...over,
  };
}

/** A notice event built from the wire interface. */
function noticeEvent(
  kind: "bid_request_posted" | "republished" | "notice_suggested",
  notice: Partial<ForecastWatchNotice> = {},
): ForecastWatchEvent {
  return eventOf({
    id: `ev-${kind}`,
    kind,
    field: null,
    before: null,
    after: null,
    notice: {
      oppKey: "OPP_9",
      target: "opportunity",
      title: "Roof repair",
      agencyName: "Naval Facilities",
      noticeType: "Solicitation",
      postedOn: "2026-09-25",
      held: true,
      basis: { kind: "named", number: "N3220526R6009" },
      ...notice,
    },
  });
}

const POSTED = noticeEvent("bid_request_posted");
const REPUBLISHED = noticeEvent("republished", {
  oppKey: "FC_2",
  target: "forecast",
  title: "VA roof program",
  agencyName: "Veterans Affairs",
  noticeType: "Forecast",
  postedOn: "2025-12-04",
  basis: { kind: "same_plan", sourceId: "36C10B26AP0015" },
});
const SUGGESTED = noticeEvent("notice_suggested", {
  basis: {
    kind: "suggested",
    office: "same",
    officeName: "Naval Facilities",
    overlap: "strong",
    naicsGroupSame: true,
  },
});

/** The one line `e` words, as a notice line. */
function noticeLine(e: ForecastWatchEvent): NoticeLine {
  const [line] = watchLines([e], ctx);
  expect(line?.kind).toBe("notice");
  return line as NoticeLine;
}

/** Every string a line shows. */
function shown(line: NoticeLine): string[] {
  return [
    line.headline,
    line.names ?? "",
    ...line.sentences,
    line.link?.label ?? "",
    line.unavailable ?? "",
    line.noticed,
  ];
}

function textOf(e: ForecastWatchEvent, c = ctx): string {
  const [line] = watchLines([e], c);
  return (line as ChangeLine).text;
}

describe("watchLines", () => {
  it("has the forecasts these cases need", () => {
    expect(federal).toBeDefined();
    expect(local).toBeDefined();
  });

  it("lists events newest first, each with the day it was observed", () => {
    const older = eventOf({ id: "old", observedAt: "2026-09-20T12:19:00.000Z" });
    const newer = eventOf({ id: "new", observedAt: "2026-09-27T12:19:00.000Z" });
    const lines = watchLines([older, newer], ctx);
    expect(lines.map((l) => l.id)).toEqual(["new", "old"]);
    expect(lines[0].noticed).toBe("Noticed on 27 September 2026");
    expect(lines[1].noticed).toBe("Noticed on 20 September 2026");
  });

  it("marks an event unseen until it carries a seen date", () => {
    const [unseen, seen] = watchLines(
      [
        eventOf({ id: "a", observedAt: "2026-09-27T12:00:00.000Z" }),
        eventOf({ id: "b", observedAt: "2026-09-26T12:00:00.000Z", seenAt: "2026-09-27T13:00Z" }),
      ],
      ctx,
    );
    expect(unseen.unseen).toBe(true);
    expect(seen.unseen).toBe(false);
  });

  it("reads a date through the page's date reader, exact dates in full", () => {
    expect(textOf(eventOf())).toBe(WATCH_LINE.dateMoved("15 February 2027", "18 March 2027"));
  });

  it("reads a federal first-of-quarter date as its quarter, as B11 does", () => {
    const text = textOf(eventOf({ before: "2027-07-01", after: "2027-04-01" }));
    expect(text).toBe(WATCH_LINE.dateMoved("around Q4 FY2027", "around Q3 FY2027"));
  });

  it("reads a placeholder date as the year it stands for, as the page does", () => {
    const text = textOf(eventOf({ before: "2026-10-01", after: "2027-04-01" }));
    expect(text).toBe(WATCH_LINE.dateMoved("some time in FY2027", "around Q3 FY2027"));
  });

  it("words a quarter move so it reads one way only", () => {
    const text = textOf(eventOf({ before: "2027-07-01", after: "2027-04-01" }));
    expect(text).toBe(
      "The expected posting date moved. Before, it was around Q4 FY2027. Now it is around Q3 FY2027.",
    );
    expect(text).not.toMatch(/from .* to .* to /);
  });

  it("reads a local first-of-month date as the month, as the page does", () => {
    const text = textOf(eventOf({ before: "2027-02-01", after: "2027-04-01" }), {
      forecast: local,
      firm: DEMO_FIRM,
    });
    expect(text).toBe(WATCH_LINE.dateMoved("around February 2027", "around April 2027"));
  });

  it("reads a local budget-year date in calendar words, never FY", () => {
    const text = textOf(eventOf({ before: "2026-06-30", after: "2027-01-01" }), {
      forecast: local,
      firm: DEMO_FIRM,
    });
    expect(text).toBe(WATCH_LINE.dateMoved("between July 2025 and June 2026", "some time in 2027"));
    expect(text).not.toMatch(/FY/);
  });

  it("says not stated for a date the record did not give", () => {
    expect(textOf(eventOf({ before: null, after: "2027-03-18" }))).toBe(
      WATCH_LINE.dateMoved(NOT_STATED, "18 March 2027"),
    );
  });

  it("reads each end of the estimate through money", () => {
    expect(
      textOf(eventOf({ kind: "value_changed", field: "valLow", before: 250000, after: 300000 })),
    ).toBe(WATCH_LINE.valueLow("$250K", "$300K"));
    expect(
      textOf(eventOf({ kind: "value_changed", field: "valHigh", before: null, after: 1000000 })),
    ).toBe(WATCH_LINE.valueHigh(NOT_STATED, "$1M"));
  });

  it("reads the $100B placeholder as not stated, never as $100B", () => {
    expect(
      textOf(
        eventOf({ kind: "value_changed", field: "valHigh", before: 100000000000, after: 5000000 }),
      ),
    ).toBe(WATCH_LINE.valueHigh(NOT_STATED, "$5M"));
  });

  it("reads a set-aside through the who-may-bid reader", () => {
    const decided = eventOf({
      kind: "set_aside_changed",
      field: "setAsideCode",
      before: "TBD",
      after: "SBA",
      decided: true,
    });
    expect(textOf(decided)).toBe(WATCH_LINE.setAsideDecided("small businesses only"));

    const changed = eventOf({
      kind: "set_aside_changed",
      field: "setAsideCode",
      before: "SBA",
      after: "SBP",
      decided: false,
    });
    expect(textOf(changed)).toBe(
      WATCH_LINE.setAsideChanged("small businesses only", "partly kept for small businesses"),
    );

    const removed = eventOf({
      kind: "set_aside_changed",
      field: "setAsideCode",
      before: "SBA",
      after: "TBD",
      decided: false,
    });
    expect(textOf(removed)).toBe(WATCH_LINE.setAsideRemoved("small businesses only"));
  });

  describe("a set-aside reading of two sentences", () => {
    const setAside = (before: string | null, after: string | null, decided = false) =>
      eventOf({ kind: "set_aside_changed", field: "setAsideCode", before, after, decided });
    const noCert = { forecast: federal, firm: { ...DEMO_FIRM, certs: [], certsKnown: true } };
    const certsUnknown = {
      forecast: federal,
      firm: { ...DEMO_FIRM, certs: [], certsKnown: false },
    };
    const program8a = "kept for businesses in a federal program for disadvantaged owners";

    /** One sentence: a single full stop, at the end. */
    function expectOneSentence(text: string) {
      expect(text.endsWith(".")).toBe(true);
      expect(text.slice(0, -1)).not.toMatch(/\.\s/);
    }

    it("keeps only the reader's first sentence on the before side", () => {
      const text = textOf(setAside("8A", "SBA"), noCert);
      expect(text).toBe(`Who may bid changed from ${program8a} to small businesses only.`);
      expectOneSentence(text);
    });

    it("keeps only the reader's first sentence on the after side", () => {
      const text = textOf(setAside("SBA", "8A"), noCert);
      expect(text).toBe(`Who may bid changed from small businesses only to ${program8a}.`);
      expectOneSentence(text);
    });

    it("keeps one sentence when both sides read two sentences", () => {
      const text = textOf(setAside("WOSB", "8A"), certsUnknown);
      expect(text).toBe(
        `Who may bid changed from kept for women-owned small businesses to ${program8a}.`,
      );
      expectOneSentence(text);
      expect(text).not.toMatch(/My Business/);
    });

    it("keeps one sentence for an unlisted code, a decided code and a removed code", () => {
      const unlisted = textOf(setAside("XYZ", "SBA"), noCert);
      expect(unlisted).toBe(
        "Who may bid changed from kept for some businesses to small businesses only.",
      );
      const decided = textOf(setAside("TBD", "8A", true), noCert);
      expect(decided).toBe(WATCH_LINE.setAsideDecided(program8a));
      expectOneSentence(decided);
      expect(textOf(setAside("8A", "TBD"), noCert)).toBe(WATCH_LINE.setAsideRemoved(program8a));
    });

    it("names the codes when both sides read the same", () => {
      expect(textOf(setAside("XYZ", "ABC"), noCert)).toBe(
        "The set-aside code changed from XYZ to ABC.",
      );
    });

    it("names the codes on a local forecast, where every code reads Not shared", () => {
      const sled = { forecast: local, firm: DEMO_FIRM };
      expect(textOf(setAside("SBA", "8A"), sled)).toBe(
        "The set-aside code changed from SBA to 8A.",
      );
      expect(textOf(setAside(null, "SBA", true), sled)).toBe(
        WATCH_LINE.setAsideCode(NOT_STATED, "SBA"),
      );
      expect(textOf(setAside("SBA", "TBD"), sled)).toBe(WATCH_LINE.setAsideCode("SBA", "TBD"));
    });

    it("never says a set-aside changed from a value to the same value", () => {
      const pairs: [string | null, string | null, boolean][] = [
        ["XYZ", "ABC", false],
        ["SBA", "8A", false],
        ["8A", "8AN", false],
        [null, "SBA", true],
        ["SBA", null, false],
      ];
      for (const c of [ctx, noCert, certsUnknown, { forecast: local, firm: DEMO_FIRM }]) {
        for (const [before, after, decided] of pairs) {
          const lines = watchLines([setAside(before, after, decided)], c) as ChangeLine[];
          for (const line of lines) {
            const m = /changed from (.+) to (.+)\.$/.exec(line.text);
            if (m) expect(m[1]).not.toBe(m[2]);
          }
        }
      }
    });

    it("reads a padded, lower-case tbd as undecided, as the engine does", () => {
      expect(textOf(setAside("8A", " tbd "), noCert)).toBe(WATCH_LINE.setAsideRemoved(program8a));
    });

    it("keeps no copy of the TBD rule: it uses the engine's helper", () => {
      const source = readFileSync(
        resolve(process.cwd(), "src/lib/forecasts/watchLines.ts"),
        "utf8",
      );
      expect(source).toContain("isUndecidedSetAside");
      expect(source).not.toMatch(/["']TBD["']/);
    });

    it("leaves out a set-aside event whose codes are the same", () => {
      const sled = { forecast: local, firm: DEMO_FIRM };
      expect(watchLines([setAside("sba", "SBA")], sled)).toEqual([]);
    });
  });

  it("names codes and places as the record states them", () => {
    expect(
      textOf(
        eventOf({ kind: "code_changed", field: "naicsCode", before: "238160", after: "238170" }),
      ),
    ).toBe(WATCH_LINE.naics("238160", "238170"));
    expect(
      textOf(eventOf({ kind: "code_changed", field: "pscCode", before: null, after: "Z1AA" })),
    ).toBe(WATCH_LINE.psc(NOT_STATED, "Z1AA"));
    expect(
      textOf(eventOf({ kind: "place_changed", field: "popState", before: "TX", after: "GA" })),
    ).toBe(WATCH_LINE.state("Texas", "Georgia"));
    expect(
      textOf(eventOf({ kind: "place_changed", field: "popCity", before: "TBD", after: "Austin" })),
    ).toBe(WATCH_LINE.city(NOT_STATED, "Austin"));
  });

  it("says the buyer's expected date passed, never that the buyer closed it", () => {
    const text = textOf(
      eventOf({ kind: "expected_date_passed", field: "status", before: "active", after: "closed" }),
    );
    expect(text).toBe(
      "The buyer's expected posting date passed. This forecast no longer shows on the forecasts list. The buyer did not say that it closed.",
    );
    expect(text).not.toMatch(/The buyer closed/i);
    // No forecast surface shows "closed": the list drops it, the page reads the date.
    expect(text).not.toMatch(/shows? (the forecast|it) as closed/i);
  });

  describe("a bid request that posted (an exact link)", () => {
    it("uses the headline for its notice type, and names the title, office and date", () => {
      const line = noticeLine(POSTED);
      expect(line.headline).toBe("The bid request for this forecast has posted.");
      expect(line.names).toBe("“Roof repair” from Naval Facilities, posted on 25 September 2026.");
    });

    it("states the number the forecast names", () => {
      expect(noticeLine(POSTED).sentences).toEqual([
        "This forecast names the number N3220526R6009. The agency posted a notice with that number.",
      ]);
    });

    it("is counted: it carries the New/Seen state and joins Mark as seen", () => {
      const line = noticeLine(POSTED);
      expect(line.counted).toBe(true);
      expect(line.unseen).toBe(true);
      expect(noticeLine({ ...POSTED, seenAt: "2026-09-28T09:00:00.000Z" }).unseen).toBe(false);
    });

    it("links to the opportunity page by our own key when we hold the record", () => {
      const line = noticeLine(POSTED);
      expect(line.link).toEqual({
        target: "opportunity",
        id: "OPP_9",
        label: "Open the bid request",
      });
      expect(line.unavailable).toBeNull();
    });

    it("gives no link, and says no page is available, when we do not hold the record", () => {
      const line = noticeLine(noticeEvent("bid_request_posted", { held: false }));
      expect(line.link).toBeNull();
      expect(line.unavailable).toBe("No page is available for this notice now.");
      expect(line.names).toMatch(/Roof repair/);
    });

    it.each([
      ["Solicitation", WATCH_NOTICE.postedHeadline.bidRequest, WATCH_NOTICE.open.opportunity],
      [
        "Synopsis Solicitation",
        WATCH_NOTICE.postedHeadline.bidRequest,
        WATCH_NOTICE.open.opportunity,
      ],
      ["Presolicitation", WATCH_NOTICE.postedHeadline.earlyNotice, WATCH_NOTICE.open.notice],
      ["Pre-solicitation", WATCH_NOTICE.postedHeadline.earlyNotice, WATCH_NOTICE.open.notice],
      [" sources SOUGHT ", WATCH_NOTICE.postedHeadline.sourcesSought, WATCH_NOTICE.open.notice],
      ["Special Notice", WATCH_NOTICE.postedHeadline.other, WATCH_NOTICE.open.notice],
      ["constructor", WATCH_NOTICE.postedHeadline.other, WATCH_NOTICE.open.notice],
      [null, WATCH_NOTICE.postedHeadline.other, WATCH_NOTICE.open.notice],
    ])("reads the notice type %j as its own headline and link words", (type, headline, open) => {
      const line = noticeLine(noticeEvent("bid_request_posted", { noticeType: type }));
      expect(line.headline).toBe(headline);
      expect(line.link?.label).toBe(open);
    });

    it("words the three early and other headlines as the architecture gives them", () => {
      expect(WATCH_NOTICE.postedHeadline).toEqual({
        bidRequest: "The bid request for this forecast has posted.",
        earlyNotice: "An early notice for this forecast's bid request has posted.",
        sourcesSought: "The agency posted a request to find companies for this work.",
        other: "The agency posted a notice for this forecast.",
      });
    });
  });

  describe("the names sentence", () => {
    const names = (title: string | null, agencyName: string | null, postedOn: string | null) =>
      noticeLine(noticeEvent("bid_request_posted", { title, agencyName, postedOn })).names;

    it("leaves out a part the record does not give, and never invents one", () => {
      expect(names("Roof repair", null, "2026-09-25")).toBe(
        "“Roof repair”, posted on 25 September 2026.",
      );
      expect(names("Roof repair", "Navy", null)).toBe("“Roof repair” from Navy.");
      expect(names("Roof repair", null, null)).toBe("“Roof repair”.");
      expect(names(null, "Navy", "2026-09-25")).toBe(
        "A notice from Navy, posted on 25 September 2026.",
      );
      expect(names(null, "Navy", null)).toBe("A notice from Navy.");
      expect(names(null, null, "2026-09-25")).toBe("A notice, posted on 25 September 2026.");
    });

    it("gives no names sentence when the record gives none of the three", () => {
      expect(names(null, null, null)).toBeNull();
      expect(names("  ", "", "  ")).toBeNull();
    });

    it("leaves out a posted date that is not a calendar day", () => {
      expect(names("Roof repair", "Navy", "soon")).toBe("“Roof repair” from Navy.");
      expect(names("Roof repair", "Navy", "2026-13-45")).toBe("“Roof repair” from Navy.");
    });

    it("never says not stated", () => {
      for (const n of [names(null, "Navy", null), names("A", null, null)])
        expect(n).not.toContain(NOT_STATED);
    });
  });

  describe("a forecast published again (republished)", () => {
    it("says the agency published it again, names it, and states the plan number", () => {
      const line = noticeLine(REPUBLISHED);
      expect(line.headline).toBe("The agency published this forecast again as a new record.");
      expect(line.names).toBe(
        "“VA roof program” from Veterans Affairs, posted on 4 December 2025.",
      );
      expect(line.sentences).toEqual([
        "The new record has the same plan number, 36C10B26AP0015.",
        "This watch stays on this record. To see changes to the new record, track it.",
      ]);
      expect(line.counted).toBe(true);
    });

    it("links to the new forecast's page when we hold it", () => {
      expect(noticeLine(REPUBLISHED).link).toEqual({
        target: "forecast",
        id: "FC_2",
        label: "Open the new forecast",
      });
    });

    it("gives no link when we do not hold the new forecast", () => {
      const line = noticeLine(noticeEvent("republished", { ...REPUBLISHED.notice, held: false }));
      expect(line.link).toBeNull();
      expect(line.unavailable).toBe(WATCH_NOTICE.notHeld);
    });
  });

  describe("a notice that may be this one (a suggestion)", () => {
    it("is worded as a suggestion, with the office relation and the overlap band", () => {
      const line = noticeLine(SUGGESTED);
      expect(line.headline).toBe("A notice that may be this one. Check it.");
      expect(line.sentences).toEqual([
        "It comes from the same office as this forecast.",
        "Many of its words are also in this forecast.",
        "We found it by these two facts only. We do not know that it is this forecast.",
      ]);
    });

    it("names an office under the forecast's office, and the weaker band", () => {
      const within = noticeEvent("notice_suggested", {
        basis: {
          kind: "suggested",
          office: "within",
          officeName: "Department of the Navy",
          overlap: "some",
          naicsGroupSame: null,
        },
      });
      expect(noticeLine(within).sentences.slice(0, 2)).toEqual([
        "It comes from an office under Department of the Navy.",
        "Some of its words are also in this forecast.",
      ]);
    });

    it("says an office under this forecast's office when the tree gives no name", () => {
      const unnamed = noticeEvent("notice_suggested", {
        basis: {
          kind: "suggested",
          office: "within",
          officeName: "  ",
          overlap: "some",
          naicsGroupSame: null,
        },
      });
      expect(noticeLine(unnamed).sentences[0]).toBe(
        "It comes from an office under this forecast's office.",
      );
    });

    it("is not counted: it has no New/Seen tag and adds nothing to the marker", () => {
      expect(noticeLine(SUGGESTED).counted).toBe(false);
    });

    it("is counted by its event kind, as the backend counts it, never by its basis", () => {
      const namedSuggestion = noticeEvent("notice_suggested");
      const suggestedPost = noticeEvent("bid_request_posted", { basis: SUGGESTED.notice?.basis });
      expect(noticeLine(namedSuggestion).counted).toBe(false);
      expect(noticeLine(suggestedPost).counted).toBe(true);
    });

    it("never states a number as a claim: no score, percentage or probability", () => {
      for (const text of shown(noticeLine(SUGGESTED))) expect(text).not.toMatch(NUMBERED_CLAIM);
      expect(JSON.stringify(noticeLine(SUGGESTED))).not.toMatch(/similarity|score/i);
    });

    it("links as a check when we hold the notice, and says no page when we do not", () => {
      expect(noticeLine(SUGGESTED).link).toEqual({
        target: "opportunity",
        id: "OPP_9",
        label: "Check the notice",
      });
      const gone = noticeLine(
        noticeEvent("notice_suggested", { ...SUGGESTED.notice, held: false }),
      );
      expect(gone.link).toBeNull();
      expect(gone.unavailable).toBe(WATCH_NOTICE.notHeld);
    });

    it("never claims the bid request posted", () => {
      for (const text of shown(noticeLine(SUGGESTED)))
        expect(text).not.toMatch(/has posted|bid request/i);
    });
  });

  it("words no line for a notice kind that carries no notice", () => {
    expect(watchLines([{ ...POSTED, notice: null }], ctx)).toEqual([]);
  });

  it("marks every change line counted", () => {
    expect(watchLines([eventOf()], ctx)[0].counted).toBe(true);
  });

  it("holds none of the forbidden words in any line", () => {
    const events: ForecastWatchEvent[] = [
      eventOf({ id: "1" }),
      eventOf({ id: "2", kind: "value_changed", field: "valHigh", before: 1, after: 2 }),
      eventOf({
        id: "3",
        kind: "set_aside_changed",
        field: "setAsideCode",
        before: null,
        after: "8A",
        decided: true,
      }),
      eventOf({ id: "4", kind: "expected_date_passed", field: "status" }),
      eventOf({ id: "5", kind: "no_longer_listed", field: null, before: null, after: null }),
      { ...POSTED, id: "6" },
      { ...REPUBLISHED, id: "7" },
      { ...SUGGESTED, id: "8" },
      noticeEvent("bid_request_posted", { held: false, noticeType: "Presolicitation" }),
      noticeEvent("bid_request_posted", { noticeType: "Sources Sought" }),
    ].map((e, i) => (i >= 8 ? { ...e, id: String(i + 1) } : e));
    const lines = watchLines(events, ctx);
    expect(lines).toHaveLength(events.length);
    for (const line of lines) {
      const words =
        line.kind === "change" ? [line.text, line.noticed] : shown(line).filter((w) => w !== "");
      for (const w of words) expect(w).not.toMatch(FORBIDDEN);
    }
  });
});
