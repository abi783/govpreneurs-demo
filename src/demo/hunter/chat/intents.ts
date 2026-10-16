// DEMO (Hunter chat): what Hunter understands, in the order he checks it.
//
// A rule returns a turn, or null when the words do not fit. The first rule that
// returns a turn wins. The order matters: a starter button ("Why does ... match
// me?") is matched before a general rule, and a "what is ..." question is
// matched before a filter, so "what is a sources sought" explains the term and
// "show only sources sought" changes the feed.

import { PERSONA } from "../../story/persona";
import { allRows, forYouRows, rowById, savedRows, universe, type FeedRow } from "../data";
import { longDate } from "../dates";
import {
  RANGE_TEXT,
  aboutValue,
  cap,
  closesText,
  joinList,
  noticeText,
  setAsideText,
  valueText,
} from "../facts";
import { searchMatches, searchTokens } from "../query";
import { setSaved } from "../../state/workspace";
import { applyChange, nameThem } from "./apply";
import {
  aboutOpp,
  bestMatches,
  chip,
  compare,
  compareSaved,
  compareTop3,
  howIPick,
  listBy,
  profileCard,
  readiness,
  readyList,
  savedSummary,
  setAsideStatus,
  titleOf,
  universeRows,
  whyMatch,
} from "./answers";
import { findDefinition } from "./glossary";
import { describeParsed, parseFilters } from "./parse";
import { findOpp, titleIn } from "./resolve";
import { proposeProfileChange } from "./profile";
import { readSession, updateSession } from "./session";
import type { ChatCtx, Rule, Turn } from "./types";

const has = (ctx: ChatCtx, rx: RegExp) => rx.test(ctx.norm);

/** Remembers the opportunity that this answer was about. */
function about(row: FeedRow | undefined): void {
  if (row) updateSession((s) => ({ ...s, lastOppId: row.id }));
}

/** The first match of the visible list, or of your For You list. */
function topOf(ctx: ChatCtx): FeedRow {
  return ctx.visible[0] ?? forYouRows()[0];
}

// ── Plain conversation ──────────────────────────────────────────────────────

const greeting: Rule = {
  id: "greeting",
  run: (ctx) => {
    if (ctx.norm.split(" ").length > 5) return null;
    if (/^(hi|hello|hey|hiya|howdy|good (morning|afternoon|evening)|yo)\b/.test(ctx.norm)) {
      return {
        reply: `Good to see you, ${PERSONA.ownerFirstName}. I look through new federal and state notices for ${PERSONA.businessShortName} and rank the ones that fit. What do you want to look at?`,
        chips: [chip.best, chip.fresh, chip.how],
      };
    }
    if (/^(thanks|thank you|thx|ty|great|cool|nice|perfect|awesome|ok|okay|got it|good)\b/.test(ctx.norm)) {
      return {
        reply: "You are welcome. Ask me anything about your matches, or open an opportunity to work with Grant.",
        chips: [chip.best, chip.top3, chip.fresh],
      };
    }
    return null;
  },
};

const help: Rule = {
  id: "help",
  run: (ctx) => {
    if (!has(ctx, /\b(what can you do|what do you do|who are you|what are you|help me|^help$|how (do|can) i use you|what can i ask|what should i ask|capabilit\w+ of hunter)\b/)) return null;
    return {
      reply:
        "I am Hunter, your discovery agent. I find government contracts that match your business and explain why each one is on your list.\n" +
        "You can ask me to filter the feed (\"only woman-owned\", \"under $500K\", \"near Fayetteville\"), explain a match, compare opportunities, check if you are ready, or save one.\n" +
        "For a deep read on one opportunity, open it and ask Grant.",
      chips: [chip.best, chip.top3, chip.how],
    };
  },
};

