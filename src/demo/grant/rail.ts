// DEMO: what Grant says in the rail.
//
// The replies are scripted, not generated. For a hand-written review the story's
// `railAnswers` answer the chips and the likely typed questions. For every other
// opportunity a short answer is built from that opportunity's facts. Text that
// matches nothing gets a short reply that points at the questions Grant can answer.

import { FOR_YOU, getOpportunity } from "@/demo/story/opportunities";
import { getGrantBrief } from "@/demo/story/grantBriefs";
import { PERSONA } from "@/demo/story/persona";
import { OWN, SET_ASIDES } from "@/demo/story/setAsides";
import type { GrantAnalysis, Pin } from "@/lib/grant/types";
import type { RailReply } from "@/lib/grant/rail";
import { acknowledge, findOpenQuestion } from "./answers";
import { baseAnalysis, buildAnalysis } from "./analysis";
import { domainFor, offerWord } from "./domains";
import { cap, COOKS, driveText, factsFor, shareWords, UNCERTIFIED, usd, usdAbout, type OppFacts } from "./facts";
import { AUTHORED_BRIEFS } from "./heroBriefs";
import { localize } from "./encode";
import { plain } from "./rich";
import { addRailMessages, getRail, getSkips, setAnswer } from "./state";
import { V } from "./vocab";

const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9$% ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type Topic =
  | "mentor"
  | "draft"
  | "fix"
  | "weak"
  | "win"
  | "time"
  | "money"
  | "bond"
  | "team"
  | "bid"
  | "range"
  | "instead"
  | "distance"
  | "size"
  | "setaside"
  | "clearance"
  | "hello"
  | "identity"
  | "offscope";

const TOPICS: { topic: Topic; test: RegExp }[] = [
  { topic: "offscope", test: /\b(weather|joke|poem|recipe|sports?|stocks?|president|capital of|lottery|movie|song|horoscope)\b/ },
  { topic: "identity", test: /\b(who are you|what are you|what can you do|your name|are you (an )?(ai|bot|human|real))\b/ },
  { topic: "hello", test: /^(hi|hello|hey|thanks|thank you|ok|okay|great|cool|good)\b/ },
  { topic: "mentor", test: /\b(mentor|sarah|second opinion|talk to (a )?(person|human)|schedule a call)\b/ },
  { topic: "draft", test: /\b(write|draft|compose|response say|proposal say|quote say|reply say|bid say|cover letter|what should (i|my|the) (send|say|include|put))\b/ },
  { topic: "fix", test: /\b(fix|solve|close the gap|get certified|how do i (get|fix))\b/ },
  { topic: "weak", test: /\b(weak|weakness|risk|risks|worry|worried|problem|concern|gap|gaps|wrong|hole|bad)\b/ },
  { topic: "win", test: /\b(win(ning|s|ner)?\b|chance|odds|beat|compet|likely|incumbent|who (else|is) bid|who bids)/ },
  { topic: "time", test: /\b(time|deadline|due|late|how many days|how long|schedule|when)\b/ },
  { topic: "bond", test: /\b(bond|surety|insurance|insured)\b/ },
  { topic: "money", test: /\b(price|pricing|cost|costs|margin|profit|profitable|money|paid|pay|rate|rates|wage|wages|worth it)\b/ },
  { topic: "team", test: /\b(team|teaming|partner|partners|subcontract|sub|prime|primes)\b/ },
  { topic: "range", test: /\b(in range|put me|position|next time|improve|get ready|prepare)\b/ },
  { topic: "instead", test: /\b(instead|else|better one|other (bid|opportunit)|alternative)\b/ },
  { topic: "bid", test: /\b(why not bid|should i bid|bid or|no bid|no-bid|pass on|skip)\b/ },
  { topic: "distance", test: /\b(far|drive|driving|distance|miles|travel|location|where)\b/ },
  { topic: "size", test: /\b(size|big|large|capacity|staff|crew|too much)\b/ },
  { topic: "setaside", test: /\b(set aside|set-aside|wosb|woman|women|eligible|eligibility|qualify|small business)\b/ },
  { topic: "clearance", test: /\b(clearance|cleared|secret|security)\b/ },
];

