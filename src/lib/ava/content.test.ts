// The words and numbers in Ava's files must agree with the story
// (src/demo/story). Two kinds of check:
//
//   1. The four bids carry the story's title, buyer, number, kind and due date,
//      and each starts where the story says it starts.
//   2. The source files hold no calendar date that would fall into the past, and
//      none of the words the demo must never show (a wrong business, a wrong
//      church, a wrong mentor, an old notice number).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { AVA_BIDS as STORY_BIDS } from "../../demo/story/opportunities";
import { MENTOR, PAST_PERFORMANCE, PERSONA } from "../../demo/story/persona";
import { effectiveBid } from "./derive";
import { AVA_BIDS, getAvaBid } from "./fixtures";
import { flowOf } from "./flow";
import { withGrantFor } from "./grant";
import { getBidState } from "./store";

function look(id: string) {
  const base = getAvaBid(id)!;
  const g = withGrantFor(id, base, getBidState(id));
  const bid = effectiveBid(g.fixture, g.s);
  return { bid, s: g.s, flow: flowOf(bid, g.s, { now: Date.now() }) };
}

describe("the four bids are the story's four bids", () => {
  test("the same ids, and no others", () => {
    expect(Object.keys(AVA_BIDS).sort()).toEqual(STORY_BIDS.map((o) => o.id).sort());
  });

  for (const o of STORY_BIDS) {
    describe(o.id, () => {
      const bid = getAvaBid(o.id)!;
      test("title, buyer and number come from the story", () => {
        expect(bid.officialTitle).toBe(o.title);
        expect(bid.buyer).toBe(o.agency);
        expect(bid.bidNumber).toBe(o.id);
        expect(bid.noticeId).toBe(o.id);
      });
      test("the kind and the due date agree", () => {
        expect(bid.kind).toBe(o.ava!.kind);
        expect(bid.deadline.dueDaysFromNow).toBe(o.closesInDays);
      });
    });
  }
});

describe("each bid starts where the story says", () => {
  test("Camp Mackall field meals: answer my questions, 3 questions", () => {
    const { flow, s } = look("SP4701-26-Q-0021");
    expect(s.started).toBe(true);
    expect(flow.stage).toBe("answer");
    expect(flow.queue).toHaveLength(3);
  });
  test("Fayetteville cafe: phase 2, read, with Sarah's review", () => {
    const { flow, s } = look("FAYNC-2026-R-08");
    expect(flow.stage).toBe("read");
    expect(s.readOpened).toBe(true);
  });
  test("Cumberland detention meals: paused at check you can bid", () => {
    const { flow } = look("CUMCO-2026-014");
    expect(flow.stage).toBe("paused");
  });
  test("Fort Bragg reply: ready to read and send", () => {
    const { flow } = look("W912EE-27-S-0004");
    expect(flow.stage).toBe("ready");
    expect(flow.queue).toHaveLength(0);
  });
});

// ─── The source files ───

const ROOT = join(__dirname, "..", "..");

function sources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...sources(p));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const FILES = [
  ...sources(join(ROOT, "lib", "ava")),
  ...sources(join(ROOT, "components", "Ava")),
  ...sources(join(ROOT, "demo", "ava")),
  join(ROOT, "routes", "ava.index.tsx"),
  join(ROOT, "routes", "ava.$noticeId.tsx"),
];

/** Source text with comments removed: a note in a comment is not on screen. */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|\s)\/\/.*$/, "$1"))
    .join("\n");
}

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

describe("no calendar date is typed into a file", () => {
  // A day and a month, or a month and a day, in 2026 or 2027, or a bare day and
  // month with no year. History (2021 to 2025) is allowed: past jobs and the day
  // the company formed are facts, and they come from the story.
  const dated = [
    new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)? (?:${MONTHS})(?: 202[67])\\b`),
    new RegExp(`\\b(?:${MONTHS}) \\d{1,2}(?:st|nd|rd|th)?,? 202[67]\\b`),
    new RegExp(`\\b\\d{1,2} (?:${MONTHS})\\b(?! 20(?:2[0-5])\\b)(?! \\d{4})`),
    new RegExp(`\\b(?:${MONTHS}) \\d{1,2}\\b(?!,? 20(?:2[0-5])\\b)(?! \\d{4})(?!\\d)`),
    /\b202[67]-\d{2}-\d{2}\b/,
  ];
  for (const file of FILES) {
    const name = file.slice(ROOT.length + 1);
    // dates.ts holds month names as data; when.ts only names them.
    if (/lib\/ava\/dates\.ts$|fixtures\/when\.ts$/.test(name)) continue;
    test(name, () => {
      const hits: string[] = [];
      code(file)
        .split("\n")
        .forEach((line, i) => {
          for (const re of dated) {
            const m = re.exec(line);
            if (m) hits.push(`${i + 1}: ${m[0]}`);
          }
        });
      expect(hits).toEqual([]);
    });
  }
});

describe("none of the words the demo must never show", () => {
  const NEVER: [string, RegExp][] = [
    ["HigherGov", /higher\s?gov/i],
    ["a DEMO- notice number", /\bDEMO-[A-Z]+-\d+/],
    ["the old sample member", /\bMarcus\b|Williams Construction|Amira's Kitchen/],
    ["roofing", /\broof(?:ing|er|s)?\b|\b238160\b/i],
    ["the old mentor", /Diana|Potts/],
    ["a real company as a partner or bidder", /Sodexo|Aramark|Eurest|Compass Group/],
    ["the wrong church", /Hay Street (?:United )?Methodist|Methodist Church/],
    ["the wrong formation date", /3 March 2024|formed (?:on )?[A-Za-z0-9 ]*2024/],
  ];
  for (const [what, re] of NEVER) {
    test(`no ${what}`, () => {
      const hits = FILES.filter((f) => re.test(code(f))).map((f) => f.slice(ROOT.length + 1));
      expect(hits).toEqual([]);
    });
  }
});

describe("the member's facts come from the story", () => {
  const text = (id: string) => JSON.stringify(getAvaBid(id));
  const ids = STORY_BIDS.map((o) => o.id);
  test("the mentor is Sarah Mitchell and nobody else", () => {
    expect(MENTOR.name).toBe("Sarah Mitchell");
  });
  test("her four past jobs are the story's four", () => {
    // Each past job a bid names appears with the story's title or customer.
    const named = new Set(PAST_PERFORMANCE.map((p) => p.customerName.split(",")[0]));
    expect(named.size).toBe(4);
  });
  test("the legal name and the registration numbers agree", () => {
    for (const id of ids) {
      const t = text(id);
      expect(t).toContain(PERSONA.businessName);
      if (t.includes("UEI") || t.includes(PERSONA.uei)) expect(t).toContain(PERSONA.uei);
    }
  });
});
