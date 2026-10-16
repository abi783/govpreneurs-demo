// DEMO (Hunter chat): the answers that need real facts.
//
// Every sentence here is built from the story (`persona.ts`, `opportunities.ts`,
// `places.ts`). Hunter finds and explains fit. He never gives the bid or no-bid
// call: that is Grant's, and each answer says so where it matters.

import type {
  ActPayload,
  ComparePayload,
  EligibilityPayload,
  EligibilityRow,
  MatchesPayload,
  MatchesRow,
  ProfilePayload,
} from "../../../lib/hunterChat";
import { money } from "../../../lib/money";
import { KEY_PARTNER, PAST_PERFORMANCE, PERSONA } from "../../story/persona";
import { PLACES } from "../../story/places";
import { forYouRows, savedRows, universe, type FeedRow } from "../data";
import { longDate, shortDate } from "../dates";
import {
  RANGE_TEXT,
  cap,
  fitSentence,
  holdsSetAside,
  joinList,
  noticeText,
  pastJobFor,
  pastJobText,
  rangeStatus,
  reasonList,
  setAsideText,
  valueText,
  aboutValue,
  closesText,
  codePhrase,
  distanceShort,
} from "../facts";
import type { ChatCtx, Turn } from "./types";

/** The plain title that the card shows. */
export const titleOf = (row: FeedRow): string => row.o.plainTitle;

/**
 * How a button names an opportunity. Most plain titles read as a noun phrase
 * ("Field meals for Camp Mackall training rotations"). The title of a Sources
 * Sought notice is a sentence, so the button names it by its place and type.
 */
/** The name of an opportunity at the start of a sentence. */
export function nameOf(row: FeedRow): string {
  return row.o.noticeType === "Sources Sought"
    ? `The ${row.city} Sources Sought notice`
    : titleOf(row);
}

export function refOf(row: FeedRow): string {
  return row.o.noticeType === "Sources Sought" ? `${row.city} Sources Sought notice` : titleOf(row);
}

export const chip = {
  why: (row: FeedRow) => `Why does the ${refOf(row)} match me?`,
  ready: (row: FeedRow) => `Am I ready to bid the ${refOf(row)}?`,
  top3: "Compare my top 3 — which should I chase?",
  best: "What's out there for me right now?",
  fresh: "What's new this week?",
  how: "How do you pick my matches?",
  readyList: "Which of these am I actually ready for?",
  wosb: "Show only woman-owned set-asides",
  saved: "Show my saved ones",
  profile: "What do you know about my business?",
  closing: "What closes first?",
  near: "Show work near Fayetteville",
};

const GRANT_POINTER = "Whether to bid is Grant's call. Open the opportunity and ask him.";
const GO_NO_GO = "Grant makes the go or no-go call on each one.";

// ── Matches card ────────────────────────────────────────────────────────────

export function matchRow(row: FeedRow): MatchesRow {
  return {
    oppKey: row.id,
    title: titleOf(row),
    tier: row.o.hunter.tier,
    matchReasons: reasonList(row),
    dueDate: row.closesAt,
    agency: row.o.agency,
    sourceType: row.o.scope === "sled" ? "sled" : "sam",
  };
}

export function matchesPayload(rows: FeedRow[]): MatchesPayload {
  return { rows: rows.map(matchRow) };
}

// ── Why does this match me? ─────────────────────────────────────────────────

export function whyMatch(row: FeedRow): Turn {
  const t = titleOf(row);
  const rank = row.o.hunter.forYouRank;
  const fit = row.o.hunter.fit;
  const sentences = fit?.length ? fit.map((f) => fitSentence(row, f)) : fallbackReasons(row);
  const lead = rank
    ? `${nameOf(row)} is number ${rank} on your list. Here is why:`
    : `${nameOf(row)} is on the All opportunities tab, not on your For You list. Here is how it fits:`;
  const concern = fit?.some((f) => f.kind === "clearanceGap");
  return {
    reply:
      `${lead}\n${sentences.map((s) => `• ${s}`).join("\n")}\n` +
      (concern
        ? `That is why I rank it lower. ${GRANT_POINTER}`
        : `I explain the fit. ${GRANT_POINTER}`),
    kind: "matches",
    data: matchesPayload([row]),
    chips: [
      chip.ready(row),
      chip.top3,
      ...(row.setAside === "WOSB" ? ["What is a WOSB set-aside?"] : [chip.how]),
    ].slice(0, 3),
  };
}

