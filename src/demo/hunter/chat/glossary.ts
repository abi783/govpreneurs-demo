// DEMO (Hunter chat): plain-English answers to "what is a ...?" questions.
// Each answer ends with what the term means for Amira, from the story.

import { money } from "../../../lib/money";
import { KEY_PARTNER, PAST_PERFORMANCE, PERSONA } from "../../story/persona";
import { allRows, forYouRows, type FeedRow } from "../data";
import { RANGE_TEXT } from "../facts";
import type { Turn } from "./types";

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
            ? `You have ${n} on this list now: Fort Bragg asks which small caterers could run its dining program.`
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
          `You are woman-owned and small, and your WOSB status is on file. So you can compete for all ${n} of the WOSB set-asides on this list.\n` +
          "Fewer firms can compete for these, so the field is smaller.",
        chips: ["Show only woman-owned set-asides", "Do I qualify for these set-asides?"],
      };
    },
  },
  {
    id: "define-sdvosb",
    test: /sdvosb|service.disabled|veteran.owned|\bvosb\b/,
    answer: () => ({
      reply:
        "SDVOSB means Service-Disabled Veteran-Owned Small Business. Only firms owned by a veteran with a service-connected disability can compete for these set-asides.\n" +
        "You are not an SDVOSB, so those set-asides are not for you. Your set-asides are Small Business and Woman-Owned (WOSB).",
      chips: ["What is a WOSB set-aside?", "Do I qualify for these set-asides?"],
    }),
  },
  {
    id: "define-8a-hubzone",
    test: /\b8\s?\(?a\)?\b|hubzone|hub zone|edwosb|native american|tribal/,
    answer: () => ({
      reply:
        "8(a), HUBZone and tribal set-asides are programs for other kinds of owners. 8(a) is for owners who face a social or economic disadvantage. HUBZone is for firms based in a designated area.\n" +
        "You do not hold those, so I do not rank them for you. You qualify for Small Business and Woman-Owned (WOSB).",
      chips: ["Do I qualify for these set-asides?", "Show only woman-owned set-asides"],
    }),
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
        chips: ["Do I qualify for these set-asides?", "Show only woman-owned set-asides"],
      };
    },
  },
  {
    id: "define-set-aside",
    test: /set.?aside/,
    answer: (rows) => {
      const wosb = count(rows, (r) => r.setAside === "WOSB");
      const sba = count(rows, (r) => r.setAside === "SBA");
      const open = count(rows, (r) => !r.setAside);
      return {
        reply:
          "A set-aside is a contract that the buyer keeps for one kind of business, such as small businesses or woman-owned firms. Other firms cannot compete for it.\n" +
          `On this list: ${wosb} woman-owned (WOSB), ${sba} small business, and ${open} open to every business. You qualify for the first two.`,
        chips: ["What is a WOSB set-aside?", "Show only woman-owned set-asides"],
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
      chips: ["How do you pick my matches?", "Show me Food Service Contractors work in NC"],
    }),
  },
  {
    id: "define-psc",
    test: /\bpsc\b|product service code|product and service code/,
    answer: () => ({
      reply:
        "A PSC is a Product and Service Code. It names what the government buys. NAICS names what you do; PSC names what the buyer wants.\n" +
        "Food service work often uses S203, Housekeeping - Food.",
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
          `${n} opportunit${n === 1 ? "y" : "ies"} on this list ${n === 1 ? "is an RFQ" : "are RFQs"}. The Camp Mackall field meals job is one.`,
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
        `${KEY_PARTNER.name} is the incumbent for Fort Bragg dining. It has held the contract since 2019 and is looking for woman-owned subcontractors for the recompete. Grant can tell you what that means for you.`,
      chips: ["Why does the Run two Fort Bragg dining halls match me?", "What is a prime and a sub?"],
    }),
  },
  {
    id: "define-prime-sub",
    test: /\bprime\b|\bsub\b|subcontract|teaming|team up|team bid/,
    answer: () => ({
      reply:
        "A prime holds the contract with the government. A sub does part of the work for the prime and is paid by the prime.\n" +
        "On a job that is too big to hold alone, a small firm can team up as a sub. That is how you worked on Fort Bragg dining halls with Carolina Dining Group.",
      chips: ["Why does the Run two Fort Bragg dining halls match me?", "What is a recompete?"],
    }),
  },
  {
    id: "define-bond",
    test: /\bbond\b|bonding|surety/,
    answer: () => ({
      reply:
        "A bond is a promise from an insurer to pay the buyer if you do not finish the job. Some large jobs require one.\n" +
        `Your largest bond so far is ${money(PERSONA.largestBond)}. The Fort Bragg dining halls need a bond of 100% of the yearly price, which is about $2M.`,
      chips: ["Am I ready to bid the Run two Fort Bragg dining halls?", "What is a prime and a sub?"],
    }),
  },
  {
    id: "define-clearance",
    test: /clearance|secret clearance/,
    answer: () => ({
      reply:
        "A security clearance is a government check that lets a person work on a restricted site. It takes months, and the buyer often will not pay for it.\n" +
        "Your team holds no clearances. So I mark any job that needs them, such as the restricted Camp Mackall site.",
      chips: ["Am I ready to bid the Dining support at a restricted Camp Mackall site?", "What's out there for me right now?"],
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
  const asks = /\b(what|whats|explain|define|meaning|mean|means|tell me about|describe)\b/.test(norm);
  if (!asks) return undefined;
  return DEFINITIONS.find((d) => d.test.test(norm));
}

/** Used by tests: the rows each definition counts over. */
export function definitionRows(tab: "for_you" | "all"): FeedRow[] {
  return tab === "for_you" ? forYouRows() : allRows();
}
