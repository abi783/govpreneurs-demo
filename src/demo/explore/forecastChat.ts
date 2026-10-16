// Grant's words on the Forecasts pages: the one-line takes on the list cards and
// the scripted answers in the chat on a forecast page. Everything here reads
// the forecast record and Amira's facts, so the numbers are true for her.

import { daysToDay } from "./dates";
import { KEY_PARTNER, PAST_PERFORMANCE, PERSONA } from "@/demo/story/persona";
import type { ForecastRecordDto } from "@/lib/forecastsApi";
import { forecastRecord, FORECAST_MEMBER, scoredRow } from "./forecastData";
import { FORT_BRAGG_FORECAST_KEY, POPE_FORECAST_KEY, SEYMOUR_FORECAST_KEY, CUMBERLAND_SUMMER_KEY } from "./forecastLocalSeeds";

const BIGGEST = FORECAST_MEMBER.biggestPastJob ?? 0;

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

function weeksOrMonths(days: number): string {
  if (days < 14) return "in the next two weeks";
  if (days < 60) return `in about ${Math.round(days / 7)} weeks`;
  const months = Math.round(days / 30.44);
  return months === 1 ? "in about a month" : `in about ${months} months`;
}

/** Days from today to the expected date, or null. */
function expectedDays(r: ForecastRecordDto): number | null {
  return r.dueOn ? daysToDay(r.dueOn) : null;
}

function when(r: ForecastRecordDto): string {
  const d = expectedDays(r);
  return d == null ? "The buyer gives no date" : `The buyer expects to ask for bids ${weeksOrMonths(Math.max(d, 0))}`;
}

/** The longer line on a list card, for the forecasts that matter to the story. */
export function cardTakeLine(oppKey: string): string | null {
  const r = forecastRecord(oppKey);
  if (!r) return null;
  const when_ = expectedDays(r) == null ? "" : ` Expected ${weeksOrMonths(Math.max(expectedDays(r) as number, 0))}.`;
  switch (oppKey) {
    case FORT_BRAGG_FORECAST_KEY:
      return `The follow-on to the Fort Bragg dining contract that ${KEY_PARTNER.name} has held since 2019. At ${money(r.valLow ?? 0)} to ${money(r.valHigh ?? 0)} it is far above your ${money(BIGGEST)} largest job, so plan to team up.${when_}`;
    case POPE_FORECAST_KEY:
      return `Event catering at Pope and Fort Bragg, planned for women-owned firms. You hold that certificate, and it fits your event work and your size.${when_}`;
    case SEYMOUR_FORECAST_KEY:
      return `The next lodging breakfast contract at Seymour Johnson. You lost the last one by about 4% on price, so you know this buyer's number.${when_}`;
    case CUMBERLAND_SUMMER_KEY:
      return `The 2027 summer meals program from the district you fed in 2023: 1,100 meals a day. Your best reference runs this program.${when_}`;
    case "ce493b6f89e41ddc4ff5b2b7923301d9":
      return `Patient meals at the Fayetteville VA, the same therapeutic diets you served at Womack. Planned for small businesses and 3 miles from your kitchen.${when_}`;
    case "047c3c8aa5dc76e7ccacc984bdff9848":
      return `Cooks and servers for two Camp Lejeune dining halls. It is in your food-service code and your size, but about 100 miles from your kitchen.${when_}`;
    case "63bc4374632ee3bee7be3c460d51bdad":
      return `The community college plans a food court and catering in Fayetteville. Only a committee note so far, but it is local and your kind of work.${when_}`;
    default:
      return null;
  }
}

// ── The chat on a forecast page ───────────────────────────────────────────────

const SUGGESTIONS =
  "Try one of these: “When will the bid request come?”, “Can I bid as a woman-owned business?”, “Is it the right size for me?”, “Should I team up?” or “What should I do first?”";

function placeSentence(r: ForecastRecordDto): string {
  const city = r.popCity?.trim();
  const state = r.popState?.trim();
  if (!state && !city) return "The forecast does not name a place yet, so I cannot say how far it is from your kitchen.";
  const where = [city, state].filter(Boolean).join(", ");
  if (state && FORECAST_MEMBER.states.includes(state)) {
    return `The work is in ${where}. ${state} is one of the states you serve (${FORECAST_MEMBER.states.join(", ")}).`;
  }
  return `The work is in ${where}. That is outside the states you serve (${FORECAST_MEMBER.states.join(", ")}), so you would need a local crew or a partner there.`;
}

function sizeSentence(r: ForecastRecordDto): string {
  if (r.valHigh == null && r.valLow == null) return "The buyer has not shared an estimate, so I cannot judge the size yet.";
  const high = r.valHigh ?? r.valLow ?? 0;
  const range = r.valLow && r.valHigh && r.valLow !== r.valHigh ? `${money(r.valLow)} to ${money(r.valHigh)}` : money(high);
  if (high > BIGGEST * 5) {
    return `The buyer's estimate is ${range}. Your largest past job is ${money(BIGGEST)}, so this is far above it. A prime contract is a stretch. A team bid fits better.`;
  }
  if (high < PERSONA.targetValueMin) {
    return `The buyer's estimate is ${range}. That is below the ${money(PERSONA.targetValueMin)} you set as your smallest target.`;
  }
  return `The buyer's estimate is ${range}. Your largest past job is ${money(BIGGEST)}, so this is a size you can carry.`;
}

