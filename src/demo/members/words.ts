// Every member's own words (members/<id>/words.ts): its business, people and
// trade. A member's screens must never show another member's words. The story
// check, the market and Grant tests, and demo-storyboard/tools/scan-member.mjs
// read them, so a new member adds its words and nothing else.

import { others } from "../member";

const ALL = import.meta.glob<{ OWN_WORDS: RegExp }>("/src/demo/members/*/words.ts", { eager: true });

/** Every other member's words, as one pattern. */
export const OTHER_MEMBERS_WORDS = new RegExp(others(ALL).map((m) => m.OWN_WORDS.source).join("|"), "i");

/** A pattern that also matches every other member's words. */
export function withOtherMembersWords(base: RegExp): RegExp {
  return new RegExp(`${base.source}|${OTHER_MEMBERS_WORDS.source}`, base.flags.includes("i") ? base.flags : `${base.flags}i`);
}
