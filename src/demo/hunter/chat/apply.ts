// DEMO (Hunter chat): apply a change to the member's filters, and say what it did.
//
// The feed page keeps the filters. The chat sends a `discovery` payload and the
// page applies it (`applyHunterFilters` in `routes/opportunities.index.tsx`).
// This file does the same merge on the server filters, so the reply can state
// how many cards the member will see, and that number agrees with the feed.

import type { ServerFilters } from "../../../lib/discoverApi";
import type { DiscoveryPayload, FeedTab, HunterFilterDelta } from "../../../lib/hunterChat";
import { universe, type FeedRow, type FeedTabId } from "../data";
import { applyFilters } from "../query";
import { cap, joinList } from "../facts";
import { chip, titleOf } from "./answers";
import type { ChatCtx, Turn } from "./types";

/** The buyer lane survives every change. It is page state, not a filter. */
function laneOf(filters: ServerFilters): ServerFilters {
  return filters.scopes ? { scopes: filters.scopes } : {};
}

/** The same merge as the page: a key in the change replaces the filter; a missing key keeps it. */
export function mergeDelta(current: ServerFilters, delta: HunterFilterDelta, fresh: boolean): ServerFilters {
  const base: ServerFilters = fresh ? laneOf(current) : { ...current };
  const next: ServerFilters = { ...base };

  if (delta.states || delta.cities) {
    next.location = {
      ...(delta.states ? { states: delta.states } : base.location?.states ? { states: base.location.states } : {}),
      ...(delta.cities ? { cities: delta.cities } : base.location?.cities ? { cities: base.location.cities } : {}),
    };
  }
  if (delta.setAsides) next.setAsides = delta.setAsides;
  if (delta.valueRange) next.valueRange = delta.valueRange;
  if (delta.dueWindow) next.dueWindow = delta.dueWindow;
  if (delta.naics) next.naicsCodes = delta.naics;
  if (delta.noticeTypes) next.noticeTypes = delta.noticeTypes;
  if (delta.vehicles) next.vehicles = delta.vehicles;
  if (delta.postedWithin) next.postedWithin = delta.postedWithin;
  if (delta.dodOnly !== undefined) next.dodOnly = delta.dodOnly || undefined;
  if (delta.civilianOnly !== undefined) next.civilianOnly = delta.civilianOnly || undefined;
  if (delta.search !== undefined) next.search = delta.search || undefined;
  else if (fresh) delete next.search;
  if (delta.scope) {
    if (delta.scope.fed && !delta.scope.sled) next.scopes = ["fed"];
    else if (delta.scope.sled && !delta.scope.fed) next.scopes = ["sled"];
    else delete next.scopes;
  }
  return next;
}

/** The tabs that Hunter can filter. The Saved tab does not use filters. */
function filterable(tab: FeedTab): FeedTabId {
  return tab === "all" ? "all" : "for_you";
}

/** How many cards a tab shows under these filters. */
export function countFor(tab: FeedTabId, filters: ServerFilters): FeedRow[] {
  return applyFilters(universe(tab), filters);
}

function nameThem(rows: FeedRow[], n = 3): string {
  const shown = rows.slice(0, n).map(titleOf);
  return rows.length > n ? `${shown.join(", ")}, and ${rows.length - n} more` : joinList(shown);
}

export interface ApplyOptions {
  fresh?: boolean;
  /** Said when nothing fits, instead of the plain "nothing fits" sentence. */
  whenEmpty?: string;
  /** What the change does, in a sentence that starts the reply. */
  said: string;
  /** Said after the count, when it helps. */
  extra?: (rows: FeedRow[]) => string | null;
  chips?: (rows: FeedRow[]) => string[];
}

/**
 * Applies the change to the page's filters and writes the reply.
 * - On the For You tab, a change that leaves nothing there moves to All opportunities.
 * - A change that leaves nothing anywhere is not applied.
 * - On the Saved tab, filters do nothing, so the change moves to For You.
 */
export function applyChange(ctx: ChatCtx, delta: HunterFilterDelta, opts: ApplyOptions): Turn {
  const fromSaved = ctx.tab === "saved";
  const current = fromSaved ? laneOf(ctx.feed.filters) : ctx.feed.filters;
  const fresh = Boolean(opts.fresh);
  const merged = mergeDelta(current, delta, fresh);

  let tab: FeedTabId = filterable(ctx.tab);
  let rows = countFor(tab, merged);
  let moved: FeedTab | undefined = fromSaved ? "for_you" : undefined;
  let note = "";

  if (rows.length === 0 && tab === "for_you") {
    const all = countFor("all", merged);
    if (all.length > 0) {
      tab = "all";
      moved = "all";
      rows = all;
      note = "None of your matches fit that, so I opened All opportunities. ";
    }
  }
  if (rows.length === 0 && !fresh && Object.keys(laneOf(current)).length < Object.keys(current).length) {
    // Her other filters, together with this change, leave nothing. Start fresh with this change alone.
    const alone = mergeDelta(current, delta, true);
    if (countFor("for_you", alone).length > 0 || countFor("all", alone).length > 0) {
      const turn = applyChange(ctx, delta, { ...opts, fresh: true });
      if (turn.kind === "discovery") {
        return {
          ...turn,
          reply: `Your other filters and this change leave nothing, so I started fresh with this change alone. ${turn.reply}`,
        };
      }
      return turn;
    }
  }
  if (rows.length === 0) {
    return {
      reply:
        opts.whenEmpty ??
        `${cap(opts.said.replace(/^Showing /, "I looked for "))} Nothing fits that, even on All opportunities. I did not change your list. Try a wider size, place or date.`,
      chips: [chip.best, chip.fresh, chip.how],
    };
  }
  if (fromSaved && !note) note = "Filters do not change your Saved list, so I opened Opportunities for you. ";

  const plural = tab === "all" ? "opportunities" : "matches";
  const single = tab === "all" ? "opportunity" : "match";
  const fits = rows.length === 1 ? `One ${single} fits` : `${rows.length} ${plural} fit`;
  const extra = opts.extra?.(rows);
  const reply =
    `${note}${opts.said} ${fits}` + (rows.length <= 4 ? `: ${nameThem(rows, 4)}.` : ".") + (extra ? ` ${extra}` : "");

  const data: DiscoveryPayload & { tab?: FeedTab } = {
    filters: delta,
    note: null,
    fresh,
    ...(moved ? { tab: moved } : {}),
  };
  return {
    reply,
    kind: "discovery",
    data,
    chips: opts.chips?.(rows) ?? [chip.why(rows[0]), chip.ready(rows[0]), "Start over"],
  };
}

export { nameThem };
