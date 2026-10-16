// DEMO: builds the `MyBusinessPayload` from the demo state.
//
// This is the demo version of `getBusinessProfile` in the Success Center
// (`src/lib/businessProfile/read.ts`). It reads rows from the store instead of
// Postgres and runs the same pure functions: `toMb` lifts a stored value, `catalogFor`
// finds the question, `freshnessLabelFor` re-derives "3 months ago", and
// `handoffMode` decides filling, ready or sent.

import { BEFORE_FIRST_CALL_TOTAL, basicInfoAnswered, catalogFor } from "@sc/lib/businessProfile/catalog";
import { catalogIdFor } from "@sc/lib/businessProfile/crosswalk";
import { freshnessLabelFor } from "@sc/lib/businessProfile/freshness";
import { handoffMode } from "@sc/lib/businessProfile/handoff";
import { toMb } from "@sc/lib/businessProfile/legacyShapes";
import type {
  MyBusinessPayload,
  ProposalPayload,
  RecordFieldPayload,
} from "@sc/lib/businessProfile/payload";
import type { ProfileFieldState } from "@sc/lib/businessProfile/registry";
import { naicsCodeList } from "@sc/lib/naics/naicsBySource";
import type { DemoBusinessState, DemoFieldRow, DemoProposal } from "./types";

const dateOrNull = (iso: string | null): Date | null => (iso ? new Date(iso) : null);

function fieldPayload(
  row: DemoFieldRow,
  sibling: (key: string) => unknown,
  now: Date,
): RecordFieldPayload | null {
  const catalog = catalogFor(row.fieldKey);
  const catalogId = catalogIdFor(row.fieldKey);
  if (!catalog || !catalogId) return null;
  return {
    fieldKey: row.fieldKey,
    catalogId,
    part: catalog.part,
    value: toMb(row.fieldKey, row.value, sibling),
    state: row.state as ProfileFieldState,
    origin: row.origin,
    originKey: row.originKey,
    freshnessLabel: freshnessLabelFor(
      {
        freshnessLabel: row.freshnessLabel,
        attestedAt: dateOrNull(row.attestedAt),
        verifiedAt: dateOrNull(row.verifiedAt),
        confirmedAt: dateOrNull(row.confirmedAt),
        updatedAt: new Date(row.updatedAt),
      },
      now,
    ),
    confirmedAt: row.confirmedAt,
    expiresAt: row.expiresAt,
    declinedAt: row.declinedAt,
    conflict: null,
    errorMessage: row.errorMessage,
    provenance: row.provenance,
  };
}

function proposalPayload(p: DemoProposal): ProposalPayload | null {
  const catalog = catalogFor(p.fieldKey);
  const catalogId = catalogIdFor(p.fieldKey);
  if (!catalog || !catalogId) return null;
  return {
    id: p.id,
    fieldKey: p.fieldKey,
    catalogId,
    part: catalog.part,
    value: toMb(p.fieldKey, p.value),
    origin: p.origin,
    originKey: p.originKey,
    heard: p.heard,
    proposedAt: p.proposedAt,
    provenance: p.provenance,
  };
}

/** The record as the screens read it. `now` is one clock for the whole payload. */
export function buildPayload(state: DemoBusinessState, now: Date = new Date()): MyBusinessPayload {
  const byKey = new Map(state.rows.map((r) => [r.fieldKey, r.value]));
  const sibling = (key: string) => byKey.get(key);

  const fields = state.rows
    .map((row) => fieldPayload(row, sibling, now))
    .filter((f): f is RecordFieldPayload => f !== null);

  // Newest first, like the real query.
  const proposals = state.proposals
    .filter((p) => p.status === "open")
    .sort((a, b) => new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime())
    .map(proposalPayload)
    .filter((p): p is ProposalPayload => p !== null);

  const answered = basicInfoAnswered(state.rows);
  const sentAt = state.intakeSentAt ? new Date(state.intakeSentAt) : null;

  return {
    fields,
    proposals,
    counter: { answered, total: BEFORE_FIRST_CALL_TOTAL },
    handoff: {
      mode: handoffMode({ answered, total: BEFORE_FIRST_CALL_TOTAL, sentAt }),
      sentAt: state.intakeSentAt,
      sentMentor: state.intakeSentMentor,
    },
    media: { photoUrl: state.media.photoUrl, logoUrl: state.media.logoUrl },
    naics: { codes: naicsCodeList(state.naicsCodes), bySource: state.naicsBySource },
    onboarding: {
      cohort: state.onboarding.cohort,
      callAt: state.onboarding.callAt,
      mentorName: state.onboarding.mentorName,
      llcUploadedAt: state.onboarding.llcUploadedAt,
      profileDueAt: state.onboarding.profileDueAt,
      callHasHappened: state.onboarding.callHasHappened,
      fullRecordDueAt: state.onboarding.fullRecordDueAt,
      llcVerification: state.llcVerification,
    },
  };
}