function fallbackReasons(row: FeedRow): string[] {
  const out: string[] = [];
  out.push(`It uses ${codePhrase(row)}, NAICS ${row.o.naics} (${row.naicsLabel}).`);
  out.push(
    row.setAside
      ? `It is ${setAsideText(row)}, and you qualify.`
      : "It is open to every business, so larger firms can compete too.",
  );
  const status = rangeStatus(row);
  if (status === "in")
    out.push(`The value is ${aboutValue(row)}. That is inside your ${RANGE_TEXT} range.`);
  else if (status === "above")
    out.push(`The value is ${aboutValue(row)}. That is above your ${RANGE_TEXT} range.`);
  else if (status === "below")
    out.push(`The value is ${aboutValue(row)}. That is below your usual range.`);
  else out.push("The notice states no value yet.");
  out.push(
    row.miles > PERSONA.serviceRadiusMiles
      ? `The site is ${row.miles} miles from your kitchen. That is outside your ${PERSONA.serviceRadiusMiles}-mile area.`
      : `The site is ${row.miles} miles from your kitchen in ${PERSONA.hqCity}.`,
  );
  return out;
}

// ── Am I ready? ─────────────────────────────────────────────────────────────

/** The bond share the notice asks for, read from its own summary. */
function bondShare(row: FeedRow): number | null {
  const m = row.o.summary.match(/bond of (\d+)% of the annual price/i);
  return m ? Number(m[1]) / 100 : null;
}

export function readinessRows(row: FeedRow): EligibilityRow[] {
  const o = row.o;
  const rows: EligibilityRow[] = [];

  rows.push(
    row.setAside
      ? {
          field: "Set-aside",
          value: holdsSetAside(row)
            ? `${row.setAside === "WOSB" ? "Woman-owned (WOSB)" : "Small business"}. You qualify.`
            : "You do not hold this status.",
          status: holdsSetAside(row) ? "pass" : "fail",
        }
      : {
          field: "Set-aside",
          value: "None. Every business can compete, including large firms.",
          status: "pass",
        },
  );

  rows.push({
    field: "Work type",
    value: `NAICS ${o.naics}, ${row.naicsLabel}. ${o.naics === PERSONA.primaryNaics ? "Your main code." : "One of your codes."}`,
    status: "pass",
  });

  const away = row.miles;
  rows.push(
    away > PERSONA.serviceRadiusMiles ||
      !(PERSONA.serviceStates as readonly string[]).includes(row.state)
      ? {
          field: "Place",
          value: `${row.city}, ${row.state}: ${away} miles from your kitchen. That is outside your ${PERSONA.serviceRadiusMiles}-mile area.`,
          status: "fail",
        }
      : away > 60
        ? {
            field: "Place",
            value: `${row.city}, ${row.state}: ${away} miles. That is inside your area, but a long daily haul.`,
            status: "warn",
          }
        : {
            field: "Place",
            value: `${row.city}, ${row.state}: ${away} miles from your kitchen.`,
            status: "pass",
          },
  );

  const range = rangeStatus(row);
  rows.push(
    range === "none"
      ? { field: "Contract size", value: "The notice states no value.", status: "neutral" }
      : range === "in"
        ? {
            field: "Contract size",
            value: `${valueText(row)}. Inside your ${RANGE_TEXT} range.`,
            status: "pass",
          }
        : range === "above"
          ? {
              field: "Contract size",
              value: `${valueText(row)}. Above your ${RANGE_TEXT} range.`,
              status: (row.low ?? 0) > PERSONA.targetValueMax * 4 ? "fail" : "warn",
            }
          : {
              field: "Contract size",
              value: `${valueText(row)}. Below your usual range.`,
              status: "warn",
            },
  );

  rows.push({
    field: "Time to respond",
    value: `${cap(closesText(row))}.`,
    status: o.closesInDays >= 14 ? "pass" : "warn",
  });

  if (o.clearanceRequired) {
    rows.push({
      field: "Clearance",
      value: `${o.clearanceRequired} Your team holds no clearances.`,
      status: "fail",
    });
  }

  const share = bondShare(row);
  if (share !== null && o.valueLow !== null) {
    const need = Math.round(o.valueLow * share);
    rows.push({
      field: "Bond",
      value: `The notice asks for a bond of ${Math.round(share * 100)}% of the yearly price, about ${money(need)}. Your largest bond is ${money(PERSONA.largestBond)}.`,
      status: need > PERSONA.largestBond ? "warn" : "pass",
    });
  }

  const past = pastJobFor(row);
  if (past) {
    rows.push({ field: "Your past work", value: pastJobText(past), status: "pass" });
  }

  if (o.noticeType === "Sources Sought") {
    rows.push({
      field: "Notice type",
      value:
        "Sources Sought. An early notice, not a bid yet. You reply to say that you can do the work.",
      status: "neutral",
    });
  }
  return rows;
}

