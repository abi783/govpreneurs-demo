// DEMO API area: Awards.
// Owns: /awards*.
//
// The award record is src/demo/explore/awardsData.ts. The visitor's saved awards
// live in the demo store under `explore.awards.saved`.

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { readDemoState, updateDemoState } from "../runtime/store";
import { isoDaysFromNow } from "../story/clock";
import { PERSONA } from "../story/persona";
import { allAwardRecords, findAwardRecord } from "../explore/awardsData";
import {
  DEFAULT_AWARD_FILTERS,
  hasSubcontractingPlan,
  isSoleSource,
  type AwardFacet,
  type AwardFacets,
  type AwardFilterId,
  type AwardInterpretation,
  type AwardListRequest,
  type AwardPanelFilters,
  type AwardRecord,
  type AwardSort,
  type SavedAward,
} from "@/lib/awardsApi";
import { matchAward } from "@/lib/search/match";
import { setAsideChoice } from "@/lib/filters/smallBusinessPrograms";
import { plainNaics, plainPsc } from "@/lib/vocab/plainCodes";
import { US_STATE_NAMES } from "@/lib/vocab/usStates";
import { naicsDescription, pscDescription } from "../hunter/naicsData";
import { byMember, own } from "../member";

const { STORY_SAVED_AWARD_IDS: PACK_SAVED_AWARD_IDS } = own(
  import.meta.glob<typeof import("../members/agency/market/awards")>("/src/demo/members/*/market/awards.ts", { eager: true }),
);

const SAVED_KEY = "explore.awards.saved";
const PAGE_SIZE = 10;

/** The same size band the live product uses for "My size". */
const SIZE_MIN_USD = 500_000;
const SIZE_MAX_USD = 25_000_000;

const MY_STATES = PERSONA.serviceStates as readonly string[];
const MY_TRADE_CODES = new Set<string>([PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)]);

/** Amira has already saved the two awards that tell her story: Fort Bragg dining and her own Womack job. */
function initialSaved(): SavedAward[] {
  // DEMO: each member starts with two awards saved (D85).
  const ids = byMember<readonly string[]>({
    caterer: ["W91247-19-C-0021", "W81K04-24-P-0187"],
    pack: PACK_SAVED_AWARD_IDS,
  });
  return ids.map((awardId, i) => ({ awardId, sourceTag: "from Awards", savedAt: isoDaysFromNow(i === 0 ? -3 : -6, i === 0 ? 14 : 11) }));
}

const saved = (): SavedAward[] => readDemoState<SavedAward[]>(SAVED_KEY, initialSaved);

function passes(a: AwardRecord, id: AwardFilterId): boolean {
  switch (id) {
    case "trade":
      return a.naicsCode !== null && MY_TRADE_CODES.has(a.naicsCode);
    case "area":
      return a.location.state !== null && MY_STATES.includes(a.location.state);
    case "size":
      return a.obligated !== null && a.obligated >= SIZE_MIN_USD && a.obligated <= SIZE_MAX_USD;
    case "justAwarded":
      return a.recency.justAwarded === true;
    case "comingUpAgain":
      return a.recency.comingUpAgain;
  }
}

const DAY_MS = 86_400_000;
const daysFromNow = (iso: string | null | undefined): number | null =>
  iso ? Math.round((new Date(iso).getTime() - Date.now()) / DAY_MS) : null;

