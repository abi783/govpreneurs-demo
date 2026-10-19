// DEMO: the shape of the My Business data that the demo keeps in the store.
//
// The real page reads these rows from Postgres (`ProfileField`, `ProfileProposal`,
// `MemberOnboarding`, `MemberValidation`, and some `SuccessCenter` columns). The demo
// keeps the same rows in one store value, so every save, upload and send is still
// there after a reload. `payload.ts` turns this state into the `MyBusinessPayload`
// that the lifted components read.

import type { ProvenancePayload } from "@sc/lib/businessProfile/payload";
import type { NaicsBySource } from "@sc/lib/naics/naicsBySource";
import type { ProfileFieldState } from "@sc/lib/businessProfile/registry";

/** One stored answer. The `value` is the raw stored JSON, not an `MbValue`. */
export interface DemoFieldRow {
  fieldKey: string;
  value: unknown;
  state: ProfileFieldState;
  /** The words the member reads ("You told us"). */
  origin: string;
  /** The machine channel ("member.typed"). */
  originKey: string | null;
  freshnessLabel: string;
  /** ISO timestamps. */
  confirmedAt: string | null;
  attestedAt: string | null;
  verifiedAt: string | null;
  updatedAt: string;
  expiresAt: string | null;
  declinedAt: string | null;
  conflict: unknown;
  errorMessage: string | null;
  provenance: ProvenancePayload | null;
}

export type DemoProposalStatus = "open" | "confirmed" | "rejected" | "superseded";

/** One suggestion that waits for a yes or a no. */
export interface DemoProposal {
  id: string;
  fieldKey: string;
  /** The stored shape of the field, lowered with `fromMb`. */
  value: unknown;
  originKey: string;
  origin: string;
  heard: string | null;
  provenance: ProvenancePayload | null;
  proposedAt: string;
  status: DemoProposalStatus;
}

/** A file the visitor uploaded (the demo keeps its name and size, not its bytes). */
export interface DemoDocument {
  id: string;
  kind: string;
  name: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: string;
  fieldKey: string | null;
}

export interface DemoLlcVerification {
  status: string;
  message: string | null;
  requiresConfirmation: boolean;
  legalName: string | null;
}

/** One finding of the Digital Compliance audit (see `lib/digitalCompliance.ts`). */
export interface DemoPreCheck {
  itemKey: string;
  itemTitle: string;
  status: "pass" | "fail" | "needs_review" | "skipped" | "not_applicable" | "refused";
  evidence?: string;
}

export interface DemoDigitalAudit {
  inputs: Record<string, string>;
  checkedAt: string;
  preCheck: DemoPreCheck[];
}

export interface DemoBusinessState {
  rows: DemoFieldRow[];
  proposals: DemoProposal[];
  intakeSentAt: string | null;
  intakeSentMentor: string | null;
  media: { photoUrl: string | null; logoUrl: string | null };
  /** `SuccessCenter.naicsCodes` and `naicsBySource`. */
  naicsCodes: string[];
  naicsBySource: NaicsBySource;
  onboarding: {
    cohort: string;
    callAt: string | null;
    mentorName: string | null;
    llcUploadedAt: string | null;
    profileDueAt: string | null;
    callHasHappened: boolean;
    fullRecordDueAt: string | null;
  };
  llcVerification: DemoLlcVerification | null;
  digital: DemoDigitalAudit | null;
  documents: DemoDocument[];
}
