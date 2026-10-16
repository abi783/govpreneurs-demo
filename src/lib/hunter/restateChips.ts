// The "Using …" row above Hunter's reply — what the turn actually did, and to
// what. The prototype shows it for EVERY tool turn, not only a feed filter:
//
//   ["Readiness check", "Dining hall dining service"]
//   ["Compare", "Dining hall vs Pope galley"]
//   ["Action checklist", "Fort Bragg dining hall food service"]
//   ["Value ≥ $500K", "On your current list"]
//
// The shape is the same throughout: WHAT THE TOOL IS, then WHAT IT RAN ON.
//
// THE PROTOTYPE SCRIPTS THESE. In `scenarios.ts` each restate row is a literal
// array written to match a canned reply. Porting those strings would put a
// caption on work the member's turn never did, which is the one thing this row
// must never do: it is a claim about what Hunter DID.
//
// So every chip is derived from the payload the server actually returned. A
// payload with no subject yields the tool name alone; a turn that did nothing
// visible yields NOTHING, and the row does not render — an empty "Using" is a
// claim with nothing behind it.
//
// Deliberately NOT ported: the prototype's italic status line ("Adding a $500K
// floor to your list…"). That is a PROGRESS report, and our turn is one request
// and one response with no intermediate events, so rendering it after the reply
// had arrived would stage a process that never happened.

import type {
  ActPayload,
  ComparePayload,
  DiscoveryPayload,
  EligibilityPayload,
  HunterFilterDelta,
  MatchesPayload,
  ProfileUpdatePayload,
  WebResearchPayload,
} from "../hunterChat";
import { setAsideDisplayLabel } from "../oppDisplay";

/** A chip is a label, not a sentence. A long opportunity title is shortened
 *  rather than dropped — the member still recognises which notice it names, and
 *  the row stays readable.
 *
 *  28, not 42: the rail is a narrow dock, and at 42 a single compare subject
 *  ("Online Application Development for CDPH v…") filled the row on its own and
 *  pushed the lead onto a line of its own. */
const MAX_CHIP = 28;
function short(text: string): string {
  const t = text.trim();
  return t.length <= MAX_CHIP ? t : `${t.slice(0, MAX_CHIP - 1).trimEnd()}…`;
}

/** Compact money for a chip: $500K, $1.2M, $900. */
function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

/** The value bound, in the shape the member asked for it: a floor, a ceiling,
 *  or a band. Null when neither end is set — an unbounded range narrowed
 *  nothing and has nothing to say. */
function valueChip(range: HunterFilterDelta["valueRange"]): string | null {
  if (!range) return null;
  const { min, max } = range;
  if (min != null && max != null) return `${money(min)}–${money(max)}`;
  if (min != null) return `Value ≥ ${money(min)}`;
  if (max != null) return `Value ≤ ${money(max)}`;
  return null;
}

/** Caps a list chip so one broad filter cannot push the row onto three lines. */
function listChip(values: string[] | undefined, format = (v: string) => v): string | null {
  const items = (values ?? []).filter((v) => v.trim().length > 0);
  if (items.length === 0) return null;
  if (items.length <= 2) return items.map(format).join(", ");
  return `${format(items[0])} +${items.length - 1} more`;
}

/** A feed turn: what it narrowed by, then the scope it narrowed within. */
function discoveryChips(payload: DiscoveryPayload): string[] {
  const f = payload.filters ?? {};
  const chips = [
    listChip(f.naics),
    listChip(f.states),
    listChip(f.cities),
    listChip(f.setAsides, setAsideDisplayLabel),
    valueChip(f.valueRange),
    listChip(f.dueWindow),
    listChip(f.noticeTypes),
    listChip(f.vehicles),
    f.search?.trim() ? `“${short(f.search)}”` : null,
  ].filter((c): c is string => c !== null);

  if (chips.length === 0) return [];

  // The scope chip is LAST and only ever describes what the server told us:
  // `fresh` means the delta replaced the member's filters, so the search began
  // again; otherwise it narrowed the list already on screen.
  chips.push(payload.fresh ? "Starting fresh" : "On your current list");
  return chips;
}

/** Two compared notices read better named than counted; more than two do not. */
function compareSubject(payload: ComparePayload): string | null {
  const titles = (payload.opps ?? []).map((o) => o?.title).filter((t): t is string => !!t?.trim());
  if (titles.length === 0) return null;
  if (titles.length === 2) return short(`${titles[0]} vs ${titles[1]}`);
  return `${titles.length} opportunities`;
}

/**
 * The chips for one turn, from the payload the server returned.
 *
 * `kind` and `data` are the raw `uiPayload` halves, so an unrecognised kind
 * yields no row rather than a guess. Returns an empty array whenever the turn
 * has nothing to restate.
 */
export function restateChips(kind: string | undefined, data: unknown): string[] {
  if (!kind || data == null) return [];

  switch (kind) {
    case "discovery":
      return discoveryChips(data as DiscoveryPayload);

    case "eligibility": {
      const title = (data as EligibilityPayload).title?.trim();
      return title ? ["Readiness check", short(title)] : ["Readiness check"];
    }

    case "compare": {
      const subject = compareSubject(data as ComparePayload);
      return subject ? ["Compare", subject] : ["Compare"];
    }

    case "matches": {
      const n = (data as MatchesPayload).rows?.length ?? 0;
      // "Top 0" is not a shortlist. With no rows there is nothing to caption.
      return n > 0 ? ["Best matches", `Top ${n}`] : [];
    }

    case "act": {
      const title = (data as ActPayload).gap?.title?.trim();
      return title ? ["Action checklist", short(title)] : ["Action checklist"];
    }

    case "web_research": {
      // The member's own question, which is exactly what the prototype restates
      // here — and the one subject we hold verbatim rather than derive.
      const query = (data as WebResearchPayload).query?.trim();
      return query ? ["Web research", short(query)] : ["Web research"];
    }

    case "profile":
      // The card names no subject: the subject is her own business.
      return ["Your business profile"];

    case "profile_update": {
      // A count of changes that WAIT for her Save. Never "updated": nothing is
      // written until she taps Save on the card.
      const n = (data as ProfileUpdatePayload).cards?.length ?? 0;
      return n > 0
        ? ["Profile update", `${n} change${n === 1 ? "" : "s"} to review`]
        : ["Profile update"];
    }

    // `switch_tab`, `save`, `reset` and `none` change nothing the member needs
    // restating — the feed itself is the evidence, and a chip would narrate a
    // click they just made.
    default:
      return [];
  }
}