/** The panel filters the newer Awards page sends (production's AwardPanelFilters). */
function passesPanel(a: AwardRecord, p: AwardPanelFilters | undefined): boolean {
  if (!p) return true;
  const within = (v: number | null, lo?: number, hi?: number) =>
    (lo === undefined || (v !== null && v >= lo)) && (hi === undefined || (v !== null && v <= hi));
  if (p.chooseStates?.length && !(a.location.state && p.chooseStates.includes(a.location.state))) return false;
  if (!within(a.obligated, p.dollarMin, p.dollarMax)) return false;
  if (!within(a.recency.daysSinceAward, p.awardedMinDays, p.awardedMaxDays)) return false;
  if (p.endsMinDays !== undefined || p.endsMaxDays !== undefined) {
    if (!within(daysFromNow(a.workEndsAt ?? a.recency.recompeteAt), p.endsMinDays, p.endsMaxDays)) return false;
  }
  if (p.buyerKind === "defense" && !a.agency.isDefense) return false;
  if (p.buyerKind === "civilian" && a.agency.isDefense) return false;
  if (p.setAsides?.length && !p.setAsides.includes(setAsideChoice(a.setAside).id)) return false;
  if (!within(a.offersReceived, p.bidsMin, p.bidsMax)) return false;
  if (p.naicsCodes?.length && !(a.naicsCode && p.naicsCodes.includes(a.naicsCode))) return false;
  if (p.pscCodes?.length && !(a.pscCode && p.pscCodes.includes(a.pscCode))) return false;
  if (p.agencies?.length && !p.agencies.includes(agencyKey(a))) return false;
  if (p.competed === "yes" && (a.extentCompeted === null || isSoleSource(a.extentCompeted))) return false;
  if (p.competed === "no" && !isSoleSource(a.extentCompeted)) return false;
  if (p.pricing?.length && !(a.pricing && p.pricing.includes(a.pricing))) return false;
  if (p.subPlanRequired && !hasSubcontractingPlan(a.subcontractingPlan)) return false;
  if (p.hasSubs && !(a.bench && a.bench.distinctSubs > 0)) return false;
  if (p.durationMinDays !== undefined || p.durationMaxDays !== undefined) {
    const ends = a.workEndsAt ?? a.recency.recompeteAt;
    const length =
      ends && a.recency.awardedAt
        ? Math.round((new Date(ends).getTime() - new Date(a.recency.awardedAt).getTime()) / DAY_MS)
        : null;
    if (!within(length, p.durationMinDays, p.durationMaxDays)) return false;
  }
  return true;
}

const agencyKey = (a: AwardRecord): string => a.agency.abbrev ?? a.agency.name;

/** The pick lists in the filter panel, built from the awards in this member's market. */
function facets(): AwardFacets {
  const count = (pick: (a: AwardRecord) => [string, string] | null): AwardFacet[] => {
    const m = new Map<string, AwardFacet>();
    for (const a of allAwardRecords()) {
      const kv = pick(a);
      if (!kv) continue;
      const f = m.get(kv[0]) ?? { id: kv[0], label: kv[1], count: 0 };
      f.count += 1;
      m.set(kv[0], f);
    }
    return [...m.values()].sort((x, y) => y.count - x.count || x.label.localeCompare(y.label));
  };
  return {
    naics: count((a) =>
      a.naicsCode ? [a.naicsCode, plainNaics(a.naicsCode, naicsDescription(a.naicsCode) ?? a.workType)] : null,
    ),
    psc: count((a) =>
      a.pscCode ? [a.pscCode, plainPsc(a.pscCode, a.pscName ?? pscDescription(a.pscCode))] : null,
    ),
    agencies: count((a) => [agencyKey(a), a.agency.name]),
    pricing: count((a) => (a.pricing ? [a.pricing, a.pricing] : null)),
  };
}

// ── Questions typed in the search box ──────────────────────────────────────
// Production reads a question ("catering over $1M in North Carolina in the last year")
// with a language model. The demo has no model, so a few rules read the same parts:
// money, time, states, set-asides, sole source and subcontractors. The rest of the words
// stay the search text. Plain keywords are never treated as a question.

const HINT = /\b(months?|years?|million|k|over|under|between|who|which|lost|subcontract\w*)\b/i;

/** The same test production uses: a number, $, a size or time word, or five or more words. */
function looksLikeQuestion(q: string): boolean {
  const t = q.trim();
  const words = t.split(/\s+/).filter(Boolean).length;
  if (words === 0) return false;
  if (words === 1 && !t.includes("$")) return false;
  return words >= 5 || /[\d$]/.test(t) || HINT.test(t);
}

