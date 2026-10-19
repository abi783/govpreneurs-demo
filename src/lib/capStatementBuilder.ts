// Deterministic cap-statement draft generator. Built from the member's profile facts
// (the story, plus whatever she has changed on the Business Profile) — never a blank
// prompt, never fabricated. DEMO: no roofing, no Marcus Williams: every fact below
// comes from src/demo/story or the profile store.

import { useMemo } from "react";
import { byMember } from "../demo/member";
import { PERSONA } from "../demo/story/persona";
import { FIELD_DEFS, effectiveField, valueToText } from "../demo/profile/fields";
import { getFieldOverrides, useFieldOverrides } from "../demo/profile/store";
import { fmtLong, fmtMonthYear, fmtUsd } from "../demo/profile/dates";
import { getPastPerformance, usePastPerformance, type PpEntry } from "../demo/profile/pastPerformance";
import type { PastPerformanceRecord } from "./state/microPurchases";
import { usd, usablePrice } from "./microPurchases/pricing";

export type CapSectionId =
  | "overview"
  | "competencies"
  | "differentiators"
  | "past_performance"
  | "certifications"
  | "contact";

export interface CapSection {
  id: CapSectionId;
  title: string;
  whyItMatters: string;
  body: string;
}

export interface CapStatementDraft {
  companyName: string;
  tagline: string;
  /** Two letters for the logo mark. */
  initials: string;
  sections: CapSection[];
  codes: {
    uei: string | null;
    cage: string | null;
    primaryNaics: string;
    samStatus: string;
  };
}

/** The facts a draft is built from. */
export interface CapFacts {
  businessName: string;
  ownerName: string;
  ownerTitle: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  uei: string | null;
  cage: string | null;
  primaryNaics: string;
  primaryNaicsLabel: string;
  secondaryNaics: string[];
  samLine: string;
  certifications: string[];
  coreCapabilities: string[];
  differentiators: string[];
  employees: number;
  foodHandlers: number;
  formedOn: string;
  states: string[];
  largestBond: number;
  pastPerformance: PpEntry[];
  targetAgencies: string[];
}

function textOf(id: string, overrides = getFieldOverrides()): string {
  return valueToText(effectiveField(FIELD_DEFS[id], overrides).value);
}
function listOf(id: string, overrides = getFieldOverrides()): string[] {
  const v = effectiveField(FIELD_DEFS[id], overrides).value;
  return Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
}

function factsFrom(overrides: ReturnType<typeof getFieldOverrides>, pp: PpEntry[]): CapFacts {
  const naics = textOf("primary-naics", overrides);
  const m = /^(\d{2,6})\s+(.*)$/.exec(naics);
  const employees = Number(textOf("employees", overrides)) || PERSONA.employeesW2;
  return {
    businessName: textOf("legal-name", overrides) || PERSONA.businessName,
    ownerName: PERSONA.ownerName,
    ownerTitle: PERSONA.ownerTitle,
    city: PERSONA.hqCity,
    state: PERSONA.hqState,
    address: textOf("physical-address", overrides) || PERSONA.physicalAddress,
    phone: textOf("business-phone", overrides) || PERSONA.phone,
    email: PERSONA.email,
    website: textOf("website", overrides) || PERSONA.website,
    uei: textOf("uei", overrides) || null,
    cage: textOf("cage", overrides) || null,
    primaryNaics: m ? m[1] : PERSONA.primaryNaics,
    primaryNaicsLabel: m ? m[2] : PERSONA.primaryNaicsLabel,
    secondaryNaics: listOf("secondary-naics", overrides),
    samLine: textOf("sam-status", overrides) || `Active until ${fmtLong(PERSONA.samActiveUntil)}`,
    certifications: textOf("sba-set-aside", overrides)
      .split("·")
      .map((c) => c.trim())
      .filter(Boolean),
    coreCapabilities: listOf("core-capabilities", overrides),
    differentiators: listOf("differentiators", overrides),
    employees,
    foodHandlers: Number(textOf("food-handlers", overrides)) || (PERSONA.foodHandlerCertified ?? 0),
    formedOn: PERSONA.formedOn,
    states: [...PERSONA.serviceStates],
    largestBond: PERSONA.largestBond,
    pastPerformance: pp,
    targetAgencies: listOf("target-agencies", overrides),
  };
}