const grantRule: Rule = {
  id: "grant",
  run: (ctx) => {
    if (has(ctx, /\b(will i win|can i win|chance of winning|chances of winning|odds|guarantee|promise|sure thing|likely to win|win it|win this)\b/)) {
      return {
        reply:
          "I cannot tell you that, and nobody can promise a win. I can tell you how well an opportunity fits you and why.\n" +
          "For a deep read on one job, open it and ask Grant. He checks the requirements, the competition and whether you could do the work.",
        chips: [chip.top3, chip.readyList, chip.how],
      };
    }
    if (has(ctx, /\bgrant\b/) && has(ctx, /\b(who|what|why|how|when|does|do)\b/)) {
      return {
        reply:
          "Grant is the other agent. I find and rank opportunities. Grant reads one opportunity in depth: the requirements, the competition, your gaps, and whether to go for it.\n" +
          "Open any card and Grant opens beside it. He makes the go or no-go call, not me.",
        chips: [chip.top3, chip.readyList, chip.best],
      };
    }
    if (has(ctx, /\bshould i (bid|go for|chase|pursue|apply)\b|\bgo or no go\b|\bbid or no bid\b|\bworth (it|bidding|my time)\b/)) {
      const opp = findOpp(ctx.norm, ctx.visible);
      about(opp);
      return {
        reply:
          `That is Grant's call, not mine.${opp ? ` I can say how ${titleOf(opp)} fits you: ask "${chip.why(opp)}"` : ""} For the go or no-go read, open the opportunity and ask Grant.`,
        chips: opp ? [chip.why(opp), chip.ready(opp), chip.top3] : [chip.top3, chip.readyList, chip.best],
      };
    }
    return null;
  },
};

// ── Start over, tabs, saving ────────────────────────────────────────────────

const startOver: Rule = {
  id: "start-over",
  run: (ctx) => {
    if (!has(ctx, /\b(start over|start again|reset|clear (all|everything|the filters|filters|my filters|them)|remove (all )?(the )?filters|no filters|drop (all )?(the )?filters|undo (that|all))\b/)) return null;
    const n = forYouRows().length;
    return {
      reply: `Done. I cleared your filters and your search. Your list shows all ${n} matches again.`,
      kind: "reset",
      data: {},
      chips: [chip.best, chip.top3, chip.fresh],
    };
  },
};

const tabSwitch: Rule = {
  id: "tab-switch",
  run: (ctx) => {
    const wantsShow = has(ctx, /\b(show|open|go to|go back|back to|take me|switch|bring up|list|see|view|what (did|have) i save\w*|what s saved)\b/);
    if (has(ctx, /\b(saved|bookmarks?|bookmarked|my saves|what i saved|favorites?)\b/) && wantsShow && !has(ctx, /\bcompare\b/)) {
      return savedSummary(savedRows());
    }
    if (has(ctx, /\b(all opportunities|the whole feed|everything on the feed|all of them|explore tab|every opportunity|all notices)\b/) && wantsShow) {
      return {
        reply: `I opened All opportunities. It holds ${allRows().length} open notices that I have not ranked for you. Your own ranked list is on the first tab.`,
        kind: "switch_tab",
        data: { tab: "all" },
        chips: [chip.best, chip.fresh, chip.how],
      };
    }
    if (has(ctx, /\b(my matches|for you|back to (my )?(matches|picks|list)|top picks|my list)\b/) && wantsShow && !has(ctx, /\bcompare\b/)) {
      return {
        reply: `I opened Opportunities for you. It holds ${forYouRows().length} matches, ranked by fit.`,
        kind: "switch_tab",
        data: { tab: "for_you" },
        chips: [chip.top3, chip.fresh, chip.readyList],
      };
    }
    return null;
  },
};

const saveRule: Rule = {
  id: "save",
  run: (ctx) => {
    const unsave = has(ctx, /\b(unsave|un save|remove .* from (my )?saved|take .* off (my )?saved|delete .* from saved)\b/);
    const save = has(ctx, /\b(save|bookmark)\b/) && !has(ctx, /\bsave (this )?search\b|\bsaved search\b/);
    if (!unsave && !save) return null;
    const opp = findOpp(ctx.norm, ctx.visible);
    if (!opp) {
      return {
        reply: "Which one? Name it, or say \"save the top one\".",
        chips: [`Save the ${titleOf(topOf(ctx))}`, chip.best, chip.top3],
      };
    }
    about(opp);
    if (unsave) {
      setSaved(opp.id, false);
      return {
        reply: `Removed ${titleOf(opp)} from your Saved tab.`,
        kind: "save",
        data: { saved: [], unsaved: [opp.id] },
        chips: [chip.why(opp), chip.saved, chip.best],
      };
    }
    const already = savedRows().some((r) => r.id === opp.id);
    if (!already) setSaved(opp.id, true);
    return {
      reply: already
        ? `${titleOf(opp)} is already in your Saved tab.`
        : `Saved ${titleOf(opp)}. It is in your Saved tab now, and it will show in your Pipeline.`,
      kind: "save",
      data: { saved: already ? [] : [opp.id], unsaved: [] },
      chips: [chip.saved, chip.ready(opp), chip.top3],
    };
  },
};

