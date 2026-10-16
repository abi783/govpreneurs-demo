// Deterministic cap-statement draft generator. Built from Marcus's seeded
// profile facts — never a blank prompt, never fabricated.

import type { CurrentMember } from "./mock/currentMember";
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
  sections: CapSection[];
  codes: {
    uei: string | null;
    cage: string | null;
    primaryNaics: string;
    samStatus: string;
    samVerifiedAt: string | null;
  };
}

const TAGLINE =
  "Commercial roofing & building envelope contractor · SDVOSB-eligible · Fayetteville, NC";

function pastPerformanceBody(m: CurrentMember): string {
  // Seeded NC roofing past performance — matches what the rest of the demo cites.
  const lines = [
    `${m.pastPerformanceCount} completed commercial roofing projects across NC and the Fort Bragg area, with single-contract values up to $890,000.`,
    "• Cumberland County DPW — 24,000 sf TPO re-roof on the County maintenance complex (2024, $612K).",
    "• Fayetteville Regional Airport — modified-bitumen replacement on Hangar 3 (2023, $431K).",
    "• Methodist University — multi-building flat-roof recoat and tear-off program (2023, $328K).",
    "• USACE Wilmington — federal subcontract: barracks moisture remediation at Fort Bragg (2024, sub to KBR, $204K scope).",
  ];
  return lines.join("\n");
}

function overviewBody(m: CurrentMember): string {
  return [
    `${m.businessName} is a ${m.naicsDescription.toLowerCase()} based in ${m.hqCity}, ${m.hqState}, founded and operated by Marcus Williams, a U.S. Army veteran.`,
    `We deliver commercial re-roofing, repair, and building-envelope services to federal, state, and municipal clients across ${m.geographicPreference.states.join(", ")}, with quick mobilization within ${m.geographicPreference.radiusMiles ?? 300} miles of Fayetteville.`,
    `Annual revenue ${m.annualRevenueBand ?? "—"}; ${m.totalEmployeesW2 ?? 3} W-2 employees plus a vetted roster of NC-licensed subcontract crews for surge capacity.`,
  ].join(" ");
}

function competenciesBody(): string {
  return [
    "Commercial re-roofing — tear-off and overlay",
    "Modified-bitumen (mod-bit) systems",
    "TPO and EPDM single-ply membranes",
    "Roof repair, leak diagnosis, and preventive maintenance",
    "Building envelope and weatherproofing",
    "Storm and moisture remediation",
    "Roof asset condition surveys and 5-year capital plans",
  ].join("\n");
}

function differentiatorsBody(): string {
  return [
    "SDVOSB-eligible — service-disabled veteran-owned ownership and control.",
    "Fort Bragg-area focus with established familiarity with USACE Wilmington and Savannah district requirements.",
    "15+ years of hands-on commercial roofing experience under one continuous owner-operator.",
    "Rapid mobilization within a 300-mile radius of Fayetteville, NC.",
    "Bonded and insured, with single-contract bonding capacity to ~$890K.",
  ].join("\n");
}

function certificationsBody(m: CurrentMember): string {
  const samDate = m.samVerifiedAt ?? "—";
  return [
    `UEI: ${m.uei ?? "—"}`,
    `CAGE: ${m.cage ?? "—"}`,
    `Primary NAICS: ${m.primaryNaics} — ${m.naicsDescription}`,
    `Secondary NAICS: ${m.secondaryNaics.join("; ")}`,
    `SAM.gov: ${m.samStatus} (verified ${samDate})`,
    "NC General Contractor license — active",
    "SDVOSB-eligible (pending VetCert filing)",
  ].join("\n");
}

function contactBody(m: CurrentMember): string {
  return [
    `${m.ownerName}, Owner`,
    `${m.businessName}`,
    `${m.hqCity}, ${m.hqState}`,
    "(910) 555-0148 · marcus@williams-construction.com",
  ].join("\n");
}

// Section #2 of each — slightly more concise / different framing for "Regenerate".
const ALTERNATES: Partial<Record<CapSectionId, string>> = {
  overview: [
    "Williams Construction LLC is a service-disabled veteran-owned roofing contractor headquartered in Fayetteville, NC. We focus on commercial re-roofing, repair, and building-envelope work for federal and municipal clients in the Fort Bragg corridor and across the Carolinas, Virginia, and Georgia.",
    "Our small, owner-operated structure means contracting officers get a single point of accountability from kickoff through closeout.",
  ].join(" "),
  differentiators: [
    "• SDVOSB-eligible.",
    "• Fort Bragg / USACE Wilmington familiarity.",
    "• 15+ years owner-operated commercial roofing experience.",
    "• 300-mile rapid-mobilization radius from Fayetteville.",
    "• Bonded to ~$890K per contract.",
  ].join("\n"),
  competencies: [
    "Re-roofing · Mod-bit · TPO · EPDM · Repair & PM · Envelope · Storm remediation · Roof asset surveys.",
  ].join("\n"),
};

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

export function buildCapStatementDraft(
  m: CurrentMember,
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

  let differentiatorsText = differentiatorsBody();
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
      certsText = `${certsText}\n${extra.map((l) => l).join("\n")}`;
    }
  }

  const sections: CapSection[] = [
    { id: "overview", title: "Company overview", whyItMatters: WHY_NOTES.overview, body: overviewText },
    {
      id: "competencies",
      title: "Core competencies",
      whyItMatters: WHY_NOTES.competencies,
      body: competenciesBody(),
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
    tagline: TAGLINE,
    sections,
    codes: {
      uei: m.uei,
      cage: m.cage,
      primaryNaics: m.primaryNaics,
      samStatus: m.samStatus,
      samVerifiedAt: m.samVerifiedAt,
    },
  };
}

export function regenerateSection(id: CapSectionId, m: CurrentMember): string {
  if (ALTERNATES[id]) return ALTERNATES[id]!;
  // Fallback: rebuild from scratch.
  switch (id) {
    case "past_performance":
      return pastPerformanceBody(m);
    case "certifications":
      return certificationsBody(m);
    case "contact":
      return contactBody(m);
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