const STOP = new Set(
  "a an the of for in on at to and or with by from that who which what show me find list awards award contracts contract jobs job companies company firms worth than more less any all".split(" "),
);

function dollars(n: string, unit: string | undefined): number {
  const v = Number(n.replace(/,/g, ""));
  const u = (unit ?? "").toLowerCase();
  return u.startsWith("b") ? v * 1e9 : u.startsWith("m") ? v * 1e6 : u.startsWith("k") || u === "thousand" ? v * 1e3 : v;
}

function interpret(raw: string): AwardInterpretation | undefined {
  if (!looksLikeQuestion(raw)) return undefined;
  let text = ` ${raw.toLowerCase()} `;
  const panel: AwardPanelFilters = {};
  const cut = (rx: RegExp) => {
    text = text.replace(rx, " ");
  };
  const money = "\\$?\\s?([\\d.,]+)\\s?(billion|million|thousand|bn|b|m|k)?\\b";
  const between = text.match(new RegExp(`between ${money} and ${money}`));
  if (between) {
    panel.dollarMin = dollars(between[1], between[2]);
    panel.dollarMax = dollars(between[3], between[4]);
    cut(new RegExp(`between ${money} and ${money}`));
  }
  const over = text.match(new RegExp(`(?:over|above|more than|at least) ${money}`));
  if (over) {
    panel.dollarMin = dollars(over[1], over[2]);
    cut(new RegExp(`(?:over|above|more than|at least) ${money}`));
  }
  const under = text.match(new RegExp(`(?:under|below|less than|up to) ${money}`));
  if (under) {
    panel.dollarMax = dollars(under[1], under[2]);
    cut(new RegExp(`(?:under|below|less than|up to) ${money}`));
  }
  const last = text.match(/(?:in the |over the )?(?:last|past) (\d+)?\s?(day|week|month|year)s?/);
  if (last) {
    const n = Number(last[1] ?? 1);
    const per = { day: 1, week: 7, month: 30, year: 365 }[last[2] as "day" | "week" | "month" | "year"];
    panel.awardedMaxDays = n * per;
    cut(/(?:in the |over the )?(?:last|past) (\d+)?\s?(day|week|month|year)s?/);
  }
  const states: string[] = [];
  for (const [code, name] of Object.entries(US_STATE_NAMES)) {
    const rx = new RegExp(`\\b${name.toLowerCase()}\\b`);
    if (rx.test(text)) {
      states.push(code);
      cut(rx);
    }
  }
  if (states.length) panel.chooseStates = states;
  const setAsides: string[] = [];
  for (const [id, rx] of [
    ["wosb", /\b(wosb|woman[- ]owned|women[- ]owned)\b/],
    ["sdvosb", /\b(sdvosb|service[- ]disabled veteran[- ]owned|veteran[- ]owned)\b/],
    ["hubzone", /\bhub ?zone\b/],
    ["8a", /\b8\(?a\)?/],
  ] as const) {
    if (rx.test(text)) {
      setAsides.push(id);
      cut(rx);
    }
  }
  if (setAsides.length) panel.setAsides = setAsides;
  if (/\b(sole[- ]source|no competition|not competed)\b/.test(text)) {
    panel.competed = "no";
    cut(/\b(sole[- ]source|no competition|not competed)\b/);
  }
  if (/\b(subcontract\w*|hired small firms|hire small firms|use subs)\b/.test(text)) {
    panel.hasSubs = true;
    cut(/\b(subcontract\w*|hired small firms|hire small firms|use subs)\b/);
  }
  const q = text
    .replace(/[?.,!]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .join(" ");
  if (Object.keys(panel).length === 0) return undefined;
  return { q, panel };
}

/** A removed chip sends back the edited reading. Only the known keys are kept. */
function mergePanels(a: AwardPanelFilters | undefined, b: AwardPanelFilters): AwardPanelFilters {
  const out: AwardPanelFilters = { ...(a ?? {}) };
  for (const [k, v] of Object.entries(b)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/** The "Best match" score: just awarded, up for bid again, right size, then recent. */
function relevance(a: AwardRecord): number {
  const months = (a.recency.daysSinceAward ?? 0) / 30;
  const size = a.obligated !== null && a.obligated >= SIZE_MIN_USD && a.obligated <= SIZE_MAX_USD;
  return (
    (a.recency.justAwarded ? 45 : 0) +
    (a.recency.comingUpAgain ? 30 : 0) +
    (size ? 15 : 0) +
    Math.max(0, 12 - months)
  );
}

function sorted(list: AwardRecord[], sort: AwardSort): AwardRecord[] {
  const out = list.map((a, i) => ({ a, i }));
  if (sort === "recent") {
    out.sort((x, y) => (x.a.recency.daysSinceAward ?? 9e9) - (y.a.recency.daysSinceAward ?? 9e9) || x.i - y.i);
  } else if (sort === "largest") {
    out.sort((x, y) => (y.a.obligated ?? 0) - (x.a.obligated ?? 0) || x.i - y.i);
  } else {
    out.sort((x, y) => relevance(y.a) - relevance(x.a) || x.i - y.i);
  }
  return out.map((x) => x.a);
}

export const routes: DemoRouteDef[] = [
  {
    method: "POST",
    path: "/awards",
    handler: ({ body }) => {
      const req = (body ?? {}) as AwardListRequest;
      const filters = req.filters ?? DEFAULT_AWARD_FILTERS;
      const sort = req.sort ?? "relevant";
      const limit = Math.min(Math.max(1, Number(req.limit) || PAGE_SIZE), 50);
      const page = Math.max(1, Number(req.page) || 1);
      const typed = typeof req.q === "string" ? req.q.trim() : "";
      // A question becomes search words plus panel filters, shown as chips the member can remove.
      const interpreted = req.interpreted ?? (typed ? interpret(typed) : undefined);
      const q = interpreted ? interpreted.q : typed;
      const panel = interpreted ? mergePanels(req.panel, interpreted.panel) : req.panel;

      const matchedBecause: Record<string, string> = {};
      const matched = sorted(
        allAwardRecords().filter((a) => {
          if (!filters.every((f) => passes(a, f)) || !passesPanel(a, panel)) return false;
          if (!q) return true;
          const why = matchAward(a, q);
          if (why === null) return false;
          matchedBecause[a.awardId] = why;
          return true;
        }),
        sort,
      );
      const start = (page - 1) * limit;
      return {
        awards: matched.slice(start, start + limit),
        page,
        limit,
        hasMore: start + limit < matched.length,
        appliedFilters: filters,
        total: matched.length,
        ...(q ? { matchedBecause } : {}),
        ...(interpreted ? { interpreted } : {}),
      };
    },
  },
  {
    method: "GET",
    path: "/awards/facets",
    handler: () => facets(),
  },
  {
    method: "GET",
    path: "/awards/saved",
    handler: () => ({
      awards: [...saved()].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    }),
  },
  {
    method: "GET",
    path: "/awards/:awardId",
    handler: ({ params }) =>
      findAwardRecord(params.awardId) ?? demoResponse(404, { message: "That award is not in your market." }),
  },
  {
    method: "POST",
    path: "/awards/saved",
    handler: ({ body }) => {
      const awardId = String(body?.awardId ?? "");
      if (!awardId) return demoResponse(400, { message: "Missing award" });
      updateDemoState<SavedAward[]>(SAVED_KEY, initialSaved, (prev) =>
        prev.some((s) => s.awardId === awardId)
          ? prev
          : [...prev, { awardId, sourceTag: String(body?.sourceTag ?? "from Awards"), savedAt: new Date().toISOString() }],
      );
      return { ok: true };
    },
  },
  {
    method: "DELETE",
    path: "/awards/saved/:awardId",
    handler: ({ params }) => {
      updateDemoState<SavedAward[]>(SAVED_KEY, initialSaved, (prev) => prev.filter((s) => s.awardId !== params.awardId));
      return { ok: true };
    },
  },
];
