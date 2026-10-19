// DEMO (Hunter chat): the answers on the Forecasts page.
//
// The same rail talks on `/forecasts` (`surface: "forecasts"`). A forecast is not
// in the story's opportunity list, so these rules read only what the page sends:
// the title and the place of each card on screen. They say what a forecast is,
// what the member can do about it today, and what Hunter can and cannot say yet.

import type { ComparePayload } from "../../../lib/hunterChat";
import { CAPTURE_STATUS } from "../../../lib/forecasts/copy";
import { PERSONA } from "../../story/persona";
import { daysToDay } from "../../explore/dates";
import { forecastRecord } from "../../explore/forecastData";
import { setSaved } from "../../state/workspace";
import { joinList } from "../facts";
import { VOCAB } from "../vocab";
import { chip } from "./answers";
import {
  definitions,
  greeting,
  grantRule,
  help,
  methodRule,
  profileRule,
  profileUpdateRule,
  startOver,
  unknown,
} from "./intents";
import { parseFilters, describeParsed } from "./parse";
import { normalize } from "./resolve";
import type { ChatCtx, Rule, Turn } from "./types";

const has = (ctx: ChatCtx, rx: RegExp) => rx.test(ctx.norm);

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

/** The buyer's estimate for a forecast, as a range, or "Not shared". */
function estimateOf(oppKey: string): string {
  const r = forecastRecord(oppKey);
  if (!r || (r.valLow == null && r.valHigh == null)) return "Not shared";
  if (r.valLow != null && r.valHigh != null && r.valLow !== r.valHigh)
    return `${money(r.valLow)} to ${money(r.valHigh)}`;
  return money((r.valHigh ?? r.valLow) as number);
}

/** When the buyer expects to ask for bids, in words, or "No date given". */
function expectedOf(oppKey: string): string {
  const r = forecastRecord(oppKey);
  if (!r?.dueOn) return "No date given";
  const days = daysToDay(r.dueOn);
  if (days < 14) return "In the next two weeks";
  if (days < 60) return `In about ${Math.round(days / 7)} weeks`;
  return `In about ${Math.round(days / 30.44)} months`;
}

const FORECAST_CHIPS = {
  what: "What is a forecast?",
  best: "What should I look at first?",
  top3: "Compare my top 3 — which should I chase?",
};

/** The card that the member means: a title in the words, a pointer, or the first card. */
function pick(ctx: ChatCtx) {
  const raw = ctx.raw;
  const norm = ctx.norm;
  const named = [...raw]
    .sort((a, b) => b.title.length - a.title.length)
    .find((v) => norm.includes(normalize(v.title)));
  if (named) return named;
  const ordinals: [RegExp, number][] = [
    [/\b(first|top|1st)\b/, 0],
    [/\b(second|2nd)\b/, 1],
    [/\b(third|3rd)\b/, 2],
  ];
  for (const [rx, i] of ordinals) if (rx.test(norm) && raw[i]) return raw[i];
  return raw[0];
}

const whatIsForecast: Rule = {
  id: "forecast-define",
  run: (ctx) => {
    if (!has(ctx, /\b(what|explain|define|mean)\b/) || !has(ctx, /\bforecasts?\b/)) return null;
    return {
      reply:
        "A forecast is a heads-up about work the government plans to buy. The buyer has not posted the notice yet, so nothing is open to answer.\n" +
        `Each forecast shows when it may open: ${CAPTURE_STATUS.act_now.label} (${CAPTURE_STATUS.act_now.when.toLowerCase()}), ${CAPTURE_STATUS.start_capture.label} (${CAPTURE_STATUS.start_capture.when.toLowerCase()}), ${CAPTURE_STATUS.position_early.label} (${CAPTURE_STATUS.position_early.when.toLowerCase()}), or ${CAPTURE_STATUS.watch.label}.\n` +
        "Use the time to meet the buyer, find a partner and get your papers ready.",
      chips: [FORECAST_CHIPS.best, FORECAST_CHIPS.top3, chip.how],
    };
  },
};

const whyForecast: Rule = {
  id: "forecast-why",
  run: (ctx) => {
    if (
      !has(ctx, /\bwhy\b.*\b(match|fit|here|show|on my list|rank)\w*\b/) &&
      !has(ctx, /\b(good fit|best fits?)\b/)
    )
      return null;
    if (has(ctx, /\bwhy (these|those)\b/)) return null;
    const v = pick(ctx);
    if (!v) return null;
    return {
      reply:
        `${v.title}${v.location ? ` (${v.location})` : ""} is a forecast on your list. I rank a forecast the way I rank a notice.\n` +
        `• Your codes: ${VOCAB.forecastCodes}.\n` +
        `• Your area: ${PERSONA.serviceStates.join(", ")}, up to ${PERSONA.serviceRadiusMiles} miles from ${PERSONA.hqCity}.\n` +
        "• Your set-asides: Small Business and Woman-Owned (WOSB).\n" +
        "Open it to read the buyer's plan and the expected timing. Grant reads it in full when the notice posts.",
      chips: [`Am I ready to bid the ${v.title}?`, FORECAST_CHIPS.what, FORECAST_CHIPS.top3],
    };
  },
};