function whoSentence(r: ForecastRecordDto): string {
  const code = r.setAsideCode?.trim().toUpperCase() ?? "";
  if (code === "WOSB" || code === "WOSBSS") {
    return "The Army plans this for women-owned small businesses. You are certified as woman-owned, so you qualify to bid. Keep your certificate current.";
  }
  if (code === "SBA" || code === "SBP") {
    return "The buyer plans this for small businesses. You are a small business, so you can bid.";
  }
  if (!code || code === "TBD") {
    return "The buyer has not decided who may bid yet. A reply to the buyer's market study can help them choose a set-aside. Your woman-owned certificate would count if they pick that route.";
  }
  return "The record names a program set-aside that I cannot match to your certificates. Check the program rules before you plan a bid.";
}

function samSentence(r: ForecastRecordDto): string {
  const ends = FORECAST_MEMBER.registration.endsOn;
  const d = expectedDays(r);
  const endsInDays = ends ? daysToDay(ends) : null;
  const base = `Your SAM registration is active until ${ends ?? "a date I do not have"}.`;
  if (endsInDays != null && d != null && endsInDays < d + 30) {
    return `${base} The bid request may come after that date, so renew it first.`;
  }
  return `${base} That covers the date the buyer expects, but renew it early so it never lapses during a bid.`;
}

function teamSentence(r: ForecastRecordDto): string {
  if (r.oppKey === FORT_BRAGG_FORECAST_KEY) {
    return `Yes, I would team up. ${KEY_PARTNER.name} (${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}) has held Fort Bragg dining since 2019 and is looking for woman-owned catering subcontractors. You worked for them as a subcontractor in 2024. Open Partners to see their card.`;
  }
  const high = r.valHigh ?? 0;
  if (high > BIGGEST * 5) {
    return "Yes, this is bigger than a job you can prime alone. Look in Partners for a prime that wins work like this and wants a woman-owned subcontractor.";
  }
  return "You do not need a partner for the size of this one. A partner can still help if the buyer asks for more staff than five people.";
}

function firstStep(r: ForecastRecordDto): string {
  const row = scoredRow(r.oppKey);
  const step = row?.scored.firstStep;
  if (step) return `Do this first: ${step.first}`;
  return "Do this first: save the forecast, so you see any change the buyer makes. Then check that your SAM registration covers the date.";
}

export function forecastGrantReply(oppKey: string, message: string): string {
  const r = forecastRecord(oppKey);
  if (!r) return "I cannot find that forecast.";
  const q = message.toLowerCase();
  const has = (re: RegExp) => re.test(q);

  if (has(/\b(when|date|timeline|soon|expect|how long|how far away)\b/)) {
    return `${when(r)}. A forecast is a plan, not a promise, and dates often move. If you track it, you will see any change on this page.`;
  }
  if (has(/\b(who can bid|can i bid|eligible|qualify|set.?aside|woman|women|wosb|small business|certif)/)) {
    return whoSentence(r);
  }
  if (has(/\b(size|big|large|value|worth|price|cost|how much|budget|estimate|right size)\b/)) {
    return sizeSentence(r);
  }
  if (has(/\b(where|place|location|distance|far|miles|drive|near)\b/)) {
    return placeSentence(r);
  }
  if (has(/\b(team|partner|prime|sub|subcontract|teaming)\w*/)) {
    return teamSentence(r);
  }
  if (has(/\b(sam|register|registration|renew|cage|uei)\b/)) {
    return samSentence(r);
  }
  if (has(/\b(first|next|do now|prepare|get ready|start|steps?|plan)\b/)) {
    return `${firstStep(r)} ${when(r)}.`;
  }
  if (has(/\b(mentor|sarah|review)\b/)) {
    return `Sarah Mitchell can review this with you. Use “Review with a Mentor” on this page. She read the Camp Mackall and Fayetteville proposals, so she knows your work.`;
  }
  if (has(/\b(past|reference|experience|similar|worked|done before|womack|county)\b/)) {
    const best = PAST_PERFORMANCE.find((p) => p.id === "pp-cdg-sub") ?? PAST_PERFORMANCE[0];
    return `Your closest past work is ${best.projectTitle} (${money(best.totalValue)}, ${best.periodStart.slice(0, 4)}). Your Womack contract ($126K) shows federal prime work, and Cumberland County Schools ($198K) shows daily volume.`;
  }
  if (has(/\b(compet|who wins|winner|incumbent|who has)\b/)) {
    return r.oppKey === FORT_BRAGG_FORECAST_KEY
      ? `${KEY_PARTNER.name} holds the current contract. ${KEY_PARTNER.holds}.`
      : "The record does not name who holds the current contract. The “How to win it” box shows the firms that won comparable awards.";
  }
  return `I answer from this forecast's record and your business details. I do not have that. ${SUGGESTIONS}`;
}