/** Food-handler gap: the one closable gap that the story names for the Camp Mackall job. */
function actFor(row: FeedRow): ActPayload | undefined {
  if (row.id !== "SP4701-26-Q-0021") return undefined;
  const missing = PERSONA.employeesW2 - PERSONA.foodHandlerCertified;
  return {
    gap: {
      kind: "set_aside",
      oppKey: row.id,
      title: titleOf(row),
      setAsideName: "Food-handler",
      note: `${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks hold a food-handler certificate. The quote asks for proof for every cook. ${missing} still need one.`,
    },
    trustLevel: "high",
    offers: [],
    bidChecklist: [
      { label: `SAM.gov registration active until April 2027`, done: true },
      { label: "Woman-owned small business status on file", done: true },
      { label: "HACCP food-safety plan", done: true },
      { label: "Insurance for the kitchen and both vans", done: true },
      {
        label: `Food-handler certificates for all ${PERSONA.employeesW2} cooks (${PERSONA.foodHandlerCertified} done)`,
        done: false,
      },
    ],
  };
}

export function readiness(row: FeedRow): Turn {
  const t = titleOf(row);
  const rows = readinessRows(row);
  const fails = rows.filter((r) => r.status === "fail");
  const warns = rows.filter((r) => r.status === "warn");
  const early = row.o.noticeType === "Sources Sought";
  const range = rangeStatus(row);

  let verdict: EligibilityPayload["verdict"] = "eligible";
  let label = "Eligible";
  if (fails.length > 0) {
    verdict = "ineligible";
    label = "Not eligible today";
  } else if (range === "above") {
    verdict = "certify_to_qualify";
    label = "Eligible, but large for you alone";
  } else if (warns.length > 0) {
    label = "Eligible, with cautions";
  }
  if (early && fails.length === 0) label = "Eligible to reply";

  let reply: string;
  if (fails.length > 0) {
    reply = `Not today. ${fails.map((f) => f.value).join(" ")} That is why ${t} sits low on your list. ${GRANT_POINTER}`;
  } else if (early) {
    reply = `There is nothing to bid yet. This is a Sources Sought notice. You can reply to say that you can do the work. It is free, and it puts you on the buyer's list. ${GRANT_POINTER}`;
  } else if (range === "above") {
    reply =
      `You meet the set-aside and the work is yours. The problem is size: ${valueText(row)} is above your ${RANGE_TEXT} range` +
      (bondShare(row) !== null ? `, and the bond is more than you have held.` : `.`) +
      ` A team bid may fit better. ${KEY_PARTNER.name} holds the job now and looks for woman-owned subcontractors. ${GRANT_POINTER}`;
  } else if (warns.length > 0) {
    const care = warns.map((w) =>
      w.field === "Time to respond"
        ? `only ${row.o.closesInDays} days are left to respond`
        : `the ${w.field.toLowerCase()} needs a look`,
    );
    reply = `Yes, you can compete for ${t}. ${rows.length - warns.length - fails.length} checks pass. ${cap(joinList(care))}. ${GRANT_POINTER}`;
  } else {
    reply = `Yes. Set-aside, code, place, size and time all fit ${t}. ${GRANT_POINTER}`;
  }

  const data: EligibilityPayload = {
    oppKey: row.id,
    title: t,
    agency: row.o.agency,
    verdict,
    verdictLabel: label,
    soleSource: false,
    rows,
    note: "Hunter checks fit and eligibility only. Grant makes the go or no-go call: open this opportunity and ask him.",
  };
  const act = actFor(row);
  return {
    reply: act
      ? `${reply} One thing needs work before you answer: food-handler certificates. ${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks hold one.`
      : reply,
    kind: "eligibility",
    data,
    actPayload: act,
    chips: [chip.why(row), chip.top3, chip.how],
  };
}