const readyForecast: Rule = {
  id: "forecast-ready",
  run: (ctx) => {
    if (
      !has(
        ctx,
        /\b(am i|can i|do i)\b.*\b(ready|eligible|qualif\w+|good fit|bid|compete)\b|\bready to bid\b/,
      )
    )
      return null;
    const v = pick(ctx);
    if (!v) return null;
    return {
      reply:
        `${v.title} is a forecast, so nothing is open to answer yet. You cannot send a bid today.\n` +
        `What you can do now: save it to track it, keep your SAM.gov registration active (yours runs to ${new Date(`${PERSONA.samActiveUntil}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}), and keep your capability statement current.\n` +
        "I check your eligibility when the notice posts. Whether to bid is Grant's call.",
      chips: [`Why does the ${v.title} match me?`, FORECAST_CHIPS.what, FORECAST_CHIPS.top3],
    };
  },
};

const compareForecasts: Rule = {
  id: "forecast-compare",
  run: (ctx) => {
    if (!has(ctx, /\bcompare\b|\bwhich should i (chase|pursue|go for|pick)\b/)) return null;
    const picked = ctx.raw.slice(0, 3);
    if (picked.length < 2) {
      return {
        reply:
          "I need at least two forecasts on screen to compare them. Clear a filter or open the All view, then ask again.",
        chips: [FORECAST_CHIPS.what, FORECAST_CHIPS.best, chip.how],
      };
    }
    const data: ComparePayload = {
      opps: picked.map((v) => ({
        oppKey: v.oppKey,
        title: v.title,
        agency: null,
        location: v.location ?? null,
      })),
      rows: [
        { field: "Place", values: picked.map((v) => v.location ?? "Not stated"), winner: null },
        {
          field: "Buyer's estimate",
          values: picked.map((v) => estimateOf(v.oppKey)),
          winner: null,
        },
        {
          field: "Buyer expects bids",
          values: picked.map((v) => expectedOf(v.oppKey)),
          winner: null,
        },
        { field: "Status", values: picked.map(() => "Forecast: not posted yet"), winner: null },
      ],
      verdict: undefined as unknown as ComparePayload["verdict"],
      tradeoff:
        "A forecast has no bid deadline yet, and its value is the buyer's estimate. Compare again when the notices post. Grant makes the go or no-go call.",
    };
    return {
      reply: `I compared ${joinList(picked.map((v) => v.title))} by place, the buyer's estimate and the date the buyer expects to ask for bids. A forecast has no bid deadline yet, so Grant makes no call until the notice posts.`,
      kind: "compare",
      data,
      chips: [FORECAST_CHIPS.what, FORECAST_CHIPS.best, chip.how],
    };
  },
};

const bestForecasts: Rule = {
  id: "forecast-best",
  run: (ctx) => {
    if (
      !has(
        ctx,
        /\bwhich of these\b.*\b(fit|fits|ready)\b|\bwhat out there\b|\bwhat should i (look at|focus on|start with)\b|\b(best|top) (matches|forecasts|picks)\b|\bwhat s new\b|\bwhat new\b|\bwhere (do|should) i start\b/,
      )
    )
      return null;
    const first = ctx.raw.slice(0, 3);
    if (first.length === 0) {
      return {
        reply: "No forecast is on screen. Clear a filter and I can list the best ones.",
        chips: [FORECAST_CHIPS.what, chip.how],
      };
    }
    return {
      reply: `Your forecasts are in order of fit. These are first: ${joinList(first.map((v) => v.title))}. Open one to read the buyer's plan and the expected timing.`,
      chips: [`Why does the ${first[0].title} match me?`, FORECAST_CHIPS.top3, FORECAST_CHIPS.what],
    };
  },
};

const saveForecast: Rule = {
  id: "forecast-save",
  run: (ctx) => {
    if (!has(ctx, /\b(save|track|bookmark|watch)\b/) || has(ctx, /\bsaved search\b/)) return null;
    const v = pick(ctx);
    if (!v) return null;
    setSaved(v.oppKey, true);
    return {
      reply: `I saved ${v.title}. It is on your saved list, and you will see changes to it there.`,
      kind: "save",
      data: { saved: [v.oppKey], unsaved: [] },
      chips: [FORECAST_CHIPS.what, FORECAST_CHIPS.best, chip.how],
    };
  },
};

const filterForecasts: Rule = {
  id: "forecast-filters",
  run: (ctx) => {
    const parsed = parseFilters(ctx.text, ctx.norm);
    if (parsed.notHers) {
      return {
        reply: `You do not hold the ${parsed.notHers} status, so those set-asides are not open to you. I did not change your list.`,
        chips: [FORECAST_CHIPS.what, FORECAST_CHIPS.best, chip.how],
      };
    }
    if (Object.keys(parsed.delta).length === 0) return null;
    return {
      reply: `${describeParsed(parsed)} The forecasts list applies the words and the buyer lane. If it cannot apply a filter, it says so under my answer.`,
      kind: "discovery",
      data: { filters: parsed.delta, note: null, fresh: false },
      chips: [FORECAST_CHIPS.best, FORECAST_CHIPS.what, "Start over"],
    };
  },
};

/** The rules for the Forecasts page, in the order Hunter checks them. */
export const FORECAST_RULES: Rule[] = [
  greeting,
  startOver,
  whatIsForecast,
  compareForecasts,
  grantRule,
  whyForecast,
  readyForecast,
  definitions,
  profileRule,
  profileUpdateRule,
  methodRule,
  saveForecast,
  bestForecasts,
  filterForecasts,
  help,
  {
    id: "forecast-unknown",
    run: (ctx) => {
      const turn = unknown.run(ctx) as Turn;
      return { ...turn, chips: [FORECAST_CHIPS.what, FORECAST_CHIPS.best, chip.how] };
    },
  },
];