function topicOf(message: string): Topic | null {
  const n = norm(message);
  for (const { topic, test } of TOPICS) if (test.test(n)) return topic;
  return null;
}

/** The brief's own answer keys that stand for a topic. */
const BRIEF_KEYS: Partial<Record<Topic, string[]>> = {
  win: ["Can I win it?"],
  time: ["Do I have enough time?"],
  weak: ["Where am I weak?"],
  fix: ["Can I fix this in time?"],
  draft: ["What should my response say?", "What should my reply say?"],
  bid: ["Why not bid?", "Why not as prime?"],
  range: ["What would put me in range?"],
  instead: ["What should I bid instead?"],
  team: ["How do I team with them?"],
  clearance: ["Why can't I get cleared in time?"],
};

function briefAnswers(id: string): Record<string, string> {
  return (getGrantBrief(id)?.railAnswers ?? AUTHORED_BRIEFS[id]?.railAnswers) ?? {};
}

function readSources(a: GrantAnalysis, name: string): Pin[] {
  return (a.reads.find((r) => r.name === name)?.evidence ?? []).slice(0, 2);
}

const TOPIC_READ: Partial<Record<Topic, string>> = {
  win: "Can you win it?",
  time: "Can you do the work?",
  weak: "Can you do the work?",
  fix: "Can you do the work?",
  money: "Will you make money?",
  bond: "Can you survive winning?",
  team: "Can you win it?",
  distance: "Can you perform there?",
  size: "Does the size fit?",
  setaside: "Can you win it?",
  clearance: "Can you do the work?",
  draft: "Do you understand the buyer's intent?",
};

// ── Answers built from the facts ─────────────────────────────────────────

function leadWith(f: OppFacts): string {
  const d = domainFor(f.opp);
  if (d.leadWith) return d.leadWith;
  switch (d.key) {
    case "field":
    case "boxed":
      return "your delivery plan: two vans and an early start";
    case "events":
      return "your event menus and a staffing plan for the largest event";
    case "school":
      return "your USDA meal-pattern record from the county summer program";
    case "hospital":
      return "your therapeutic diet process and your Womack record";
    case "dining":
      return "your Fort Bragg subcontract and your food-safety plan";
    case "cafe":
      return "your daily service record and a sample weekly menu";
    case "detention":
    case "senior":
      return "a reliable delivery plan and a clear price";
    default:
      return "your closest past job";
  }
}

function runwayOf(a: GrantAnalysis, f: OppFacts): { lead: number; runway: number } {
  const i = a.realDeadlineInputs;
  const lead = i.bondingLeadDays + i.ppqTurnaroundDays + i.subQuoteDays + i.writingDays;
  return { lead, runway: f.daysLeft - lead };
}

function mainLimit(a: GrantAnalysis): string {
  const w = a.verdict.warnings?.[0];
  return w ? plain(w.summary) : "Nothing stops this one.";
}

