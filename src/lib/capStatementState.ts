// Shared "Capability Statement" state for the profile pages and Hunter.
// DEMO: kept in the demo store (key `profile.capStatement`), so it survives a
// reload and "Reset demo" restores it. The member starts with a capability statement
// on file (PERSONA.capabilityStatementFile in public/demo-files/).

import { PERSONA } from "../demo/story/persona";
import { isoDaysFromNow } from "../demo/story/clock";
import { readDemoState, updateDemoState, useDemoState, writeDemoState } from "../demo/runtime/store";
import type { CapStatementDraft } from "./capStatementBuilder";

export interface CapStatementSnap {
  uploaded: boolean;
  savedAt: string | null;
  /** `uploaded` = the PDF she brought. `ava` = built in the builder. */
  origin: "uploaded" | "ava";
  fileName: string;
  /** The draft Ava saved, so the profile can download it again. */
  draft?: CapStatementDraft;
}

export const CAP_STATEMENT_FILE_NAME = `${PERSONA.businessShortName} — Capability Statement.pdf`;

const KEY = "profile.capStatement";

const seed = (): CapStatementSnap => ({
  uploaded: true,
  savedAt: isoDaysFromNow(-45, 11),
  origin: "uploaded",
  fileName: CAP_STATEMENT_FILE_NAME,
});

export function getCapStatement(): CapStatementSnap {
  return readDemoState<CapStatementSnap>(KEY, seed);
}

/** Ava saved a draft. The statement on file is now Ava's. */
export function markCapStatementSaved(draft?: CapStatementDraft) {
  writeDemoState<CapStatementSnap>(KEY, {
    uploaded: true,
    savedAt: new Date().toISOString(),
    origin: "ava",
    fileName: CAP_STATEMENT_FILE_NAME,
    draft,
  });
}

/** The visitor uploaded another file as her capability statement. */
export function markCapStatementUploaded(fileName: string) {
  writeDemoState<CapStatementSnap>(KEY, {
    uploaded: true,
    savedAt: new Date().toISOString(),
    origin: "uploaded",
    fileName,
  });
}

export function clearCapStatement() {
  updateDemoState<CapStatementSnap>(KEY, seed, (prev) => ({ ...prev, uploaded: false, savedAt: null, draft: undefined }));
}

export function useCapStatementUploaded(): CapStatementSnap {
  const [snap] = useDemoState<CapStatementSnap>(KEY, seed);
  return snap;
}

export const CAP_STATEMENT_CHANGED_EVENT = "cap-statement-changed";
