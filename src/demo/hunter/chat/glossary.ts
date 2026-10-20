// DEMO (Hunter chat): plain-English answers to "what is a ...?" questions.
// Each answer ends with what the term means for the member, from the story and
// the member's own words (src/demo/members/<member>/hunter/vocab.ts).

import { money } from "../../../lib/money";
import { PAST_PERFORMANCE, PERSONA } from "../../story/persona";
import { andList, HELD, HELD_TITLES, holds, PROGRAMS, SET_ASIDES, SHOW_OWN, WHAT_IS_OWN } from "../../story/setAsides";
import { cap, RANGE_TEXT } from "../facts";
import { allRows, forYouRows, type FeedRow } from "../data";
import { VOCAB } from "../vocab";
import type { Turn } from "./types";

const G = VOCAB.glossary;

interface Definition {
  id: string;
  test: RegExp;
  answer: (rows: FeedRow[]) => Turn;
}

const count = (rows: FeedRow[], fn: (r: FeedRow) => boolean) => rows.filter(fn).length;

const SAM_UNTIL = new Date(`${PERSONA.samActiveUntil}T12:00:00`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export const DEFINITIONS: Definition[] = [
  {
    id: "define-sources-sought",
    test: /sources sought|sources-sought/,
    answer: (rows) => {
      const n = count(rows, (r) => r.o.noticeType === "Sources Sought");
      return {
        reply:
          "A Sources Sought notice is an early notice. The agency asks which businesses could do the work. It is not a bid, and nobody awards a contract from it.\n" +
          "You reply with a short statement about your business. A good reply can put you on the buyer's list before the real bid opens.\n" +
          (n > 0
            ? `You have ${n} on this list now: ${G.sourcesSought}`
            : "None is on this list right now."),
        chips: ["Show only Sources Sought", "What's new this week?"],
      };
    },
  },
  {
    id: "define-wosb",
    test: /\bwosb\b|woman owned|women owned|woman-owned|women-owned/,
    answer: (rows) => {
      const n = count(rows, (r) => r.setAside === "WOSB");
      return {
        reply:
          "A WOSB set-aside is a contract that only woman-owned small businesses can compete for. WOSB means Women-Owned Small Business.\n" +
          (holds("WOSB")
            ? `You are woman-owned and small, and your WOSB status is on file. So you can compete for all ${n} of the WOSB set-asides on this list.\n` +
              "Fewer firms can compete for these, so the field is smaller."
            : `You are not certified as woman-owned, so those set-asides are not for you. Your set-asides are ${HELD_TITLES}.`),
        chips: [SHOW_OWN, "Do I qualify for these set-asides?"],
      };
    },
  },
  {
    id: "define-sdvosb",
    test: /sdvosb|service.disabled|veteran.owned|\bvosb\b/,
    answer: (rows) => ({
      reply:
        "SDVOSB means Service-Disabled Veteran-Owned Small Business. Only firms owned by a veteran with a service-connected disability can compete for these set-asides.\n" +
        (holds("SDVOSBC")
          ? `You are service-disabled veteran-owned, and your SDVOSB status is on file. So you can compete for all ${count(rows, (r) => r.setAside === "SDVOSBC")} of them on this list.`
          : `You are not an SDVOSB, so those set-asides are not for you. Your set-asides are ${HELD_TITLES}.`),
      chips: [holds("SDVOSBC") ? SHOW_OWN : WHAT_IS_OWN, "Do I qualify for these set-asides?"],
    }),
  },
  {
    id: "define-8a-hubzone",
    test: /\b8\s?\(?a\)?\b|hubzone|hub zone|edwosb|native american|tribal/,
    answer: (rows) => {
      const mine = (["8A", "HZC"] as const).filter((c) => holds(c));
      return {
        reply: mine.length
          ? "8(a), HUBZone and tribal set-asides are programs for certain kinds of owners. 8(a) is for owners who face a social or economic disadvantage. HUBZone is for firms based in a designated area.\n" +
            `${cap(andList(mine.map((c) => SET_ASIDES[c].youAre)))}, so you can compete for the ${count(rows, (r) => (mine as string[]).includes(r.setAside))} on this list. Your set-asides are ${HELD_TITLES}.`
          : "8(a), HUBZone and tribal set-asides are programs for other kinds of owners. 8(a) is for owners who face a social or economic disadvantage. HUBZone is for firms based in a designated area.\n" +
            `You do not hold those, so I do not rank them for you. You qualify for ${HELD_TITLES}.`,
        chips: ["Do I qualify for these set-asides?", SHOW_OWN],
      };
    },
  },
  {
    id: "define-small-business-set-aside",
    test: /small business set.?aside|total small|\bsba\b/,
    answer: (rows) => {
      const n = count(rows, (r) => r.setAside === "SBA");
      return {
        reply:
          "A small business set-aside is a contract that only small businesses can compete for. The size limit depends on your NAICS code.\n" +
          `You are a small business. ${n} opportunit${n === 1 ? "y" : "ies"} on this list carry that label.`,
        chips: ["Do I qualify for these set-asides?", SHOW_OWN],
      };
    },
  },
  {
    id: "define-set-aside",
    test: /set.?aside/,
    answer: (rows) => {
      const n = (c: string) => count(rows, (r) => r.setAside === c);
      const open = count(rows, (r) => !r.setAside);
      // Her own programs first, plain small business last; then the ones she does not hold.
      const mine = [...HELD.filter((c) => c !== "SBA"), ...HELD.filter((c) => c === "SBA")];
      const notHers = PROGRAMS.filter((c) => !holds(c) && n(c) > 0);
      const parts = [...mine, ...notHers].map((c) => `${n(c)} ${SET_ASIDES[c].counted}`).join(", ");
      const qualify = notHers.length
        ? `You qualify for all but the ${andList(notHers.map((c) => SET_ASIDES[c].counted))}.`
        : mine.length === 1
          ? `You qualify for the ${SET_ASIDES[mine[0]!].counted} ones.`
          : `You qualify for the first ${["", "one", "two", "three", "four"][mine.length]}.`;
      return {
        reply:
          "A set-aside is a contract that the buyer keeps for one kind of business, such as small businesses or woman-owned firms. Other firms cannot compete for it.\n" +
          `On this list: ${parts}, and ${open} open to every business. ${qualify}`,
        chips: [WHAT_IS_OWN, SHOW_OWN],
      };
    },
  },
  {
    id: "define-naics",
    test: /\bnaics\b|industry code|business code/,
    answer: () => ({
      reply:
        "A NAICS code is a six-digit number that names the kind of work a business does. Every notice carries one, so I can compare it with yours.\n" +
        `Your main code is ${PERSONA.primaryNaics}, ${PERSONA.primaryNaicsLabel}. You also hold ${PERSONA.secondaryNaics
          .map((n) => `${n.code} (${n.label})`)
          .join(", ")}.`,
      chips: ["How do you pick my matches?", `Show me ${PERSONA.primaryNaicsLabel} work in NC`],
    }),
  },
  {
    id: "define-psc",
    test: /\bpsc\b|product service code|product and service code/,
    answer: () => ({
      reply:
        "A PSC is a Product and Service Code. It names what the government buys. NAICS names what you do; PSC names what the buyer wants.\n" +
        G.psc,
      chips: ["What is a NAICS code?", "How do you pick my matches?"],
    }),
  },
  {
    id: "define-rfq",
    test: /\brfq\b|request for quote/,
    answer: (rows) => {
      const n = count(rows, (r) => r.o.noticeType === "Request for Quote");
      return {
        reply:
          "An RFQ is a Request for Quote. The buyer asks for a price. It is usually quicker and simpler than a full proposal.\n" +
          `${n} opportunit${n === 1 ? "y" : "ies"} on this list ${n === 1 ? "is an RFQ" : "are RFQs"}.${G.rfqExample}`,
        chips: ["Show only RFQs", "What is an RFP?"],
      };
    },
  },
  {
    id: "define-rfp",
    test: /\brfp\b|request for proposal/,
    answer: (rows) => {
      const n = count(rows, (r) => r.o.noticeType === "Request for Proposal");
      return {
        reply:
          "An RFP is a Request for Proposal. The buyer asks for a written plan and a price. It takes more work than a quote, and the buyer scores the plan, not only the price.\n" +
          `${n} opportunit${n === 1 ? "y" : "ies"} on this list ${n === 1 ? "is an RFP" : "are RFPs"}.`,
        chips: ["Show only RFPs", "What is an RFQ?"],
      };
    },
  },
  {
    id: "define-ifb",
    test: /\bifb\b|invitation for bid|sealed bid/,
    answer: () => ({
      reply:
        "An IFB is an Invitation for Bid. You send one sealed price. The lowest price from a qualified firm wins the award, and there is no written plan to score.",
      chips: ["What is an RFQ?", "What is an RFP?"],
    }),
  },
  {
    id: "define-tiers",
    test: /\b(priority|strong|stretch|low)\b.*\b(tier|mean|means|label)\b|\btiers?\b|what.*\bstretch\b/,
    answer: (rows) => {
      const by = (t: string) => count(rows, (r) => r.o.hunter.tier === t);
      return {
        reply:
          "I sort every match into four tiers. Priority is the best fit. Strong is a good fit. Stretch has one gap, such as size, distance or a missing requirement. Low is a weak fit.\n" +
          `On this list: ${by("priority")} Priority, ${by("strong")} Strong, ${by("stretch")} Stretch, ${by("low")} Low. A tier says how well it fits you. It does not say you will win.`,
        chips: ["How do you pick my matches?", "What's out there for me right now?"],
      };
    },
  },
  {
    id: "define-sam",
    test: /\bsam\b|sam\.gov|registration/,
    answer: () => ({
      reply:
        "SAM.gov is the government's vendor registry. You must be registered there to be paid on a federal contract.\n" +
        `Your registration is active until ${SAM_UNTIL}. Your UEI is ${PERSONA.uei} and your CAGE code is ${PERSONA.cage}.`,
      chips: ["What do you know about my business?", "Which of these am I actually ready for?"],
    }),
  },
  {
    id: "define-capability-statement",
    test: /capability statement/,
    answer: () => ({
      reply:
        "A capability statement is a one-page summary of what your business does and who you have served. Buyers read it to decide who to call.\n" +
        "Yours is on file. I read it, with your past jobs, when I rank your matches.",
      chips: ["What do you know about my business?", "How do you pick my matches?"],
    }),
  },
  {
    id: "define-past-performance",
    test: /past performance|references?\b/,
    answer: () => ({
      reply:
        "Past performance is the list of jobs you finished. Buyers use it to judge whether you can do the work.\n" +
        `You have ${PAST_PERFORMANCE.length} on file: ${PAST_PERFORMANCE.map(
          (p) => `${p.projectTitle} (${money(p.totalValue)})`,
        ).join("; ")}.`,
      chips: ["What do you know about my business?", "How do you pick my matches?"],
    }),
  },
  {
    id: "define-incumbent",
    test: /incumbent|recompete|re-compete/,
    answer: () => ({
      reply:
        "The incumbent is the firm that holds the job now. A recompete is when the buyer opens that job to new offers.\n" +
        G.incumbent.line,
      chips: G.incumbent.chips,
    }),
  },
  {
    id: "define-prime-sub",
    test: /\bprime\b|\bsub\b|subcontract|teaming|team up|team bid/,
    answer: () => ({
      reply:
        "A prime holds the contract with the government. A sub does part of the work for the prime and is paid by the prime.\n" +
        G.primeSub.line,
      chips: G.primeSub.chips,
    }),
  },
  {
    id: "define-bond",
    test: /\bbond\b|bonding|surety/,
    answer: () => ({
      reply:
        "A bond is a promise from an insurer to pay the buyer if you do not finish the job. Some large jobs require one.\n" +
        G.bond.line,
      chips: G.bond.chips,
    }),
  },
  {
    id: "define-clearance",
    test: /clearance|secret clearance/,
    answer: () => ({
      reply:
        "A security clearance is a government check that lets a person work on a restricted site. It takes months, and the buyer often will not pay for it.\n" +
        G.clearance.line,
      chips: G.clearance.chips,
    }),
  },
  {
    id: "define-idiq",
    test: /\bidiq\b|indefinite delivery|task order/,
    answer: () => ({
      reply:
        "An IDIQ is an Indefinite Delivery, Indefinite Quantity contract. The buyer signs one contract, then orders work in pieces over several years.\n" +
        "The ceiling can be large, but the buyer does not promise how much it will order.",
      chips: ["What is a prime and a sub?", "How do you pick my matches?"],
    }),
  },
  {
    id: "define-range",
    test: /target (range|size)|my range|contract size/,
    answer: () => ({
      reply:
        `Your target contract size is ${RANGE_TEXT}. That is a business-profile setting, built from your yearly revenue of about ${money(PERSONA.annualRevenue)} and your biggest jobs so far.\n` +
        "I mark a job above that range as a stretch, because it may need a team or a bond.",
      chips: ["Show jobs in my size range", "What do you know about my business?"],
    }),
  },
];

/** The first definition whose words fit the question. */
export function findDefinition(norm: string): Definition | undefined {
  // The question must ask "what is", "what's", "explain" or "mean".
  const asks = /\b(what|whats|explain|define|meaning|mean|means|tell me about|describe)\b/.test(
    norm,
  );
  if (!asks) return undefined;
  return DEFINITIONS.find((d) => d.test.test(norm));
}

/** Used by tests: the rows each definition counts over. */
export function definitionRows(tab: "for_you" | "all"): FeedRow[] {
  return tab === "for_you" ? forYouRows() : allRows();
}
