// Every set-aside the story uses, in one table: who may bid, and the words
// Hunter, Grant and the forecasts use for it. The member holds the codes in
// PERSONA.setAsideEligibility; her own is the first she holds that is more
// than plain small business. Every sentence that says "you are woman-owned"
// reads this instead, so a HUBZone or veteran-owned member hears her own.

import { PERSONA } from "./persona";
import type { SetAside } from "./opportunities";

export type SetAsideCode = NonNullable<SetAside>;

export interface SetAsideWords {
  /** Grant's label: "Women-Owned Small Business (WOSB) set-aside". */
  label: string;
  /** "woman-owned": "a woman-owned set-aside". */
  short: string;
  /** Hunter's readiness card: "Woman-owned (WOSB)". */
  name: string;
  /** "Small Business and Woman-Owned (WOSB)": the set-asides a member holds, in a list. */
  title: string;
  /** "woman-owned small businesses": "Only … can compete". */
  firms: string;
  /** A count on a list: "3 woman-owned (WOSB)". */
  counted: string;
  /** "you are woman-owned (WOSB)". */
  youAre: string;
  /** "a woman-owned small business": "You are …". */
  aBusiness: string;
  /** The compare table: "Woman-owned only". */
  only: string;
  /** The question a member asks: "What is a WOSB set-aside?". */
  abbr: string;
  /** Words the feed search matches. */
  words: string;
  /** The Hunter filter drawer's ids for it. */
  filterIds: string[];
  /** The certificate a buyer checks: "SBA woman-owned small business". */
  certificate: string;
  /** A count without the code: "3 woman-owned". */
  plain: string;
  /** What she does not hold: "You do not hold the woman-owned (WOSB) status". */
  program: string;
  /** The question chip: "What is a WOSB set-aside?". */
  whatIs: string;
}

export const SET_ASIDES: Record<SetAsideCode, SetAsideWords> = {
  SBA: {
    label: "Total Small Business set-aside",
    short: "small-business",
    name: "Small business",
    title: "Small Business",
    firms: "small businesses",
    counted: "small business",
    youAre: "you are a small business",
    aBusiness: "a small business",
    only: "Small business only",
    abbr: "small business",
    words: "sba small business set-aside",
    filterIds: ["SB"],
    certificate: "SBA small business size",
    plain: "small business",
    program: "small business",
    whatIs: "What is a small business set-aside?",
  },
  WOSB: {
    label: "Women-Owned Small Business (WOSB) set-aside",
    short: "woman-owned",
    name: "Woman-owned (WOSB)",
    title: "Woman-Owned (WOSB)",
    firms: "woman-owned small businesses",
    counted: "woman-owned (WOSB)",
    youAre: "you are woman-owned (WOSB)",
    aBusiness: "a woman-owned small business",
    only: "Woman-owned only",
    abbr: "WOSB",
    words: "wosb woman-owned women-owned woman owned set-aside",
    filterIds: ["WOSB"],
    certificate: "SBA woman-owned small business",
    plain: "woman-owned",
    program: "woman-owned (WOSB)",
    whatIs: "What is a WOSB set-aside?",
  },
  SDVOSBC: {
    label: "Service-Disabled Veteran-Owned Small Business (SDVOSB) set-aside",
    short: "service-disabled veteran-owned",
    name: "Service-disabled veteran-owned (SDVOSB)",
    title: "Service-Disabled Veteran-Owned (SDVOSB)",
    firms: "service-disabled veteran-owned firms",
    counted: "veteran-owned",
    youAre: "you are service-disabled veteran-owned (SDVOSB)",
    aBusiness: "a service-disabled veteran-owned small business",
    only: "Veteran-owned only",
    abbr: "SDVOSB",
    words: "sdvosb service-disabled veteran-owned set-aside",
    filterIds: ["VOSB"],
    certificate: "SBA VetCert service-disabled veteran-owned",
    plain: "veteran-owned",
    program: "veteran-owned (SDVOSB)",
    whatIs: "What is an SDVOSB set-aside?",
  },
  HZC: {
    label: "HUBZone set-aside",
    short: "HUBZone",
    name: "HUBZone",
    title: "HUBZone",
    firms: "HUBZone small businesses",
    counted: "HUBZone",
    youAre: "you are HUBZone-certified",
    aBusiness: "a HUBZone small business",
    only: "HUBZone only",
    abbr: "HUBZone",
    words: "hubzone hub zone set-aside",
    filterIds: ["HUBZone"],
    certificate: "SBA HUBZone",
    plain: "HUBZone",
    program: "HUBZone",
    whatIs: "What is a HUBZone set-aside?",
  },
  "8A": {
    label: "8(a) set-aside",
    short: "8(a)",
    name: "8(a)",
    title: "8(a)",
    firms: "firms in the SBA's 8(a) program",
    counted: "8(a)",
    youAre: "you are in the 8(a) program",
    aBusiness: "an 8(a) small business",
    only: "8(a) only",
    abbr: "8(a)",
    words: "8a 8(a) set-aside",
    filterIds: ["8A"],
    certificate: "SBA 8(a) program",
    plain: "8(a)",
    program: "8(a)",
    whatIs: "What is an 8(a) set-aside?",
  },
};

/** The member's set-asides, plain small business first. */
export const HELD: SetAsideCode[] = (["SBA", "WOSB", "SDVOSBC", "HZC", "8A"] as const).filter((c) =>
  (PERSONA.setAsideEligibility as readonly string[]).includes(c),
);

/** True when the member can compete for the set-aside (or there is none). */
export function holds(code: string | null | undefined): boolean {
  return !code || (HELD as string[]).includes(code);
}

/** Her own set-aside: the first she holds that is more than plain small business. */
export const OWN: SetAsideCode = HELD.find((c) => c !== "SBA") ?? "SBA";

/** "Small Business and Woman-Owned (WOSB)". */
export const HELD_TITLES = andList(HELD.map((c) => SET_ASIDES[c].title));

/** "A and B", "A, B and C". */
export function andList(items: string[], word = "and"): string {
  return items.length <= 2 ? items.join(` ${word} `) : `${items.slice(0, -1).join(", ")} ${word} ${items.at(-1)}`;
}

/** "a woman-owned set-aside", "an 8(a) set-aside". */
export function aSetAside(code: SetAsideCode): string {
  const s = SET_ASIDES[code].short;
  return `${s.startsWith("8") ? "an" : "a"} ${s} set-aside`;
}

/** The set-aside programs a member may not hold, in the order Hunter names them. */
export const PROGRAMS: SetAsideCode[] = ["WOSB", "SDVOSBC", "8A", "HZC"];

/** Hunter's chips for her own set-aside. */
export const SHOW_OWN = `Show only ${SET_ASIDES[OWN].short} set-asides`;
export const WHAT_IS_OWN = SET_ASIDES[OWN].whatIs;

/** "A, B or C" (no comma before "or"). */
export function orList(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;
}
