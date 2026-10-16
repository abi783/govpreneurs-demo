// Maps a solicitation clause ref (from an evidence pin) to the coarse doc section it
// lives in, so tapping a pin can jump to that part of the solicitation.
//
// SECTION-level, not clause-level: the mock solicitation isn't clause-structured
// (section bodies are free text), so this is directional — the UI frames it as
// "show in the solicitation," never "the exact clause." Returns null when the ref
// doesn't map to a section (FPDS / profile / web refs never do).
//
// Section ids come from SolicitationDetail (see mock/grantAnalysis SectionId):
//   needs · eligibility · submission · evaluation · dates · risks · checklist · amendments · edge

export function sectionForRef(ref: string): string | null {
  const r = ref.toLowerCase().replace(/^§\s*/, "");
  if (/^app/.test(r)) return "submission"; // appendices — insurance, forms
  if (/^a/.test(r)) return "eligibility"; // §A — set-aside, size standard
  if (/^l/.test(r)) return "submission"; // §L — instructions to offerors
  if (/^m/.test(r)) return "evaluation"; // §M — evaluation factors
  if (/^b/.test(r)) return "needs"; // §B — supplies / services / scope
  if (/^submission/.test(r)) return "submission";
  if (/^notice/.test(r)) return "needs";
  return null;
}

/** The window event a pin dispatches to ask the page to reveal a clause's section. */
export const REVEAL_CLAUSE_EVENT = "grant:reveal-clause";