// ── Compare ─────────────────────────────────────────────────────────────────

export function compare(rows: FeedRow[], intro: string, chips: string[]): Turn {
  const picked = rows.slice(0, 4);
  const titles = picked.map(titleOf);
  const bestIdx = <T>(vals: T[], better: (a: T, b: T) => boolean): number | null => {
    let best = 0;
    for (let i = 1; i < vals.length; i += 1) if (better(vals[i], vals[best])) best = i;
    // A tie has no winner.
    return vals.filter((v) => !better(v, vals[best]) && !better(vals[best], v)).length > 1
      ? null
      : best;
  };
  const mids = picked.map((r) => ((r.low ?? 0) + (r.high ?? r.low ?? 0)) / 2);
  const data: ComparePayload = {
    opps: picked.map((r) => ({
      oppKey: r.id,
      title: titleOf(r),
      agency: r.o.agency,
      location: `${r.city}, ${r.state}`,
    })),
    rows: [
      {
        field: "Value",
        values: picked.map((r) => valueText(r)),
        winner: bestIdx(
          picked.map((r, i) => (rangeStatus(r) === "in" ? mids[i] : -1)),
          (a, b) => a > b,
        ),
        notes: picked.map((r) =>
          rangeStatus(r) === "in"
            ? "Inside your range"
            : rangeStatus(r) === "above"
              ? "Above your range"
              : null,
        ),
      },
      {
        field: "Miles from your kitchen",
        values: picked.map((r) => `${r.miles} miles`),
        winner: bestIdx(
          picked.map((r) => r.miles),
          (a, b) => a < b,
        ),
        notes: picked.map((r) => `${r.city}, ${r.state}`),
      },
      {
        field: "Who can compete",
        values: picked.map((r) =>
          r.setAside === "WOSB"
            ? "Woman-owned only"
            : r.setAside === "SBA"
              ? "Small business only"
              : "Every business",
        ),
        winner: bestIdx(
          picked.map((r) => (r.setAside ? 1 : 0)),
          (a, b) => a > b,
        ),
        notes: picked.map((r) =>
          r.setAside ? "Fewer firms compete" : "Large firms can compete too",
        ),
      },
      {
        field: "Time to respond",
        values: picked.map((r) => `${r.o.closesInDays} days`),
        winner: bestIdx(
          picked.map((r) => r.o.closesInDays),
          (a, b) => a > b,
        ),
        notes: picked.map((r) => `Closes ${shortDate(r.o.closesInDays)}`),
      },
      {
        field: "Notice type",
        values: picked.map((r) => r.o.noticeType),
        winner: null,
      },
      {
        field: "Why it fits",
        values: picked.map((r) =>
          r.o.hunter.fit?.length
            ? r.o.hunter.fit.map((f) => f.says).join(", ")
            : reasonList(r).join(", ").toLowerCase(),
        ),
        winner: null,
      },
    ],
    // Hunter ranks fit. He does not name a bid. The tradeoff says who decides.
    verdict: undefined as unknown as ComparePayload["verdict"],
    tradeoff: tradeoffText(picked),
  };
  return {
    reply: `${intro} I compared ${picked.length === 2 ? joinList(titles) : `these ${picked.length}`} on value, distance, who can compete and time left. The table is above your list. I rank fit. ${GO_NO_GO}`,
    kind: "compare",
    data,
    chips,
  };
}