// ── Explain, check, compare ─────────────────────────────────────────────────

const whyRule: Rule = {
  id: "why",
  run: (ctx) => {
    if (!has(ctx, /\bwhy\b/)) return null;
    // "Why these?" and "why this feed" ask about the method, not one card.
    const opp = findOpp(ctx.norm, ctx.visible);
    if (!opp || has(ctx, /\bwhy (these|those|are these|do you pick|did you pick|do you show these)\b/)) {
      return has(ctx, /\b(these|those|pick|picks|rank|ranking|order|feed|list)\b/) ? howIPick() : null;
    }
    about(opp);
    return whyMatch(opp);
  },
};

const readyRule: Rule = {
  id: "ready",
  run: (ctx) => {
    const asksReady =
      has(ctx, /\b(am i|are we|can i|could i|do i|would i|will i|is it|is this|am i actually)\b.*\b(ready|eligible|qualif\w+|good fit|fit|bid|compete|apply|respond|clear|meet)\b/) ||
      has(ctx, /\bready (to|for) bid\b|\bready to bid\b|\beligib\w+ for\b|\bqualif\w+ for\b|\bam i (a )?good fit\b/);
    if (!asksReady) return null;
    // "Which of these am I actually ready for?" and "Which of these best fits me?" ask about a list.
    if (has(ctx, /\bwhich\b.*\b(these|those|them|ones|of my|of the)\b|\bwhich of\b/)) {
      return has(ctx, /\bbest fit|best fits|fits me best|most likely\b/) ? bestFits(ctx) : readyList(ctx.visible);
    }
    if (has(ctx, /\bthese set.?asides?\b|\bthose set.?asides?\b|\bset.?asides?\b/)) {
      return setAsideStatus(universeRows(ctx));
    }
    const opp = findOpp(ctx.norm, ctx.visible);
    if (!opp) {
      const top = topOf(ctx);
      about(top);
      const turn = readiness(top);
      return { ...turn, reply: `You did not name one, so I checked the top card. ${turn.reply}` };
    }
    about(opp);
    return readiness(opp);
  },
};

/** "Which of these best fits me?": the three best by score among the cards on screen. */
function bestFits(ctx: ChatCtx): Turn {
  const list = (ctx.visible.length > 0 ? ctx.visible : forYouRows())
    .slice()
    .sort((a, b) => b.o.hunter.score - a.o.hunter.score);
  const top = list.slice(0, 3);
  return {
    reply: `Of the ${list.length} on your screen, these ${top.length} fit you best: ${nameThem(top, 3)}. I weigh your codes, set-aside, size, distance and past jobs.`,
    kind: "matches",
    data: { rows: top.map((r) => ({
      oppKey: r.id,
      title: titleOf(r),
      tier: r.o.hunter.tier,
      matchReasons: r.o.hunter.fit?.slice(0, 3).map((f) => cap(f.says)) ?? [],
      dueDate: r.closesAt,
      agency: r.o.agency,
      sourceType: r.o.scope === "sled" ? "sled" : "sam",
    })) },
    chips: [chip.why(top[0]), chip.ready(top[0]), chip.top3],
  };
}

const setAsideQuestion: Rule = {
  id: "set-aside-question",
  run: (ctx) => {
    if (has(ctx, /\b(do|can) i qualify (for|to)\b.*\bset.?asides?\b|\bwhich set.?asides?\b|\bset.?asides? (do )?i (qualify|have|hold|get)\b|\bmy set.?asides?\b/)) {
      return setAsideStatus(universeRows(ctx));
    }
    return null;
  },
};