function genericAnswer(topic: Topic, f: OppFacts, a: GrantAnalysis): string {
  const opp = f.opp;
  const d = domainFor(opp);
  const offer = offerWord(opp);
  const verdict = a.verdict.value;
  const readOf = (name: string): string => plain(a.reads.find((r) => r.name === name)?.sentence ?? []);
  const issue = a.verdict.warnings?.[0];
  switch (topic) {
    case "win":
      return `No one can promise a win. ${readOf("Can you win it?")} ${a.verdict.competitiveRisk ? `Your main competition: ${plain(a.verdict.competitiveRisk)}.` : ""}`.trim();
    case "time": {
      const { lead, runway } = runwayOf(a, f);
      return `The ${offer} is due in ${f.daysLeft} days. After ${lead} days for references, writing and quotes, you have about ${Math.max(runway, 0)} ${runway === 1 ? "day" : "days"}. ${runway <= 7 ? "That is tight." : "That is enough if you start now."}${UNCERTIFIED > 0 && d.personnel.length > 0 && /certificate/i.test(plain(a.verdict.warnings?.map((w) => w.summary).flat() ?? [])) ? ` The item with a lead time is the food-handler certificates for your last ${UNCERTIFIED} cooks.` : ""}`;
    }
    case "weak":
      return `${mainLimit(a)} ${a.verdict.warnings?.[1] ? plain(a.verdict.warnings[1].summary) : ""}`.trim();
    case "fix": {
      const text = plain(a.verdict.warnings?.map((w) => w.summary).flat() ?? []);
      if (/certificate/i.test(text))
        return `Yes. A food-handler course takes one day, and the exam is the same day. Book your last ${UNCERTIFIED} cooks now, then upload the certificates to My Business.`;
      if (/Distance/.test(text) || (f.miles > 60 && !V.wide(f)))
        return `Not by yourself: distance is a fact. A partner or a crew near ${f.place.city} can change it. Open Partners to see who looks for subcontractors.`;
      if (/Size|bond/i.test(text)) return V.sizeFix;
      return `Most of it, yes. Start with the item that has the longest lead time, and ask Sarah to look at the draft before you send it.`;
    }
    case "draft":
      return verdict === "bid"
        ? `Ava drafts the ${offer}. Open it with the button on this page. Lead with ${leadWith(f)}, then your past performance, then your price.`
        : `I would not start a draft yet. ${verdict === "review" ? "Settle the open question first." : "This one is not worth your time."} If you do go ahead, lead with ${leadWith(f)}.`;
    case "money":
      return `${readOf("Will you make money?")} ${f.annual !== null ? `At about ${usdAbout(f.annual)} a year, check each line of the price form against ${V.cost}.` : ""}`.trim();
    case "bond":
      return PERSONA.bondLine && a.complianceMatrix.some((r) => r.category === "bonding")
        ? plain(a.reads.find((r) => r.name === "Can you survive winning?")?.sentence ?? [])
        : a.complianceMatrix.some((r) => r.category === "bonding")
        ? `The notice asks for a bond near the annual price, about ${usd(f.annual ?? 0)}. Your largest bond is ${usd(PERSONA.largestBond)}. A surety needs weeks to approve a larger line, so this is a limit for you today.`
        : V.insuranceLine;
    case "team":
      return `Teaming is worth a call. ${V.partnerHint(opp)}Open Partners to see primes that look for subcontractors, and ask for their quote deadline. A prime usually needs your quote about a week before the due date.`;
    case "bid":
      return opp.grant.oneLine;
    case "range": {
      const items = (a.postNoBidRoadmap ?? []).map((r) => plain(r.item));
      return items.length > 0
        ? `Three things, in order: ${items.map((s, i) => `${i + 1}. ${s}`).join("; ")}. The list is also on this page, under the call.`
        : `Win a smaller job near home first, then look again. A federal record is the thing that moves you up.`;
    }
    case "instead": {
      const better = FOR_YOU.find((o) => o.id !== opp.id && o.grant.verdict === "bid" && o.grant.prime === "go");
      return better
        ? `${better.plainTitle}. ${better.grant.oneLine} Find it in Hunter, or open it from your saved list.`
        : "Open Hunter and pick a match that Grant calls Bid.";
    }
    case "distance":
      return V.wide(f) ?? `${f.placeText} is ${f.miles} miles from ${V.base}, ${driveText(f.miles)} each way. ${f.miles > 60 ? V.farLine : V.nearLine}`;
    case "size":
      return f.annual !== null
        ? `About ${usdAbout(f.annual)} a year. That is ${shareWords(f.share ?? 0)}. ${cap(V.crew)} ${(f.share ?? 0) >= 0.95 ? "would need more staff and more cash." : "can carry it."}`
        : "The notice states no value, so I cannot size it.";
    case "setaside":
      if (f.setAside && !f.eligibleSetAside)
        return `This is a ${f.setAsideLabel}. You are not eligible for it, so you would join as a subcontractor to a firm that is.`;
      return f.setAside
        ? `This is a ${f.setAsideLabel.toLowerCase()}. You are eligible: you are a small business${OWN !== "SBA" ? `, and your ${SET_ASIDES[OWN].short} certification is active` : ""}.`
        : "There is no set-aside. Any qualified firm can bid, so you compete with larger firms.";
    case "clearance":
      return opp.clearanceRequired
        ? `${opp.clearanceRequired} None of your ${COOKS} staff holds one.`
        : `No clearance is needed for this one.`;
    case "mentor":
      return `Sarah can read this with you. A review costs $97 from your wallet, and she replies in your Mentors inbox.`;
    default:
      return mainLimit(a);
  }
}

