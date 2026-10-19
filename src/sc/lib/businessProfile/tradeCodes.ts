/**
 * The "Your trade" picker's state, as pure functions. ENTITIES: no React, no
 * Prisma. `TradePicker` (`src/components/business/controls.tsx`) holds the
 * state and calls these; the tests call them directly. SC-5.
 *
 * WHY THE PICKER STARTS FROM EVERY CODE ON HER PROFILE. Her own save excludes
 * each code she was shown and did not keep (SPEC §A.4, Decisions log D1, D131).
 * The picker used to start from her own picks alone, so one untouched save would
 * have excluded her SAM, SBA and capability codes (D47). Seeded from the
 * profile's codes, a save she did not touch keeps every one of them.
 *
 * A SAVE SENDS TWO LISTS (D130). Her PICKS — the codes she picked before, the
 * codes she adds now (search or tree) and the codes of a trade she picks now —
 * are the value, and only they go to `my_business`. The KEEP-LIST — every code
 * still ticked — and the codes the picker SHOWED travel beside the value as
 * `naicsScope`, and decide only what is excluded. A code from another source
 * that she leaves ticked is kept, but it is not her pick: if it were, one
 * untouched save would make every SAM code two-source in Hunter.
 *
 * A code under one of her trades is ticked in the trade tree. Any other code is
 * an "other code on her profile": it rides in `adhocNaics`, which is where the
 * "Search all NAICS codes" picks already live.
 *
 * A SAVE ALSO RECORDS HER SEARCH PICKS (D152). `searched` lists the codes among
 * her picks that she added through the search. It decides only whether a code
 * wears the "You picked" chip (`pickedCodes.ts`), never what matching uses.
 */

import { isRecord, naicsCodeList } from "@sc/lib/naics/naicsBySource";
import { sourceChips, type SourceChip } from "@sc/lib/naics/sourceChips";
import type { ProfileNaics } from "./payload";
import { chipSources, chosenCodes, codesUnder, listedByOtherSource, searchPicksAtOpen } from "./pickedCodes";
import { buildTradeTree, categoriesFromSelection, selectionFromCategories } from "./treeData";
import { childId, onChildClick, statusOf, type TreeParent, type TreeSelection } from "./treeSelection";
import { hasOwnKey } from "./untrustedInput";
import { parseTradeSaveScope, type TradeSaveScope } from "./writeBack";

/** What the picker holds: the trade tree's ticks, and the codes outside it. */
export interface TradePickerState {
  selection: TreeSelection;
  adhocNaics: string[];
}

/** Where a code on her profile is listed: under her trades, or apart from them. */
export type ProfileCodeGroup = "trade" | "other";

/** One code on her profile, as the picker lists it. */
export interface ProfileCodeRow {
  code: string;
  group: ProfileCodeGroup;
  /** Ticked: it is in what a save submits, so matching keeps using it. */
  on: boolean;
  chips: SourceChip[];
}

/** The stored "Your trade" answer, read defensively. */
function storedAnswer(stored: unknown): { categories: string[]; naics: string[] } {
  const o = (stored ?? null) as { categories?: unknown; naics?: unknown } | null;
  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  return { categories: strings(o?.categories), naics: strings(o?.naics) };
}

/**
 * The picker's first state. With `profile` (the My Business record) it ticks
 * every code on her profile; without it (the intake form, whose save excludes
 * nothing) it ticks her own picks, as it always did.
 */
export function seedTradePicker(stored: unknown, profile: ProfileNaics | null): TradePickerState {
  const answer = storedAnswer(stored);
  return selectionFromCategories(answer.categories, profile ? profile.codes : answer.naics);
}

/**
 * What the picker ticks: `{ categories, naics }`, where `naics` is every code
 * still ticked (the keep-list). On the intake form this is the value a save
 * submits; on the My Business record `tradeSave` splits it (D130).
 */
export function tradeAnswer(state: TradePickerState): { categories: string[]; naics: string[] } {
  return categoriesFromSelection(state.selection, state.adhocNaics);
}

/** What the picker knew when she opened it. Read once; it never changes while she edits. */
export interface OpenedTradePicker {
  /** The first state: every code on her profile ticked. */
  seeded: TradePickerState;
  /** Her picks before this save: the stored answer's codes. */
  storedPicks: string[];
  /** The trades she opened the picker with. */
  categories: string[];
  /** The codes the picker showed; null on the intake form, which shows none. */
  shown: string[] | null;
  /** The codes she had added through the search before this visit (`pickedCodes.ts`, D152). */
  searched: string[];
  /** The codes the "You picked" chip may name (D152). */
  chosen: ReadonlySet<string>;
}

/** Reads the stored answer and her profile once, when the picker opens. */
export function openTradePicker(stored: unknown, profile: ProfileNaics | null): OpenedTradePicker {
  const answer = storedAnswer(stored);
  const bySource = profile?.bySource ?? {};
  return {
    seeded: seedTradePicker(stored, profile),
    storedPicks: naicsCodeList(answer.naics),
    categories: answer.categories,
    shown: profile ? [...profile.codes] : null,
    searched: searchPicksAtOpen(stored, bySource),
    chosen: chosenCodes(stored, bySource),
  };
}