export function getCapFacts(): CapFacts {
  return factsFrom(getFieldOverrides(), getPastPerformance());
}

export function useCapFacts(): CapFacts {
  const overrides = useFieldOverrides();
  const pp = usePastPerformance();
  return useMemo(() => factsFrom(overrides, pp), [overrides, pp]);
}

const STATE_NAME: Record<string, string> = { NC: "North Carolina", VA: "Virginia", SC: "South Carolina", GA: "Georgia" };

/** DEMO: the words that say what kind of business it is, per member. */
const TRADE = byMember({
  caterer: {
    tagline: "Woman-owned food service and catering contractor",
    place: (m: CapFacts) => `${m.employees} staff and one commercial kitchen.`,
    work: (list: string) => `We cook, pack and deliver meals for government buyers across ${list}.`,
    standard: "HACCP food-safety plan, USDA meal-pattern menus and daily temperature logs",
    proof: (m: CapFacts) => [`Food-handler certificates: ${m.foodHandlers} of ${m.employees} staff`, `Largest bond carried: ${fmtUsd(m.largestBond)}`],
    alternate: (m: CapFacts) => [
      `${m.businessName} is a woman-owned food service contractor based in ${m.city}, ${m.state}.`,
      `One commercial kitchen and ${m.employees} staff mean a buyer deals with one team from the first menu to the last tray.`,
    ],
  },
  agency: {
    tagline: "Woman-owned ad agency 12 miles from Fort Bragg",
    place: (m: CapFacts) => `${m.employees} staff, three freelancers, and a studio with a two-person video crew.`,
    work: (list: string) =>
      `We make video, run paid social and search, buy print, and build landing pages and lead routing for campaigns that reach military families across ${list}.`,
    standard: "Leads routed to a recruiter or caseworker within 5 minutes; captions on every video",
    proof: () => [],
    alternate: (m: CapFacts) => [
      `${m.businessName} is a woman-owned ad agency based in ${m.city}, ${m.state}, 12 miles from Fort Bragg.`,
      `Video, paid media and print buying under one roof mean a buyer deals with one team from the first shoot to the last lead.`,
    ],
  },
});

function tagline(m: CapFacts): string {
  return `${TRADE.tagline} · Small Business · ${m.city}, ${m.state}`;
}

function pastPerformanceBody(m: CapFacts): string {
  return m.pastPerformance
    .map((e) => {
      const rating = e.cpars === "Awaiting rating" ? " · performance rating pending" : e.cpars ? ` · rated ${e.cpars}` : "";
      return `• ${e.title} — ${e.customer} · ${e.role} · ${fmtUsd(e.value)} · ${fmtMonthYear(e.periodStart)} to ${fmtMonthYear(e.periodEnd)}${rating}`;
    })
    .join("\n");
}

function overviewBody(m: CapFacts): string {
  const places = m.states.map((s) => STATE_NAME[s] ?? s);
  const list = places.length > 1 ? `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}` : places[0];
  return [
    `${m.businessName} is a woman-owned small business in ${m.city}, ${m.state}, founded ${m.formedOn}.`,
    TRADE.place(m),
    TRADE.work(list),
  ].join(" ");
}

function competenciesBody(m: CapFacts): string {
  return [...m.coreCapabilities, TRADE.standard].join("\n");
}

function differentiatorsBody(m: CapFacts): string {
  return m.differentiators.map((d) => `• ${d}`).join("\n");
}

function certificationsBody(m: CapFacts): string {
  return [
    `UEI: ${m.uei ?? "—"}`,
    `CAGE: ${m.cage ?? "—"}`,
    `Primary NAICS: ${m.primaryNaics} ${m.primaryNaicsLabel}`,
    m.secondaryNaics.length ? `Other NAICS: ${m.secondaryNaics.join(" · ")}` : "",
    `SAM.gov: ${m.samLine}`,
    m.certifications.length ? `Certifications: ${m.certifications.join(" · ")}` : "",
    ...TRADE.proof(m),
  ]
    .filter(Boolean)
    .join("\n");
}