function summaryLine(f: OppFacts, a: GrantAnalysis): string {
  const word = a.verdict.value === "bid" ? "Bid" : a.verdict.value === "review" ? "Needs review" : "No-bid";
  return `My call is ${word}. ${f.opp.grant.oneLine}`;
}

// ── The reply ────────────────────────────────────────────────────────────

export function railReply(oppKey: string, message: string, openQuestion?: string): RailReply {
  const opp = getOpportunity(oppKey);
  const base = baseAnalysis(oppKey);
  if (!opp || !base) {
    return { kind: "pending", reply: "I have not analyzed this one yet. Ask me again in a moment." };
  }
  const f = factsFor(opp);
  const text = message.trim();
  const now = () => new Date().toISOString();

  // An answer to one of Grant's questions.
  if (openQuestion) {
    const current = buildAnalysis(oppKey) ?? base;
    const q = findOpenQuestion(current, openQuestion);
    if (q) {
      setAnswer(oppKey, q.id, text);
      const ack = acknowledge(q, text);
      const reply: RailReply = { kind: "supply", reply: ack.reply, fact: ack.fact };
      addRailMessages(oppKey, [
        { role: "user", text, at: now() },
        { role: "grant", text: reply.reply, at: now() },
      ]);
      return reply;
    }
  }

  const a = buildAnalysis(oppKey) ?? base;
  const answers = briefAnswers(oppKey);
  const byKey = new Map(Object.entries(answers).map(([k, v]) => [norm(k), v]));
  let kind: RailReply["kind"] = "interrogate";
  let reply: string | null = null;
  let cta: RailReply["cta"];
  let topic: Topic | null = topicOf(text);

  // 1 · The brief's own answer to the exact chip or question.
  reply = byKey.get(norm(text)) ?? null;
  // 2 · The brief's answer to a question on the same topic.
  if (!reply && topic) {
    for (const key of BRIEF_KEYS[topic] ?? []) {
      const hit = byKey.get(norm(key));
      if (hit) {
        reply = hit;
        break;
      }
    }
  }
  // 3 · An answer built from the facts.
  if (!reply && topic) {
    if (topic === "offscope") {
      kind = "offscope";
      reply = "I can only help with this opportunity. Ask me about the call, the size, the distance, the price, the time, or who could help.";
    } else if (topic === "identity") {
      reply = `I am Grant. I read one opportunity from start to end and tell you to bid, look closer, or pass. I do not know who else is bidding, and I do not decide for you. Sarah can read my take with you.`;
    } else if (topic === "hello") {
      reply = `${summaryLine(f, a)} Ask me anything about it.`;
    } else if (topic === "draft") {
      kind = "draft_request";
      reply = genericAnswer(topic, f, a);
    } else {
      reply = genericAnswer(topic, f, a);
      if (topic === "mentor") cta = "mentor";
    }
  }
  // 4 · Nothing matched: say what Grant can answer.
  if (!reply) {
    reply = `${summaryLine(f, a)} I can answer these: ${a.rail.suggestedChips
      .filter((c) => c.kind === "ask")
      .map((c) => `"${c.label}"`)
      .join(", ")}. I can also speak about price, distance, size, time and who could help.`;
    topic = null;
  }
  reply = localize(reply, f);
  if (topic === "draft" && kind === "interrogate") kind = "draft_request";

  const readName = topic ? TOPIC_READ[topic] : undefined;
  const sources = readName ? readSources(a, readName) : [];
  const out: RailReply = { kind, reply, sources, ...(cta ? { cta } : {}) };
  addRailMessages(oppKey, [
    { role: "user", text, at: now() },
    { role: "grant", text: reply, at: now() },
  ]);
  return out;
}

export function railSession(oppKey: string): { messages: { role: "user" | "grant"; text: string; at: string }[]; skipped: Record<string, number> } {
  return { messages: getRail(oppKey), skipped: getSkips(oppKey) };
}