const compareRule: Rule = {
  id: "compare",
  run: (ctx) => {
    if (!has(ctx, /\bcompare\b|\bversus\b|\bvs\b|\bside by side\b|\bwhich (is|one is) better\b|\bwhich should i (chase|pursue|go for|pick)\b/)) return null;
    if (has(ctx, /\bsaved\b|\bbookmarks?\b/)) return compareSaved();
    if (has(ctx, /\btop (3|three)\b|\bmy top\b|\bthree best\b/)) return compareTop3();
    // Two named opportunities.
    const named: FeedRow[] = [];
    for (const row of allRows()) {
      if (ctx.norm.includes(row.o.plainTitle.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " "))) named.push(row);
    }
    if (named.length >= 2) {
      about(named[0]);
      return compare(named, "Here are the two you named.", [chip.why(named[0]), chip.ready(named[0]), chip.top3]);
    }
    if (has(ctx, /\b(these|those|them|the two|the remaining|on screen|visible|here)\b/) && ctx.visible.length >= 2) {
      return compare(ctx.visible.slice(0, 3), "Here are the first three on your screen.", [
        chip.why(ctx.visible[0]),
        chip.ready(ctx.visible[0]),
        chip.top3,
      ]);
    }
    return compareTop3();
  },
};

const readyListRule: Rule = {
  id: "ready-list",
  run: (ctx) => {
    if (has(ctx, /\bwhich of these\b.*\b(ready|qualif\w+|eligible)\b|\bwhat am i ready for\b|\bwhat can i (go for|do|respond to|bid on)\b/)) {
      return readyList(ctx.visible);
    }
    if (has(ctx, /\bwhich of these\b.*\b(fit|fits|best|suit|suits)\b|\bwhich (one )?(fits|suits) me (best|most)\b|\bbest fit for me\b/)) {
      return bestFits(ctx);
    }
    return null;
  },
};

// ── Definitions, profile, method ────────────────────────────────────────────

const definitions: Rule = {
  id: "definitions",
  run: (ctx) => {
    const def = findDefinition(ctx.norm);
    if (!def) return null;
    return def.answer(universeRows(ctx));
  },
};

const profileRule: Rule = {
  id: "profile",
  run: (ctx) => {
    if (has(ctx, /\b(what do you know about (me|my)|what do you know|tell me about my (business|profile|company)|my profile|my business profile|show (me )?my (profile|business)|what.*on file|who am i)\b/)) {
      return profileCard();
    }
    return null;
  },
};

const profileUpdateRule: Rule = {
  id: "profile-update",
  run: (ctx) => proposeProfileChange(ctx.text, ctx.norm),
};

const methodRule: Rule = {
  id: "method",
  run: (ctx) => {
    if (has(ctx, /\bhow (do|does|did) (you|hunter) (pick|choose|rank|score|match|decide|sort|find|work)\b|\bhow (are|is) (these|the matches|my matches|they) (picked|chosen|ranked|scored|sorted|made)\b|\bhow does (the )?matching work\b|\bwhat do you (weigh|use|look at)\b|\bwhy these\b|\bhow (do|did) you know\b|\bhow it works\b/)) {
      return howIPick();
    }
    return null;
  },
};

// ── Lists ───────────────────────────────────────────────────────────────────

const listRules: Rule = {
  id: "lists",
  run: (ctx) => {
    if (has(ctx, /\bwhat closes (first|soonest|next)\b|\bclos\w* soonest\b|\bdue (first|soonest)\b|\bsoonest (deadline|due)\b|\bmost urgent\b|\bnext deadline\b|\bwhat s due\b/)) {
      return listBy(universeRows(ctx).length > 0 ? universeRows(ctx) : forYouRows(), "closing");
    }
    if (has(ctx, /\b(biggest|largest|highest value|most money|top dollar|worth the most|bigger jobs?)\b/) && !/\bunder|below|less/.test(ctx.norm)) {
      return listBy(universeRows(ctx).length > 0 ? universeRows(ctx) : forYouRows(), "value");
    }
    if (has(ctx, /\b(closest|nearest)\b|\bleast driving\b|\bshortest drive\b/)) {
      return listBy(universeRows(ctx).length > 0 ? universeRows(ctx) : forYouRows(), "near");
    }
    if (
      has(ctx, /\bwhat out there\b|\bwhat s available\b|\bwhat is available\b|\bwhat do you have for me\b|\bwhat have you got\b|\bany good (ones|matches|jobs)\b/) ||
      has(ctx, /\b(best|top) (matches|opportunities|picks|jobs|ones)\b|\bshow me (my )?(matches|picks)\b|\bwhere (do|should) i start\b|\bwhat should i (look at|focus on|chase|start with|go after|do first)\b|\brecommend\w*\b|\bgive me (the )?top\b/)
    ) {
      return bestMatches();
    }
    return null;
  },
};

// ── One opportunity ─────────────────────────────────────────────────────────

