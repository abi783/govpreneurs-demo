// DEMO: the section-coverage ledger. It proves the whole solicitation was read:
// every section of the sample solicitation has a line, an owner and a state.

import type { CoverageState, SectionCoverage } from "@/lib/grant/types";
import { rt } from "./rich";
import type { Solicitation } from "./solicitation";

const OWNERS: string[][] = [
  ["S1", "S9"],
  ["S4", "S10"],
  ["S5", "S9"],
  ["S5", "S10"],
  ["S1", "S7", "S10"],
  ["S1"],
  ["S2", "S9", "S6"],
];

/** One ledger line for each section. `flags` marks sections whose reading changed the call. */
export function coverageFor(sol: Solicitation, flags: Record<string, CoverageState> = {}): SectionCoverage[] {
  return sol.sections.map((s, i) => {
    const heads = s.clauses.map((c) => c.heading.toLowerCase());
    const shown = heads.slice(0, 3).join(", ");
    return {
      section: s.id,
      title: s.title,
      owners: OWNERS[i % OWNERS.length],
      finding: rt(
        s.clauses.length === 1
          ? `${s.clauses[0].heading}: read in full.`
          : `${s.clauses.length} clauses read: ${shown}${heads.length > 3 ? ", and more" : ""}.`,
      ),
      state: flags[s.id] ?? "reviewed_complete",
    };
  });
}
