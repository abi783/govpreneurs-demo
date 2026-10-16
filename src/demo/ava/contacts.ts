// DEMO: the people in Ava's papers, read from one place.
//
// The buyer's contact. The opportunity page names a contracting officer for
// each opportunity (src/demo/grant/facts.ts, `contactFor`). Ava's papers name
// the person the member must email or ask, so they take the same person. If two
// pages named two people for one bid, a buyer on a call would notice.
//
// The member's references. Three bids ask for the same three people (Janet
// Reyes, Mike Sutton and Pastor David Hall), so each person has one phone number
// and one email, whichever bid asks.

import { contactFor, type Contact } from "../grant/facts";
import { getOpportunity } from "../story/opportunities";

/** The buyer's two contacts for a bid: who the opportunity page names first, and second. */
export function buyerPeople(noticeId: string): { primary: Contact; second: Contact } {
  const opp = getOpportunity(noticeId);
  if (!opp) throw new Error(`No opportunity ${noticeId} in the story`);
  return { primary: contactFor(opp), second: contactFor(opp, true) };
}

export interface ReferenceContact {
  phone: string;
  email: string;
}

/** The member's three references. Janet Reyes matches the Government Buyers page. */
export const REFERENCE_CONTACTS = {
  janetReyes: { phone: "(910) 555-0183", email: "j.reyes@ccs.k12.nc.us.sample" },
  mikeSutton: { phone: "(910) 555-0172", email: "mike.sutton@carolinadininggroup.example" },
  pastorHall: { phone: "(910) 555-0191", email: "pastor.hall@riversidefellowship.example" },
} as const satisfies Record<string, ReferenceContact>;

/** The member's tax ID, as she types it on a W-9. One number for every bid. */
export const MEMBER_EIN = "84-2619047";