/** Answers a question about one opportunity. `strict` waits for a named opportunity or a clear opener. */
function aboutRuleFor(strict: boolean): Rule {
  return {
    id: strict ? "about-named" : "about",
    run: (ctx) => {
      const opener = has(ctx, /^(tell me about|tell me more about|more about|details (on|about|for)|what about|describe|summarize|summarise|info on|information (on|about)|who is buying|what is|when (does|is|do)|how much|where (is|are)|how far|who (is|posted|are)|what s the (deadline|value|buyer|agency))\b/);
      if (strict && !opener && !titleIn(ctx.norm)) return null;
      const asks = has(ctx, /\b(tell me about|more about|details|detail|info on|information|describe|summar\w+|what is the|what about|who is the|who posted|who s buying|buyer|agency|incumbent|when (does|is)|how much|where is|how far|worth|value|deadline|due|close|closes|miles|distance|about the)\b/);
      if (!asks) return null;
      const opp = findOpp(ctx.norm, ctx.visible);
      if (!opp) return null;
      about(opp);
      const t = titleOf(opp);
      if (has(ctx, /\b(when|deadline|due|close|closes)\b/)) {
        return {
          reply: `${t} ${closesText(opp)}. I hide anything with under a week left, because it is too late to answer well.`,
          kind: "matches",
          data: { rows: [matchRowSafe(opp)] },
          chips: [chip.why(opp), chip.ready(opp), chip.closing],
        };
      }
      if (has(ctx, /\b(how much|worth|value|price|size|money)\b/)) {
        return {
          reply: `${t}: ${valueText(opp)} (${aboutValue(opp)}). Your target range is ${RANGE_TEXT}.${opp.o.valueBasis === "per_year" ? " The buyer states this value per year." : ""}`,
          chips: [chip.why(opp), chip.ready(opp), chip.top3],
        };
      }
      if (has(ctx, /\b(where|how far|miles|distance)\b/)) {
        return {
          reply: `${t} is in ${opp.city}, ${opp.state}. That is ${opp.miles} miles from your kitchen in ${PERSONA.hqCity}.`,
          chips: [chip.why(opp), chip.ready(opp), chip.top3],
        };
      }
      if (has(ctx, /\b(who|buyer|agency|incumbent|posted|buying)\b/)) {
        return {
          reply: `The buyer for ${t} is ${opp.o.agency}, ${opp.o.office}. It is ${noticeText(opp)}, and ${setAsideText(opp)}.`,
          chips: [chip.why(opp), chip.ready(opp), chip.top3],
        };
      }
      return aboutOpp(opp);
    },
  };
}

const aboutNamed = aboutRuleFor(true);
const aboutLoose = aboutRuleFor(false);

function matchRowSafe(row: FeedRow) {
  return {
    oppKey: row.id,
    title: titleOf(row),
    tier: row.o.hunter.tier,
    matchReasons: row.o.hunter.fit?.slice(0, 3).map((f) => cap(f.says)) ?? [],
    dueDate: row.closesAt,
    agency: row.o.agency,
    sourceType: row.o.scope === "sled" ? "sled" : "sam",
  };
}

// ── Filters ─────────────────────────────────────────────────────────────────

const filterRule: Rule = {
  id: "filters",
  run: (ctx) => {
    const parsed = parseFilters(ctx.text, ctx.norm);
    if (parsed.notHers) {
      return {
        reply:
          `You do not hold the ${parsed.notHers} status, so those set-asides are not open to you. I did not change your list.\n` +
          "You qualify for Small Business and Woman-Owned (WOSB) set-asides.",
        chips: [chip.wosb, "Do I qualify for these set-asides?", chip.best],
      };
    }
    const { delta } = parsed;
    if (Object.keys(delta).length === 0) return null;
    // A question about the filter ("what is ...") never reaches here: definitions come first.
    const said = describeParsed(parsed);
    return applyChange(ctx, delta, {
      said,
      extra: (rows) => {
        const notes: string[] = [];
        if (delta.valueRange && universeRows(ctx).some((r) => r.low === null && r.high === null)) {
          notes.push("Sources Sought notices state no value, so a size filter hides them.");
        }
        if (delta.states?.some((s) => s !== "NC")) {
          const nearest = [...rows].sort((a, b) => a.miles - b.miles)[0];
          notes.push(`The nearest is ${titleOf(nearest)}, ${nearest.miles} miles from your kitchen. Your service area reaches ${PERSONA.serviceRadiusMiles} miles.`);
        }
        if (delta.setAsides?.includes("WOSB")) notes.push("You qualify for all of them.");
        if (delta.postedWithin) {
          const newest = [...rows].sort((a, b) => a.o.postedDaysAgo - b.o.postedDaysAgo)[0];
          notes.push(`The newest is ${titleOf(newest)}, posted ${newest.o.postedDaysAgo} days ago (${longDate(-newest.o.postedDaysAgo)}).`);
        }
        return notes.length ? notes.join(" ") : null;
      },
    });
  },
};