/** What a picker save sends: the stored value, plus the scope on the record. */
export interface TradeSave {
  categories: string[];
  /** Her picks: what is stored, and what goes to `my_business`. */
  naics: string[];
  /** The codes among `naics` that she added through the search (D152). Stored
   *  with the answer; it decides only the "You picked" chip, never matching. */
  searched: string[];
  /** The keep-list and the codes shown. Absent on the intake form. */
  naicsScope?: TradeSaveScope;
}

/**
 * The save of the picker as it stands (D130). On the intake form (no profile)
 * every tick is her pick, as it always was. On the record, `naics` holds her
 * picks only, and `naicsScope` carries the keep-list and the codes shown.
 * Both carry `searched` (D152).
 */
export function tradeSave(state: TradePickerState, opened: OpenedTradePicker): TradeSave {
  const { categories, naics: kept } = tradeAnswer(state);
  if (opened.shown === null) return { categories, naics: kept, searched: searchedAmong(state, opened, kept) };
  const naics = herPicks(state, opened, kept);
  return {
    categories,
    naics,
    searched: searchedAmong(state, opened, naics),
    naicsScope: { kept, shown: [...opened.shown] },
  };
}

/**
 * The codes among `picks` that she added through the search: the ones she had
 * searched before, and the "other" codes she adds now. An "other" code that was
 * not ticked when she opened the picker can only have come from the search box:
 * the profile's own codes are all ticked at open, and a tree tick lands in a
 * trade, not with the other codes. A code she unticks leaves `picks`, so it
 * leaves this list too.
 */
function searchedAmong(state: TradePickerState, opened: OpenedTradePicker, picks: readonly string[]): string[] {
  const inPicks = new Set(picks);
  const tickedAtOpen = new Set(tradeAnswer(opened.seeded).naics);
  const addedNow = state.adhocNaics.filter((code) => !tickedAtOpen.has(code));
  return [...new Set([...opened.searched, ...addedNow])].filter((code) => inPicks.has(code));
}

/**
 * Her picks among the ticked codes: a code she picked before, a code that was
 * not ticked when she opened the picker (she added it), or a code of a trade she
 * picked in this visit. Her earlier picks keep their order, so an untouched save
 * leaves `my_business` byte-equal.
 */
function herPicks(state: TradePickerState, opened: OpenedTradePicker, kept: readonly string[]): string[] {
  const ticked = new Set(kept);
  const earlier = opened.storedPicks.filter((code) => ticked.has(code));
  return [...new Set([...earlier, ...addedThisVisit(state, opened, kept)])];
}

/**
 * The ticked codes she picks in this visit: a code that was not ticked when she
 * opened the picker, or a code of a trade she picked in this visit.
 */
function addedThisVisit(state: TradePickerState, opened: OpenedTradePicker, kept: readonly string[]): string[] {
  const tickedAtOpen = new Set(tradeAnswer(opened.seeded).naics);
  const newTrades = new Set(codesOfTradesPickedNow(state.selection, opened.categories));
  return kept.filter((code) => !tickedAtOpen.has(code) || newTrades.has(code));
}

/** The ticked tree codes of the trades that were not hers when she opened the picker. */
function codesOfTradesPickedNow(selection: TreeSelection, openedWith: readonly string[]): string[] {
  const isNew = (trade: string) => !openedWith.includes(trade);
  const newChild = (id: string) => !openedWith.some((trade) => id.startsWith(childId(trade, "")));
  return categoriesFromSelection({
    parents: selection.parents.filter(isNew),
    children: selection.children.filter(newChild),
  }).naics;
}

/**
 * Takes the scope off a "Your trade" answer before it is saved. The stored
 * value is `{ categories, naics }`; the scope travels beside it in the request
 * body. Any other answer passes through with no scope.
 */
export function splitTradeSave(answer: unknown): { answer: unknown; naicsScope: TradeSaveScope | null } {
  if (!isRecord(answer) || !hasOwnKey(answer, "naicsScope")) return { answer, naicsScope: null };
  const { naicsScope, ...value } = answer;
  return { answer: value, naicsScope: parseTradeSaveScope(naicsScope) };
}

/**
 * Her profile's codes, then each code she excluded that another source still
 * lists. An excluded code that only she listed is left out (owner, 12 Oct
 * 2026): no source gives it and she does not use it. She puts it back through
 * "Add a code".
 */
function listedCodes(profile: ProfileNaics): string[] {
  const onProfile = new Set(profile.codes);
  const excluded = (profile.bySource.excluded ?? [])
    .map((e) => e.code)
    .filter((code) => !onProfile.has(code) && listedByOtherSource(code, profile.bySource));
  return [...profile.codes, ...new Set(excluded)];
}