function contactBody(m: CapFacts): string {
  return [`${m.ownerName}, ${m.ownerTitle}`, m.businessName, m.address, `${m.phone} · ${m.email} · ${m.website}`].join("\n");
}

// A second take on some sections — used by "Regenerate".
function alternates(m: CapFacts): Partial<Record<CapSectionId, string>> {
  return {
    overview: TRADE.alternate(m).join(" "),
    differentiators: m.differentiators.slice(0, 3).map((d) => `• ${d}.`).join("\n"),
    competencies: [m.coreCapabilities.join(" · ") + "."].join("\n"),
  };
}

const WHY_NOTES: Record<CapSectionId, string> = {
  overview:
    "Contracting officers read this first — they want to know who you are and whether you fit, in three lines.",
  competencies:
    "This is what gets you screened in or out. Use the exact phrases buyers search on (NAICS-aligned).",
  differentiators:
    "Answers \"why you over the other 30 bidders.\" Set-aside eligibility and locality are the wedge.",
  past_performance:
    "Proof you've actually done this work. Project name, customer, year, dollar value — that's the format buyers expect.",
  certifications:
    "Codes (UEI, CAGE, NAICS, SAM status) make you findable in federal systems. Missing these reads as \"not ready.\"",
  contact:
    "One human, one phone, one email. If they want to call you, make it one click.",
};

export interface CapStatementOverrides {
  company?: string;
  past_performance?: string;
  bonding?: string;
  certifications?: string;
  differentiators?: string;
  target_work?: string;
}

function initialsOf(name: string): string {
  const words = name.replace(/&/g, " ").split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && w.toUpperCase() !== "LLC");
  return (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
}

export function buildCapStatementDraft(
  m: CapFacts,
  overrides: CapStatementOverrides = {},
): CapStatementDraft {
  // Apply edited source facts back into the relevant section bodies.
  let overviewText = overviewBody(m);
  if (overrides.company) {
    overviewText = overviewText.replace(
      `${m.businessName}`,
      overrides.company.split("·")[0]?.trim() || m.businessName,
    );
  }
  if (overrides.target_work) {
    overviewText += ` Targeting ${overrides.target_work}.`;
  }

  let pastBody = pastPerformanceBody(m);
  if (overrides.past_performance) {
    pastBody = `${overrides.past_performance}\n${pastBody.split("\n").slice(1).join("\n")}`;
  }

  let differentiatorsText = differentiatorsBody(m);
  if (overrides.differentiators) {
    const lines = overrides.differentiators
      .split(/[·\n]/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length) {
      differentiatorsText = lines.map((l) => (l.startsWith("•") ? l : `• ${l}`)).join("\n");
    }
  }
  if (overrides.bonding) {
    differentiatorsText += `\n• ${overrides.bonding}.`;
  }

  let certsText = certificationsBody(m);
  if (overrides.certifications) {
    const extra = overrides.certifications
      .split(/[·\n]/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (extra.length) {
      certsText = `${certsText}\n${extra.join("\n")}`;
    }
  }

  const sections: CapSection[] = [
    { id: "overview", title: "Company overview", whyItMatters: WHY_NOTES.overview, body: overviewText },
    {
      id: "competencies",
      title: "Core competencies",
      whyItMatters: WHY_NOTES.competencies,
      body: competenciesBody(m),
    },
    {
      id: "differentiators",
      title: "Differentiators",
      whyItMatters: WHY_NOTES.differentiators,
      body: differentiatorsText,
    },
    {
      id: "past_performance",
      title: "Past performance",
      whyItMatters: WHY_NOTES.past_performance,
      body: pastBody,
    },
    {
      id: "certifications",
      title: "Certifications & codes",
      whyItMatters: WHY_NOTES.certifications,
      body: certsText,
    },
    { id: "contact", title: "Contact", whyItMatters: WHY_NOTES.contact, body: contactBody(m) },
  ];
  return {
    companyName: m.businessName,
    tagline: tagline(m),
    initials: initialsOf(m.businessName).toUpperCase() || "HC",
    sections,
    codes: {
      uei: m.uei,
      cage: m.cage,
      primaryNaics: `${m.primaryNaics} ${m.primaryNaicsLabel}`,
      samStatus: m.samLine,
    },
  };
}

export function regenerateSection(id: CapSectionId, m: CapFacts): string {
  const alt = alternates(m)[id];
  if (alt) return alt;
  // Fallback: rebuild from scratch.
  switch (id) {
    case "past_performance":
      return pastPerformanceBody(m);
    case "certifications":
      return certificationsBody(m);
    case "contact":
      return contactBody(m);
    case "competencies":
      return competenciesBody(m);
    case "differentiators":
      return differentiatorsBody(m);
    default:
      return overviewBody(m);
  }
}

export function conciseSection(body: string): string {
  // Mock "make more concise" — collapse multi-sentence paragraphs and drop the
  // last bullet if there are more than 3.
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 3 && lines.every((l) => l.startsWith("•") || l.startsWith("-"))) {
    return lines.slice(0, Math.max(3, Math.floor(lines.length * 0.7))).join("\n");
  }
  // Prose: keep first 2 sentences.
  const sentences = body.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 2) {
    return sentences.slice(0, 2).join(" ").trim();
  }
  return body;
}

