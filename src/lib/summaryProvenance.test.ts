import { describe, expect, it } from "vitest";
import {
  METADATA_NO_DOCUMENTS_CAPTION,
  NO_SUMMARY_TEXT,
  NO_SUMMARY_YET_TEXT,
  NOTICE_NO_DOCUMENTS_CAPTION,
  READING_DOCUMENTS_CAPTION,
  summaryCaption,
  summaryText,
} from "./summaryProvenance";

describe("summaryText", () => {
  it("returns the real summary when there is one", () => {
    expect(summaryText("The city is buying 5,000 tons of asphalt.", "notice")).toBe(
      "The city is buying 5,000 tons of asphalt.",
    );
  });

  it("states the reason only when the posting genuinely has no source", () => {
    expect(summaryText(null, "none")).toBe(NO_SUMMARY_TEXT);
  });

  it("does not claim a reason for an opportunity that simply is not summarized", () => {
    // The permanent copy asserts the buyer posted no description, documents or
    // work category. Saying that about an opportunity that has all three is a
    // false statement about the buyer, not a missing-data message.
    for (const source of ["rag", "notice", "metadata", undefined] as const) {
      expect(summaryText(null, source)).toBe(NO_SUMMARY_YET_TEXT);
    }
  });

  it("treats whitespace as absent", () => {
    expect(summaryText("   ", "notice")).toBe(NO_SUMMARY_YET_TEXT);
  });
});

describe("summaryCaption", () => {
  const SUMMARY = "The city is buying 5,000 tons of asphalt.";
  const NO_DOCS = { hasDocuments: false, rewritePending: false };
  const DOCS_STALE = { hasDocuments: true, rewritePending: false };
  const DOCS_READING = { hasDocuments: true, rewritePending: true };

  it("says no documents were attached only when there are none", () => {
    expect(summaryCaption("notice", SUMMARY, NO_DOCS)).toBe(NOTICE_NO_DOCUMENTS_CAPTION);
    expect(summaryCaption("metadata", SUMMARY, NO_DOCS)).toBe(METADATA_NO_DOCUMENTS_CAPTION);
  });

  it("never says no documents were attached when documents are listed", () => {
    for (const source of ["notice", "metadata"] as const) {
      for (const docs of [DOCS_STALE, DOCS_READING]) {
        const caption = summaryCaption(source, SUMMARY, docs) ?? "";
        expect(caption).not.toContain("no documents");
        expect(caption).not.toContain("no description or documents");
      }
    }
  });

  it("says the documents are being read while a rewrite is coming", () => {
    expect(summaryCaption("notice", SUMMARY, DOCS_READING)).toBe(READING_DOCUMENTS_CAPTION);
    expect(summaryCaption("metadata", SUMMARY, DOCS_READING)).toBe(READING_DOCUMENTS_CAPTION);
  });

  it("shows no caption when documents are attached but no rewrite is coming", () => {
    // An embed that failed for good leaves the thin summary in place. "No
    // documents" is false and "reading the documents" promises what nothing will
    // do, so the page says nothing (owner's call, 2026-09-24).
    expect(summaryCaption("notice", SUMMARY, DOCS_STALE)).toBeNull();
    expect(summaryCaption("metadata", SUMMARY, DOCS_STALE)).toBeNull();
  });

  it("reads an absent rewrite flag as no rewrite coming", () => {
    // A backend that has not shipped the field must never make the page promise.
    expect(summaryCaption("notice", SUMMARY, { hasDocuments: true })).toBeNull();
  });

  it("stays silent for a document-backed summary", () => {
    for (const docs of [NO_DOCS, DOCS_STALE, DOCS_READING]) {
      expect(summaryCaption("rag", SUMMARY, docs)).toBeNull();
    }
  });

  it("never captions when there is no summary to describe", () => {
    // Both the notice and metadata wordings assert the posting has no documents.
    // With no summary present that stops describing our text and becomes a claim
    // about the posting — false for an opportunity whose documents were fetched
    // and whose embedding then failed, which is exactly what reaches here.
    for (const source of ["rag", "notice", "metadata", "none", undefined] as const) {
      for (const docs of [NO_DOCS, DOCS_STALE, DOCS_READING]) {
        expect(summaryCaption(source, null, docs)).toBeNull();
        expect(summaryCaption(source, "", docs)).toBeNull();
        expect(summaryCaption(source, "   ", docs)).toBeNull();
      }
    }
  });
});