/** "Show me hospital jobs": a plain search over every title, agency, place and code. */
const searchFallback: Rule = {
  id: "search",
  run: (ctx) => {
    const startsSearch = has(ctx, /^(show|find|search|look|look for|get|list|any|got any|do you have|are there|is there)\b/);
    const endsSearch = has(ctx, /\b(jobs?|work|opportunit\w+|contracts?|notices?)$/);
    if (!startsSearch && !endsSearch) return null;
    const tokens = searchTokens(
      ctx.norm.replace(/\b(show|find|search|look|get|list|any|got|do|you|have|are|there|is|me|for|some|all|the|only|just|please|can|u|i|want|need|see)\b/g, " "),
    );
    if (tokens.length === 0) return null;
    const phrase = tokens.join(" ");
    const hits = allRows().filter((r) => searchMatches(r, phrase));
    if (hits.length === 0) {
      return {
        reply: `I found nothing for "${phrase}". Try a place, a buyer, a type of food service, or a size.`,
        chips: [chip.best, chip.near, chip.wosb],
      };
    }
    return applyChange(ctx, { search: phrase }, { said: `Searching for "${phrase}".` });
  },
};

// ── Unknown ─────────────────────────────────────────────────────────────────

/** Questions that the engine answers well. The unknown rule offers the nearest three. */
export const CANON: string[] = [
  "What's out there for me right now?",
  "What's new this week?",
  "Which of these am I actually ready for?",
  "Compare my top 3 — which should I chase?",
  "How do you pick my matches?",
  "What do you know about my business?",
  "Show only woman-owned set-asides",
  "Show only federal",
  "Show only state and local",
  "Show jobs under $500K",
  "Show work near Fayetteville",
  "Show work in Virginia and South Carolina",
  "What closes first?",
  "Show my saved ones",
  "What is a Sources Sought notice?",
  "What is a WOSB set-aside?",
  "What is a NAICS code?",
  "Do I qualify for these set-asides?",
  "Show me Fort Bragg dining halls",
  "Show catering jobs",
  "Show me school meals",
  "Start over",
];

function overlap(a: string, b: string): number {
  const stems = (t: string) => new Set(searchTokens(t).map((w) => w.replace(/(ing|ers|er|es|s)$/, "")));
  const x = stems(a);
  const y = stems(b);
  let n = 0;
  for (const w of x) if (y.has(w)) n += 1;
  return n;
}

export function nearestQuestions(text: string): string[] {
  const scored = CANON.map((q) => ({ q, s: overlap(text, q) })).sort((a, b) => b.s - a.s);
  const hits = scored.filter((x) => x.s > 0).slice(0, 3).map((x) => x.q);
  for (const d of [CANON[0], CANON[1], CANON[4], CANON[3]]) {
    if (hits.length >= 3) break;
    if (!hits.includes(d)) hits.push(d);
  }
  return hits.slice(0, 3);
}

export const unknown: Rule = {
  id: "unknown",
  run: (ctx) => ({
    reply:
      "I am not sure what you mean by that. I am best at your matches: finding them, filtering them, explaining why they fit, and checking if you are ready. For a deep read on one opportunity, open it and ask Grant.\n" +
      "These questions are close to yours:",
    chips: nearestQuestions(ctx.text),
  }),
};

/** The rules, in the order Hunter checks them. */
export const RULES: Rule[] = [
  greeting,
  startOver,
  compareRule,
  grantRule,
  whyRule,
  readyListRule,
  readyRule,
  setAsideQuestion,
  definitions,
  profileRule,
  profileUpdateRule,
  methodRule,
  tabSwitch,
  saveRule,
  listRules,
  aboutNamed,
  filterRule,
  aboutLoose,
  help,
  searchFallback,
  unknown,
];

// Re-exported for the tests.
export { titleIn, rowById, universe };