/**
 * Every code on her profile, in the profile's order, then each code she has
 * excluded that another source lists, with its group, its tick and its source
 * chips. Such an excluded code
 * stays listed, unticked, so she can tick it back: her save then keeps it, and
 * a kept code leaves `excluded` (`tradeNaicsUpdate`). The group is fixed by what she opened the picker with,
 * so a row never moves while she edits. "You picked" shows only on a code she
 * chose (D152): one she chose in her saved answer, or one she picks in this
 * visit while it stays ticked (D156). A code no other source lists is hers
 * all the same (`withOwner`).
 */
export function profileCodeRows(
  state: TradePickerState,
  profile: ProfileNaics,
  opened: OpenedTradePicker,
): ProfileCodeRow[] {
  const ticked = tradeAnswer(state).naics;
  const kept = new Set(ticked);
  const chosen = new Set([...opened.chosen, ...addedThisVisit(state, opened, ticked)]);
  const underTrades = codesUnder(opened.categories);
  return listedCodes(profile).map((code) => ({
    code,
    group: underTrades.has(code) ? "trade" : "other",
    on: kept.has(code),
    chips: withOwner(code, sourceChips(code, chipSources(code, profile.bySource, chosen))),
  }));
}

/**
 * NO CODE IS WITHOUT A SOURCE (Shyam, 9 Oct 2026). A code that SAM, SBA and her
 * capability statement do not list reached her profile through her own answers
 * (a save from before sources were kept, or a code she confirmed into her
 * answer), so it reads as hers. D152 still decides "You picked" for a code that
 * another source also lists.
 */
function withOwner(code: string, chips: SourceChip[]): SourceChip[] {
  return chips.some((chip) => chip.slot === "unattributed")
    ? sourceChips(code, { my_business: { codes: [code] } })
    : chips;
}

/**
 * The ticked codes the table does not already list: the ones she adds in this visit,
 * through "Add a code". Each joins the sources table as a row of her own, under
 * "You added". Unticking one takes it out of the save, so its row goes.
 */
export function addedCodeRows(state: TradePickerState, profile: ProfileNaics): ProfileCodeRow[] {
  const listed = new Set(listedCodes(profile));
  return tradeAnswer(state)
    .naics.filter((code) => !listed.has(code))
    .map((code): ProfileCodeRow => ({
      code,
      group: "other",
      on: true,
      chips: sourceChips(code, { my_business: { codes: [code] } }),
    }));
}

/** The trade tree's parents that list `code`. The tree's labels do not matter here. */
function parentsHolding(code: string): TreeParent[] {
  return buildTradeTree().filter((p) => p.children.some((c) => c.id === childId(p.id, code)));
}

/** Takes `code` out of every trade and out of the other codes. */
function untick(state: TradePickerState, code: string): TradePickerState {
  let selection = state.selection;
  for (const parent of parentsHolding(code)) {
    const id = childId(parent.id, code);
    if (statusOf(parent, selection) === "all" || selection.children.includes(id)) {
      selection = onChildClick(parent, selection, id);
    }
  }
  return { selection, adhocNaics: state.adhocNaics.filter((c) => c !== code) };
}

/** Puts `code` back: under her trade that holds it, else with the other codes. */
function tick(state: TradePickerState, code: string, categories: readonly string[]): TradePickerState {
  const home = parentsHolding(code).find((p) => categories.includes(p.id));
  if (!home) return { ...state, adhocNaics: [...state.adhocNaics, code] };
  return { ...state, selection: onChildClick(home, state.selection, childId(home.id, code)) };
}

/**
 * Ticks or unticks one code on her profile. `categories` are the trades she
 * opened the picker with, the same ones `profileCodeRows` groups by.
 */
export function toggleProfileCode(
  state: TradePickerState,
  code: string,
  categories: readonly string[],
): TradePickerState {
  const on = tradeAnswer(state).naics.includes(code);
  return on ? untick(state, code) : tick(state, code, categories);
}

/**
 * True when she held codes and has unticked every one. A save with no code
 * changes nothing on her profile (Decisions log D46), so the picker must not
 * offer it as though it removed them.
 */
export function keepsNoCode(state: TradePickerState, profile: ProfileNaics): boolean {
  return profile.codes.length > 0 && tradeAnswer(state).naics.length === 0;
}

/** Why the record's Save is off. */
export type TradeSaveBlock = "no_code" | "no_answer";

/**
 * Why the record's Save is off: `no_code` when she held codes and keeps none
 * (`keepsNoCode`), `no_answer` when the save holds no trade and no code of her
 * own. Null when she can save.
 *
 * A trade is not required on the record. An answer can hold her codes with no
 * trade (a proposal she confirmed, a row from before trades were kept), and
 * she must still be able to untick a code that another source gave. A save
 * with neither a trade nor a code of her own is blocked: it stores an empty
 * answer to a required question.
 */
export function tradeSaveBlock(
  state: TradePickerState,
  opened: OpenedTradePicker,
  profile: ProfileNaics,
): TradeSaveBlock | null {
  if (keepsNoCode(state, profile)) return "no_code";
  const save = tradeSave(state, opened);
  return save.categories.length === 0 && save.naics.length === 0 ? "no_answer" : null;
}
