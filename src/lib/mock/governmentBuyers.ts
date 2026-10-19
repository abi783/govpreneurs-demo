// Government Buyers: the buyer directory for Amira Haddad (food service, Fayetteville NC).
// DEMO: the sample directory was replaced with food service buyers. The types and helpers stay.
// The buyers themselves are in src/demo/explore/buyersData.ts.
// People-first: each buyer has 3 to 6 contacts (contracting officer, small business
// liaison, contract specialist, food program manager). Contact details are sample data.
// Open requests come from the demo story (src/demo/story/opportunities.ts), and awards
// from src/demo/explore/awardsData.ts, so the counts on this page match the
// Opportunities feed and the Awards page.

// DEMO: two members (src/demo/member.ts). The agency's buyers are advertising and
// marketing buyers; `buysFood` and `getFoodAwardsForBuyer` keep their names but mean
// "buys the member's trade".

import { byMember } from "@/demo/member";
import { OPPORTUNITIES } from "@/demo/story/opportunities";
import { PLACES } from "@/demo/story/places";
import { isoDaysFromNow } from "@/demo/story/clock";
import { allAwardRecords } from "@/demo/explore/awardsData";
import type { AwardRecord } from "@/lib/awardsApi";
import { BUYER_SEED } from "@/demo/explore/buyersData";

/** DEMO: the member's trade, in the words the buyer pages use. */
export const TRADE = byMember({
  pack: { label: "Marketing and advertising", phrase: "marketing and advertising" },
  caterer: { label: "Food service", phrase: "food service" },
});

export type BuyerType = "federal" | "sled";

export type OfficerRole =
  | "Contracting Officer"
  | "Small-Business Liaison"
  | "Contract Specialist"
  | "Food Program Manager"
  /** DEMO: the agency's program-side contact (a campaign's owner at the buyer). */
  | "Program Manager";

export interface BuyerOfficer {
  id: string;
  name: string;
  role: OfficerRole;
  email: string; // sample
  phone: string; // sample
  notes?: string;
  recommendedFirstContact?: boolean;
}

export type PursueVerdict = "worth-it" | "maybe" | "not-yet";

export interface BuyerAnalysis {
  verdict: PursueVerdict;
  why: string;
  /** Food service spend for the last 3 complete fiscal years, oldest first. */
  annualSpendByYear: { year: number; trade: number }[];
  smallBizPct: number;
  /** Share that goes to woman-owned small businesses. */
  wosbPct: number;
  seasonalityNote: string;
  spendBreakdown: {
    category: string;
    byYear: { year: number; amount: number }[];
  }[];
  topAwardees: {
    company: string;
    awardsCount: number;
    totalDollars: number;
  }[];
}

export interface GovBuyer {
  id: string;
  /** The number the Buyers API uses for this office. */
  agencyKey: number;
  name: string;
  abbreviation: string | null;
  type: BuyerType;
  location: string;
  distanceMiles: number; // from Fayetteville, NC
  whatTheyBuy: string;
  buysFood: boolean;
  /** Words to find this buyer's open requests in the feed. */
  agencyMatchers: string[];
  /** Short names of this buyer's offices in the award record (awardsData.ts). */
  awardAgencies: string[];
  officers: BuyerOfficer[];
  /** Optional seeded "should I pursue this buyer?" analysis. */
  analysis?: BuyerAnalysis;
}

/** An open request from a buyer, as the buyer panel lists it. */
export interface BuyerOpp {
  noticeId: string;
  title: string;
  location: string;
  /** Null when the buyer states no value (a sources sought notice). */
  valueLow: number | null;
  valueHigh: number | null;
  /** ISO date and time the request closes. */
  closesAt: string;
  closesInDays: number;
}

// ───────────────────────── helpers ─────────────────────────

function matchesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

export function getOpenOppsForBuyer(b: GovBuyer): BuyerOpp[] {
  return OPPORTUNITIES.filter((o) => matchesAny(`${o.agency} ${o.office} ${o.title}`, b.agencyMatchers))
    .sort((x, y) => x.closesInDays - y.closesInDays)
    .map((o) => {
      const place = PLACES[o.place];
      return {
        noticeId: o.id,
        title: o.plainTitle,
        location: `${place.city}, ${place.state}`,
        valueLow: o.valueLow,
        valueHigh: o.valueHigh,
        closesAt: isoDaysFromNow(o.closesInDays, 17),
        closesInDays: o.closesInDays,
      };
    });
}

/** Awards this buyer made for food service work, newest first. */
export function getFoodAwardsForBuyer(b: GovBuyer): AwardRecord[] {
  return allAwardRecords()
    .filter((a) => b.awardAgencies.includes(a.agency.abbrev ?? ""))
    .sort((x, y) => (x.recency.daysSinceAward ?? 0) - (y.recency.daysSinceAward ?? 0));
}

export function searchBuyers(
  list: GovBuyer[],
  q: string,
  near: "nc" | "all",
  buys: "food" | "all",
): GovBuyer[] {
  const lower = q.trim().toLowerCase();
  return list.filter((b) => {
    if (buys === "food" && !b.buysFood) return false;
    if (near === "nc" && !b.location.includes(", NC")) return false;
    if (!lower) return true;
    const hay = `${b.name} ${b.location} ${b.whatTheyBuy} ${b.officers.map((o) => o.name).join(" ")}`;
    return hay.toLowerCase().includes(lower);
  });
}

export function getBuyer(id: string): GovBuyer | undefined {
  return GOV_BUYERS.find((b) => b.id === id);
}

export const VERDICT_LABEL: Record<PursueVerdict, string> = {
  "worth-it": "Worth it",
  maybe: "Maybe",
  "not-yet": "Not yet",
};

export const GOV_BUYERS: GovBuyer[] = BUYER_SEED;