// ── Small orders — win formatting ──────────────────────────────────────────
//
// PORTED from the micro-purchases prototype. These three are the formatters
// the "Orders you won" page reads.
//
// SCOPE NOTE: the prototype also feeds `federalMicroWinsForBuyer()` into the
// capability statement's past-performance body. That is NOT done here — it
// changes a document this app already ships, which is a wider change than
// porting a surface. The seam is `federalMicroWinsForBuyer()` in
// mock/businessProfile.ts when someone decides to make it.

/**
 * What one win was worth, as a buyer-facing phrase.
 *
 * THREE STATES, NOT TWO. `repeatContract` is `boolean | null` and a reader that
 * tests truthiness renders "the order paper did not say" as the same pixel as
 * "it does not repeat" — the confident, unqualified figure. Live `repeats` is
 * true about 95% of the time and never false, so an unknown is MORE LIKELY THAN
 * NOT a year-long contract whose quantity DLA may never buy: collapsing it into
 * the false branch fails in the one direction this sentence cannot afford, on
 * the one artifact that leaves the product and gets checked against the
 * delivery orders actually placed.
 *
 * The unknown NAMES itself rather than guessing either way. Abstain rather than
 * guess: say what the figure is and what we do not know about it.
 */
export function winValueText(w: PastPerformanceRecord): string | null {
  if (!usablePrice(w.valueUsd)) return null;
  if (w.repeatContract === true) {
    return `${usd(w.valueUsd)} for the first year, if DLA buys the whole estimate`;
  }
  if (w.repeatContract === false) return usd(w.valueUsd);
  return `${usd(w.valueUsd)} — the order paper did not say if it was a year of orders`;
}

/**
 * What the contact on a win actually IS, wherever it is printed.
 *
 * NOT "Reference". `recordWin()` copies `order.buyerContact` — the DLA person
 * printed on the SOLICITATION — and a micro-purchase RFQ is awarded by DIBBS
 * without a human evaluating her quote. That person has no knowledge of her
 * work and cannot vouch for it; calling them her past-performance reference
 * invites a contracting officer to ring a DLA switchboard and be told nobody
 * there has heard of her. They can confirm the ORDER, which is all we may claim.
 */
export const WIN_CONTACT_LABEL = "DLA contact on this order";

/**
 * The delivery marker for one win, wherever it is printed.
 *
 * A past-performance entry is a claim the work was done; `provenance` is the
 * qualifier saying it is her word until an award record confirms it.
 *
 * `null` on a record with no claim to make — an unanswered win, or one she told
 * us she could not deliver. `publishableToBuyer()` already stops both reaching
 * a buyer, so this is a second guard rather than the first.
 */
export function winDeliveryNote(w: PastPerformanceRecord): string | null {
  const delivered =
    w.outcome === "delivered" ? "Delivered" : w.outcome === "late" ? "Delivered late" : null;
  if (delivered == null) return null;
  return w.provenance === "self_reported" ? `${delivered}, self-reported.` : `${delivered}.`;
}
