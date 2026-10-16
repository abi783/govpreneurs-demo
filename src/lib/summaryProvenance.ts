/**
 * summaryProvenance.ts — how a summary's source is described to the member.
 *
 * The backend produces summaries from the best source an opportunity actually
 * has: its solicitation documents, the notice text alone, or just the posting's
 * structured fields. Some opportunities have none of those. Rather than showing
 * every summary as though it carried the same authority — or showing a hopeful
 * "not available yet" for an opportunity where nothing is ever coming — the UI
 * states where each one came from, and says plainly when there is nothing.
 */

export type SummarySource = "rag" | "notice" | "metadata" | "none";

/**
 * Shown when the opportunity has no summary source at all — permanent, and the
 * reason is stated so the member knows not to wait for one.
 */
export const NO_SUMMARY_TEXT =
  "We don't have enough data on this opportunity. The buyer posted it without a description, documents, or a work category.";

/**
 * Shown when a summary is absent for any other reason (typically not summarized
 * yet). Deliberately not a promise that one is coming — it states what we have.
 */
export const NO_SUMMARY_YET_TEXT = "We don't have enough data on this opportunity yet.";

/** A notice-tier summary, and the posting has no documents. */
export const NOTICE_NO_DOCUMENTS_CAPTION =
  "Based on the notice text — no documents were attached to this posting.";
/** A metadata-tier summary, and the posting has no documents. */
export const METADATA_NO_DOCUMENTS_CAPTION =
  "Built from the posting's own details — this notice has no description or documents.";
/** A thin summary that the backend will rewrite from the attached documents. */
export const READING_DOCUMENTS_CAPTION =
  "Based on the notice for now. We are reading the attached documents to build a fuller summary.";

/** What the page knows about the posting's documents. */
export interface DocumentState {
  /** The posting lists at least one document. */
  hasDocuments: boolean;
  /**
   * The backend will rewrite this summary from the documents. Absent reads as
   * false, so a backend without the field never makes the page promise one.
   */
  rewritePending?: boolean;
}

/**
 * One-line provenance caption, or null when no caption is warranted (a
 * document-backed summary is the expected case and needs no apology).
 *
 * `quickSummary` is required because a caption describes where a summary came
 * from — with no summary to describe, every caption becomes a claim about the
 * posting instead of about our text. No summary, no caption.
 *
 * "No documents" is said only when the posting lists none. A thin summary can
 * sit beside documents: they arrived after it was written. Then the caption
 * says the documents are being read if a rewrite is coming. If no rewrite is
 * coming there is no caption: "no documents" is false, and "reading the
 * documents" promises a summary nothing will write.
 */
export function summaryCaption(
  source: SummarySource | undefined,
  quickSummary: string | null | undefined,
  docs: DocumentState,
): string | null {
  if (!quickSummary?.trim()) return null;
  if (source !== "notice" && source !== "metadata") return null;
  if (!docs.hasDocuments) {
    return source === "notice" ? NOTICE_NO_DOCUMENTS_CAPTION : METADATA_NO_DOCUMENTS_CAPTION;
  }
  return docs.rewritePending ? READING_DOCUMENTS_CAPTION : null;
}

/**
 * The summary text to render: the real summary when there is one, otherwise the
 * explicit "not enough data" line. Never a synthesized stand-in sentence.
 */
export function summaryText(
  quickSummary: string | null | undefined,
  source: SummarySource | undefined,
): string {
  const text = quickSummary?.trim();
  if (text) return text;
  return source === "none" ? NO_SUMMARY_TEXT : NO_SUMMARY_YET_TEXT;
}
