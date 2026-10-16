// Every invented person has one name, one role and one employer on every page.
// A buyer contact on one page must never be a GovPreneurs mentor on another, and
// one contracting officer must not work for the Army and the Navy.
//
// names.test.ts checks the names that sit in the source as `name: "First Last"`.
// This test reads the people as the pages build them, so it also sees the names
// that a function makes (buyer contacts on the opportunity pages) and the names
// that a helper call writes (`sblo("id", "First Last", ...)` on the Government
// Buyers page).

import { describe, expect, it } from "vitest";
import { BENCH } from "./sc/mentors/bench";
import { BUYER_SEED } from "./explore/buyersData";
import { contactFor } from "./grant/facts";
import { PROGRAM_SPECIALIST } from "./sc/home/people";
import { OPPORTUNITIES } from "./story/opportunities";
import { KEY_PARTNER, MENTOR, PAST_PERFORMANCE, PERSONA } from "./story/persona";

/** The people who work for GovPreneurs or for Amira. No buyer contact may share their name. */
function ourPeople(): Map<string, string> {
  const out = new Map<string, string>();
  out.set(PERSONA.ownerName, "the member");
  out.set(MENTOR.name, "mentor");
  out.set(PROGRAM_SPECIALIST.name, "program specialist");
  out.set(KEY_PARTNER.contact, "partner contact");
  for (const m of BENCH) out.set(m.name, "mentor");
  for (const p of PAST_PERFORMANCE) if (p.referenceName) out.set(p.referenceName, "reference");
  return out;
}

describe("invented people", () => {
  it("no buyer contact shares a name with a mentor, a staff member or a reference", () => {
    const ours = ourPeople();
    const clashes: string[] = [];
    for (const b of BUYER_SEED) {
      for (const o of b.officers) {
        const mine = ours.get(o.name);
        // Janet Reyes is both the reference and the Cumberland County Schools food program manager. That is one person.
        if (mine && !(mine === "reference" && /Child Nutrition/.test(o.notes ?? ""))) {
          clashes.push(`${o.name}: ${mine} and ${o.role} at ${b.name}`);
        }
      }
    }
    for (const opp of OPPORTUNITIES) {
      for (const secondary of [false, true]) {
        const c = contactFor(opp, secondary);
        const mine = ours.get(c.name);
        if (mine) clashes.push(`${c.name}: ${mine} and ${c.title} at ${opp.agency}`);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("each buyer contact works for one buyer, with one title, on the opportunity pages", () => {
    const places = new Map<string, Set<string>>();
    const titles = new Map<string, Set<string>>();
    for (const opp of OPPORTUNITIES) {
      for (const secondary of [false, true]) {
        const c = contactFor(opp, secondary);
        if (!places.has(c.name)) places.set(c.name, new Set());
        if (!titles.has(c.name)) titles.set(c.name, new Set());
        // Two federal buyers inside one department count as one employer: "Department of the Army" has many offices.
        places.get(c.name)!.add(opp.agency);
        titles.get(c.name)!.add(c.title);
      }
    }
    const moved = [...places.entries()].filter(([, a]) => a.size > 1).map(([n, a]) => `${n}: ${[...a].join(" / ")}`);
    const retitled = [...titles.entries()].filter(([, t]) => t.size > 1).map(([n, t]) => `${n}: ${[...t].join(" / ")}`);
    expect(moved).toEqual([]);
    expect(retitled).toEqual([]);
  });

  it("each person on the Government Buyers page has one name at one buyer", () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const b of BUYER_SEED) {
      for (const o of b.officers) {
        const was = seen.get(o.name);
        if (was && was !== b.id) dup.push(`${o.name}: ${was} and ${b.id}`);
        seen.set(o.name, b.id);
      }
    }
    expect(dup).toEqual([]);
  });

  it("the second contact is a different person from the first", () => {
    const same = OPPORTUNITIES.filter((o) => contactFor(o).name === contactFor(o, true).name).map((o) => o.id);
    expect(same).toEqual([]);
  });
});