function tradeoffText(rows: FeedRow[]): string {
  const biggest = [...rows].sort((a, b) => (b.high ?? 0) - (a.high ?? 0))[0];
  const minMiles = Math.min(...rows.map((r) => r.miles));
  const nearest = rows.filter((r) => r.miles === minMiles);
  const soonest = [...rows].sort((a, b) => a.o.closesInDays - b.o.closesInDays)[0];
  const parts: string[] = [];
  parts.push(`${titleOf(biggest)} is the largest job.`);
  if (!(nearest.length === 1 && nearest[0].id === biggest.id)) {
    parts.push(
      `${joinList(nearest.map(titleOf))} ${nearest.length === 1 ? "is" : "are"} the closest, ${minMiles} miles away.`,
    );
  }
  parts.push(`${titleOf(soonest)} closes first, in ${soonest.o.closesInDays} days.`);
  parts.push("Open any of them to ask Grant for his call.");
  return parts.join(" ");
}

export function compareTop3(): Turn {
  const rows = forYouRows().slice(0, 3);
  return compare(rows, "Here are your top 3 by fit.", [
    chip.why(rows[0]),
    chip.ready(rows[0]),
    chip.closing,
  ]);
}

export function compareSaved(): Turn {
  const rows = savedRows().sort((a, b) => b.o.hunter.score - a.o.hunter.score);
  if (rows.length < 2) {
    return {
      reply:
        rows.length === 1
          ? `You have saved one opportunity: ${titleOf(rows[0])}. Save one more and I can compare them.`
          : "You have not saved anything yet. Tap the bookmark on any card, then ask me again.",
      chips: [chip.best, chip.top3],
    };
  }
  return compare(rows, `You have saved ${rows.length} opportunities.`, [
    chip.why(rows[0]),
    chip.ready(rows[0]),
    chip.best,
  ]);
}

// ── Lists: best matches, ready now, new, closing ────────────────────────────

const TIER_ORDER = { priority: 0, strong: 1, stretch: 2, low: 3 } as const;

export function bestMatches(): Turn {
  const rows = forYouRows();
  const by = (tier: string) => rows.filter((r) => r.o.hunter.tier === tier).length;
  const fresh = rows.filter((r) => r.o.postedDaysAgo <= 7).length;
  const soonest = [...rows].sort((a, b) => a.o.closesInDays - b.o.closesInDays)[0];
  const top = rows.slice(0, 5);
  return {
    reply:
      `You have ${rows.length} matches. ${by("priority")} are Priority and ${by("strong")} are Strong. ${fresh} were posted in the last 7 days.\n` +
      `The first to close is ${titleOf(soonest)}, in ${soonest.o.closesInDays} days. Here are your top ${top.length}.`,
    kind: "matches",
    data: matchesPayload(top),
    chips: [chip.why(rows[0]), chip.top3, chip.readyList],
  };
}

type Readiness = "ready" | "stretch" | "early" | "blocked";

export function readinessClass(row: FeedRow): Readiness {
  if (row.o.clearanceRequired) return "blocked";
  if (row.o.noticeType === "Sources Sought") return "early";
  const tier = row.o.hunter.tier;
  if (tier === "stretch" || tier === "low") return "stretch";
  if (rangeStatus(row) === "above" || row.miles > PERSONA.serviceRadiusMiles || !holdsSetAside(row))
    return "stretch";
  return "ready";
}

/** "A, B, and C, and 4 more" is wrong; this writes "A, B, C, and 4 more". */
export function listNames(rows: FeedRow[], n = 3): string {
  const shown = rows.slice(0, n).map(titleOf);
  return rows.length > n ? `${shown.join(", ")}, and ${rows.length - n} more` : joinList(shown);
}

