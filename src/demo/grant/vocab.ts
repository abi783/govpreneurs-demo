// DEMO: the words Grant's generated reviews use for the member's own trade.
//
// The generator, the rail, the page and the sample documents are shared by both
// members. Where a sentence names the member's trade (a kitchen or an office,
// cooks or a team, food cost or media rates), it reads the word from here. The
// values live with each member (src/demo/members/<member>/grant/vocab.ts).

import { byMember } from "../member";
import type { StoryOpportunity } from "../story/opportunities";
import * as agency from "../members/agency/grant/vocab";
import * as caterer from "../members/caterer/grant/vocab";
import type { Domain } from "./domains";
import type { OppFacts } from "./facts";
import type { ClausePatch } from "./solicitation";

export interface GrantVocab {
  /** Where distances are measured from: "your kitchen", "your office". */
  base: string;
  /** What carries the work, mid-sentence: "your kitchen", "your team". */
  crew: string;
  /** "a 5-person kitchen". */
  teamOf: string;
  /** Firms in the same trade: "caterers", "agencies". */
  peers: string;
  /** "federal food service work". */
  bigWork: string;
  /** A site within an hour: what makes it easy. */
  nearRun: string;
  /** A site a long drive away: what it costs. */
  farTrip: string;
  /** "fuel and driver time". */
  travelCost: string;
  /** What a large contract makes you pay for before the first invoice: "you hire and buy food". */
  frontCost: string;
  /** The default "Will you make money?" sentence. */
  priceAdvice: string;
  /** "A win fits your kitchen with the staff you have." */
  fitsWin: string;
  /** "Your kitchen and your 5-person team can run this work." */
  canRun: string;
  /** "your kitchen and your size". */
  fitsYou: string;
  /** The edge against a larger firm: "a close kitchen and a clean record". */
  edge: string;
  /** No-bid roadmap: the cash gap, with one bold phrase. */
  cashLine: string;
  /** No-bid roadmap: what a local partner makes possible. */
  localPartner: string;
  /** No-bid roadmap: why a federal record near home matters. */
  recordWhy: string;
  /** No-bid roadmap: the first match to bid instead. */
  firstMatch: string;
  /** Is the buyer one of the member's target buyers? */
  isTarget(f: OppFacts): boolean;
  /** For work that is not tied to one place (a statewide campaign), the sentence that says so; otherwise null. */
  wide(f: OppFacts): string | null;

  // ── The rail ─────────────────────────────────────────────────────────
  /** "your real food cost". */
  cost: string;
  /** "Your general liability and vehicle insurance are on file, and they meet the notice." */
  insuranceLine: string;
  /** The rail's distance answer, near and far. */
  nearLine: string;
  farLine: string;
  /** How to fix a size limit. */
  sizeFix: string;
  /** A sentence naming the key partner, when it fits this buyer. */
  partnerHint(opp: StoryOpportunity): string;
  /** Grant's open question when the work is a long drive away, and what an answer changes. */
  localQuestion: {
    question(place: string): string;
    payoff: string;
    yes: { gist: string; ack: string };
    no: { gist: string; ack: string };
  };
  /** What an answer to one of the trade's own open questions changes, by question id. */
  reactions: Record<string, { yes: { gist: string; ack: string }; no: { gist: string; ack: string } }>;

  // ── The page ─────────────────────────────────────────────────────────
  /** Eligibility lines that belong to the trade (permits, certificates, insurance). */
  eligibility(d: Domain): string[];
  /** The checklist line for gathering papers. */
  collect: string;
  /** What a quote encloses besides the price and the plan: "the certificates and references". */
  attachments: string;
  /** The page's risk line for a long drive. */
  travelRisk: string;

  // ── The sample solicitation and documents ────────────────────────────
  /** NAICS label when the code is not one of the member's: "Food service". */
  trade: string;
  /** Size standard of the member's primary code, or null when the notice should not state a figure. */
  sizeStandard: { long: string; short: string } | null;
  /** The due time the generated clauses print. */
  dueInClauses(opp: StoryOpportunity): string;
  /** Replace generic clause texts. A null removes the clause. */
  clauses(f: OppFacts, offer: string): Record<string, string | null>;
  /** Clauses the trade adds to every solicitation. */
  extraClauses(f: OppFacts): ClausePatch[];
  /** The wage determination's sample rows, header first. */
  wageRows: string[][];
}

export const V: GrantVocab = byMember<GrantVocab>({ agency: agency.VOCAB, caterer: caterer.VOCAB });
