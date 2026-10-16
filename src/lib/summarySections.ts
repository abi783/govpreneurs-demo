/** Structured RAG-summary accordions keyed by section. Each value is a list of bullet points. */
export type SummaryAccordions = Partial<Record<string, string[]>> | null | undefined;

/** A renderable summary section: stable id, human title, and its bullet points. */
export interface SummarySection {
  id: string;
  title: string;
  bullets: string[];
}

/**
 * Display order + human titles for the RAG accordion keys. Sections are rendered
 * in this order; any key not listed here is ignored.
 */
const SECTION_DEFS: ReadonlyArray<{ key: string; title: string }> = [
  { key: 'what_the_buyer_needs', title: 'What the buyer needs' },
  { key: 'eligibility_and_compliance', title: 'Eligibility & compliance' },
  { key: 'evaluation_criteria', title: 'Evaluation criteria' },
  { key: 'submission_instructions', title: 'Submission instructions' },
  { key: 'key_dates', title: 'Key dates' },
  { key: 'deliverables', title: 'Deliverables' },
  { key: 'technical_requirements', title: 'Technical requirements' },
  { key: 'personnel_requirements', title: 'Personnel requirements' },
  { key: 'risks_and_gotchas', title: 'Risks & gotchas' },
  { key: 'quick_checklist', title: 'Quick checklist' },
  { key: 'amendment_summary', title: 'Amendment summary' },
  { key: 'edge_cases_and_conflict_handling', title: 'Edge cases & conflicts' },
];

/**
 * Builds the renderable, ordered summary sections from RAG accordions.
 * Sections with no bullets are omitted so nothing empty is ever shown.
 */
export function buildSummarySections(accordions: SummaryAccordions): SummarySection[] {
  if (!accordions) return [];
  const sections: SummarySection[] = [];
  for (const { key, title } of SECTION_DEFS) {
    const bullets = (accordions[key] ?? []).filter((b) => b && b.trim().length > 0);
    if (bullets.length > 0) sections.push({ id: key, title, bullets });
  }
  return sections;
}