export function readyList(rows: FeedRow[]): Turn {
  const list = rows.length > 0 ? rows : forYouRows();
  const groups: Record<Readiness, FeedRow[]> = { ready: [], stretch: [], early: [], blocked: [] };
  for (const r of list) groups[readinessClass(r)].push(r);
  const names = (rs: FeedRow[]) => listNames(rs, 3);
  const parts: string[] = [
    `I checked ${list.length} opportunities against your set-aside, codes, size, place and time.`,
  ];
  if (groups.ready.length)
    parts.push(`Ready now (${groups.ready.length}): ${names(groups.ready)}.`);
  if (groups.stretch.length)
    parts.push(
      `A stretch (${groups.stretch.length}): ${names(groups.stretch)}. Each has one gap, such as size or distance.`,
    );
  if (groups.early.length)
    parts.push(
      `Early notice (${groups.early.length}): ${names(groups.early)}. You reply; you do not bid yet.`,
    );
  if (groups.blocked.length)
    parts.push(
      `Not possible today (${groups.blocked.length}): ${names(groups.blocked)}. It needs cleared staff.`,
    );
  parts.push(GRANT_POINTER);
  const shown = [...groups.ready, ...groups.stretch, ...groups.early].sort(
    (a, b) => TIER_ORDER[a.o.hunter.tier] - TIER_ORDER[b.o.hunter.tier],
  );
  const first = groups.ready[0] ?? list[0];
  return {
    reply: parts.join("\n"),
    kind: "matches",
    data: matchesPayload(shown.slice(0, 6)),
    chips: [chip.ready(first), chip.why(first), chip.top3],
  };
}

export function listBy(rows: FeedRow[], by: "closing" | "value" | "near", n = 4): Turn {
  const sorted = [...rows];
  let lead = "";
  if (by === "closing") {
    sorted.sort((a, b) => a.o.closesInDays - b.o.closesInDays);
    lead = `These close first. ${titleOf(sorted[0])} closes in ${sorted[0].o.closesInDays} days (${longDate(sorted[0].o.closesInDays)}).`;
  } else if (by === "value") {
    sorted.sort((a, b) => (b.high ?? 0) - (a.high ?? 0));
    lead = `These are the largest. ${titleOf(sorted[0])} is ${valueText(sorted[0])}.`;
  } else {
    sorted.sort((a, b) => a.miles - b.miles);
    lead = `These are the closest to your kitchen. ${titleOf(sorted[0])} is ${sorted[0].miles} miles away in ${sorted[0].city}.`;
  }
  const top = sorted.slice(0, n);
  return {
    reply: `${lead} Here are the top ${top.length}.`,
    kind: "matches",
    data: matchesPayload(top),
    chips: [chip.why(top[0]), chip.ready(top[0]), chip.top3],
  };
}

// ── Tell me about one opportunity ───────────────────────────────────────────

export function aboutOpp(row: FeedRow): Turn {
  const o = row.o;
  return {
    reply:
      `${titleOf(row)}\n` +
      `${o.summary}\n` +
      `Buyer: ${o.agency}, ${o.office}. Place: ${row.city}, ${row.state}, ${row.miles} miles from your kitchen. Value: ${valueText(row)}. ` +
      `It is ${noticeText(row)}, ${setAsideText(row)}, and ${closesText(row)}.`,
    kind: "matches",
    data: matchesPayload([row]),
    chips: [chip.why(row), chip.ready(row), chip.top3],
  };
}

// ── The member's profile ────────────────────────────────────────────────────

