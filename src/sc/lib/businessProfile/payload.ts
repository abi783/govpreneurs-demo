/**
 * payload.ts — the wire contract between `read.ts` and every screen.
 * ENTITY LAYER: types only, zero runtime, zero imports outside the entity layer.
 *
 * FRAME. F7 produces it, F12–F15 consume it. Nothing here is stubbed because
 * there is nothing to implement — a type declaration is the whole artifact.
 *
 * ── WHY IT LIVES IN `lib`, NOT IN THE COMPONENT FOLDER ────────────────────
 * `read.ts` (adapter) builds it and client components (framework) consume it.
 * If the types lived next to the components, `read.ts` would import upward and
 * the Dependency Rule would be broken by the one file most likely to be copied.
 * Types-only, so it costs nothing at runtime in either direction.
 *
 * ── ONE ROUND TRIP ────────────────────────────────────────────────────────
 * EVERY mutation returns this whole payload. Today a save is a PUT followed by
 * a full re-GET; F7's criterion is one request per save. That is also what lets
 * the rail's count decrement in the same render as a confirm (F13) — the client
 * never has to reconcile two responses.
 *
 * ── `confidenceTag` IS NOT IN THIS FILE, AND THAT IS THE POINT ────────────
 * It is stored for audit and NEVER rendered. Leaving it out of the payload is
 * the enforcement: a component cannot render a field it was never sent.
 */

import type { MbValue } from "./mbValue";
import type { PartId } from "./parts";
import type { ProfileFieldState } from "./registry";
import type { NaicsBySource } from "@sc/lib/naics/naicsBySource";

/** Her NAICS codes as matching reads them (`SuccessCenter.naicsCodes`), and
 *  which source gave each (`naicsBySource`). The "Your trade" picker starts
 *  from these, so a save she did not touch keeps every code (SPEC §A.5). */
export interface ProfileNaics {
  codes: string[];
  bySource: NaicsBySource;
}

/**
 * Structured citation behind a value. Mirrors `Provenance` minus `ref`, which
 * is an addressing string and is NEVER rendered raw.
 *
 * NOTE: `src/components/business/types.ts` declares a near-identical
 * `ApiProvenance`. The duplication is deliberate and bounded: pointing this
 * file at the component one would invert the dependency. It outlived the page
 * it was written for — `/intake` still reads it through `QuestionCard`,
 * `FieldRow` and `SourceSheet` — so do not "unify" them by importing upward.
 */
export interface ProvenancePayload {
  type: string;
  sourceLabel: string | null;
  locator: string | null;
  quote: string | null;
  excerpt: { before?: string; span: string; after?: string } | null;
  retrievedAt: string | null;
  conversation: Record<string, unknown> | null;
  unavailable: { reason?: string; used_in_analysis?: boolean } | null;
}

/** One row of the record, already lifted through `toMb`. */
export interface RecordFieldPayload {
  fieldKey: string;
  catalogId: string;
  part: PartId;
  /** THE READER-SIDE INVARIANT: an `MbValue`, never the raw stored JSON. */
  value: MbValue;
  state: ProfileFieldState;
  /** Member-facing prose. Never parsed, never compared against. */
  origin: string;
  /** The machine channel. Routing reads this; the member never sees it. */
  originKey: string | null;
  freshnessLabel: string;
  confirmedAt: string | null;
  expiresAt: string | null;
  /** Set once, permanently. A decline that evaporates on reload is nagging
   *  with extra steps. */
  declinedAt: string | null;
  /** Both values kept with their origins until she picks. Never auto-merged. */
  conflict: { incoming: MbValue; incomingOrigin: string; detectedAt: string } | null;
  errorMessage: string | null;
  provenance: ProvenancePayload | null;
}

/** An unconfirmed extraction waiting for her. NOT part of the record. */
export interface ProposalPayload {
  id: string;
  fieldKey: string;
  catalogId: string;
  part: PartId;
  value: MbValue;
  /** What she reads on the card. */
  origin: string;
  /** The machine channel it arrived on. Never rendered — it decides what the
   *  card ASKS of her, which is not the same question for every channel. */
  originKey: string;
  /** Her own sentence, when spoken — so "why does it think that" is answerable
   *  in her words. */
  heard: string | null;
  proposedAt: string;
  provenance: ProvenancePayload | null;
}

/** `filling` → `ready` → `sent`. `sent` is terminal. */
export type HandoffMode = "filling" | "ready" | "sent";

export interface MyBusinessPayload {
  fields: RecordFieldPayload[];
  proposals: ProposalPayload[];
  /** A COUNT, NEVER A PERCENTAGE. `total` is fixed at 14 and is never widened;
   *  only `attested`/`verified` count, and a proposal is not an answer. */
  counter: { answered: number; total: number };
  handoff: {
    mode: HandoffMode;
    sentAt: string | null;
    sentMentor: string | null;
  };
  /** Live `SuccessCenter` columns — shared with the portal home's cards, which
   *  is what makes the picture/logo rows two-way. */
  media: { photoUrl: string | null; logoUrl: string | null };
  /** Live `SuccessCenter` NAICS columns, for the "Your trade" picker. */
  naics: ProfileNaics;
  onboarding: {
    cohort: string;
    callAt: string | null;
    mentorName: string | null;
    llcUploadedAt: string | null;
    profileDueAt: string | null;
    /** The positioning call is behind her. Turns on the second deadline. */
    callHasHappened: boolean;
    /** A week after that call, for the rest of the record. */
    fullRecordDueAt: string | null;
    /** The roadmap-side LLC verification, so the LlcCard can show the
     *  review-and-confirm step (or the verified state) — null before any
     *  upload has been checked. */
    llcVerification: {
      status: string;
      message: string | null;
      requiresConfirmation: boolean;
      legalName: string | null;
    } | null;
  };
}