export function profileCard(): Turn {
  const naics = [
    `${PERSONA.primaryNaics} — ${PERSONA.primaryNaicsLabel}`,
    ...PERSONA.secondaryNaics.map((n) => `${n.code} — ${n.label}`),
  ];
  const samUntil = new Date(`${PERSONA.samActiveUntil}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const data: ProfilePayload = {
    rows: [
      {
        label: "Business",
        value: `${PERSONA.businessName}, ${PERSONA.entityType} formed ${PERSONA.formedOn} in ${PERSONA.stateOfIncorporation}`,
        source: "profile",
      },
      { label: "NAICS codes", value: naics.join("; "), items: naics, source: "profile" },
      {
        label: "Certifications",
        value: PERSONA.certifications.join(", "),
        items: [...PERSONA.certifications],
        source: "profile",
      },
      {
        label: "SAM.gov registration",
        value: `Active until ${samUntil}. UEI ${PERSONA.uei}. CAGE ${PERSONA.cage}.`,
        source: "profile",
      },
      {
        label: "Service area",
        value: `${PERSONA.serviceStates.join(", ")}, up to ${PERSONA.serviceRadiusMiles} miles from ${PERSONA.hqCity}`,
        source: "you_told_us",
      },
      { label: "Target contract size", value: `${RANGE_TEXT}`, source: "you_told_us" },
      {
        label: "Team and kitchen",
        value: `${PERSONA.employeesW2} employees, ${PERSONA.foodHandlerCertified} with food-handler certificates. ${PERSONA.kitchen}.`,
        source: "capability_statement",
      },
      {
        label: "What sets you apart",
        value: PERSONA.differentiators.join("; "),
        items: [...PERSONA.differentiators],
        source: "capability_statement",
      },
      {
        label: "Past performance",
        value: PAST_PERFORMANCE.map((p) => p.projectTitle).join("; "),
        items: PAST_PERFORMANCE.map((p) => `${p.projectTitle}, ${money(p.totalValue)}`),
        source: "capability_statement",
      },
      {
        label: "Target buyers",
        value: PERSONA.targetAgencies.join("; "),
        items: [...PERSONA.targetAgencies],
        source: "you_told_us",
      },
      { label: "Largest bond", value: money(PERSONA.largestBond), source: "you_told_us" },
    ],
    hiddenCount: 0,
    notOnFile: [],
    capabilityStatement: "parsed",
    factsUnavailable: false,
  };
  return {
    reply:
      `I know ${PERSONA.businessName}. You are a woman-owned small business in ${PERSONA.hqCity}, ${PERSONA.hqState}, with ${PERSONA.employeesW2} employees and one kitchen that cooks ${PERSONA.differentiators[0].match(/[\d,]+ meals a day/)?.[0] ?? "1,100 meals a day"}.\n` +
      "Each fact on the card shows where I read it. If one is wrong, tell me and I will propose a change for you to save.",
    kind: "profile",
    data,
    chips: [chip.how, "I can now cook 1,500 meals a day", chip.best],
  };
}

export function howIPick(): Turn {
  return {
    reply:
      "I score every new notice on four things.\n" +
      `• Scope fit: how close the work is to your codes (${PERSONA.primaryNaicsLabel}, ${PERSONA.secondaryNaics.map((n) => n.label).join(", ")}).\n` +
      `• Location: how far the site is from your kitchen in ${PERSONA.hqCity}. Your area is ${PERSONA.serviceStates.join(", ")}, up to ${PERSONA.serviceRadiusMiles} miles.\n` +
      "• Certification fit: the set-asides you hold, which are Small Business and Woman-Owned (WOSB).\n" +
      `• Past performance: your ${PAST_PERFORMANCE.length} finished jobs.\n` +
      "Then I sort each into Priority, Strong, Stretch or Low, and say why. I read your capability statement and SAM.gov registration. I do not decide whether to bid. Grant does.",
    chips: [chip.best, chip.profile, chip.top3],
  };
}

export function setAsideStatus(rows: FeedRow[]): Turn {
  const wosb = rows.filter((r) => r.setAside === "WOSB").length;
  const sba = rows.filter((r) => r.setAside === "SBA").length;
  const open = rows.filter((r) => !r.setAside).length;
  return {
    reply:
      "You qualify for two kinds of set-aside. You are a small business, and you are woman-owned (WOSB).\n" +
      `On this list: ${wosb} woman-owned, ${sba} small business, ${open} open to every business. You qualify for ${wosb + sba} of the ${rows.length}.\n` +
      "You do not qualify for veteran-owned (SDVOSB), 8(a), HUBZone or tribal set-asides.",
    chips: [chip.wosb, "What is a WOSB set-aside?", chip.best],
  };
}

export function savedSummary(rows: FeedRow[]): Turn {
  if (rows.length === 0) {
    return {
      reply:
        "You have not saved anything yet. Tap the bookmark on any card and it waits for you in Saved.",
      kind: "switch_tab",
      data: { tab: "saved" },
      chips: [chip.best, chip.top3],
    };
  }
  return {
    reply: `You have ${rows.length} saved: ${listNames(rows, 3)}. I opened your Saved tab. Filters do not change that list.`,
    kind: "switch_tab",
    data: { tab: "saved" },
    chips: [
      rows.length > 1 ? "Compare my saved opps — which should I pursue?" : chip.why(rows[0]),
      chip.ready(rows[0]),
      chip.best,
    ],
  };
}

export function universeRows(ctx: ChatCtx): FeedRow[] {
  return universe(ctx.tab === "saved" ? "saved" : ctx.tab === "all" ? "all" : "for_you");
}

export { PLACES };
