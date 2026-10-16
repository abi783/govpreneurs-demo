/**
 * Which PRD §11 event a request on this route family IS. A pure mapping.
 *
 * The three intake events were fired by `BusinessProfileClient.tsx` and died
 * with it. §11 says "ship with these or §12 cannot be evaluated", and §12's
 * extraction acceptance — `confirmed ÷ (confirmed + corrected)` — is what goes
 * dark without them.
 *
 * THE REQUEST DECIDES, NOT THE CALL SITE. Four screens save an answer and all
 * go through `request.ts`'s `call`, the only `fetch` on the surface, so the
 * event is derived from the request made rather than announced by whoever made
 * it — a fifth screen is counted without being told to be.
 *
 * The field key is validated, not assumed: `POST …/handoff` and
 * `POST …/{fieldKey}` are the same shape, and `isKnownFieldKey` is what tells
 * them apart, so a route added beside `handoff` cannot be logged as a field.
 *
 * A decline is not an answer, and `resolve-conflict` is a choice between two
 * extractions rather than one accepted or corrected; both map to nothing.
 */

import { isKnownFieldKey } from "./crosswalk";
import type { MyBusinessPayload } from "./payload";

/** The five §11 types this surface can honestly produce. All five are already
 *  in the track route's `KNOWN_TYPES`; none is added by this feature. */
export const INTAKE_EVENT = {
  opened: "intake_opened",
  answered: "intake_field_answered",
  /** An extraction she accepted — §12's numerator. See the note below. */
  confirmed: "intake_field_confirmed",
  /** An extraction she rejected — the denominator's other half. */
  corrected: "intake_field_corrected",
  /** She sent the intake to her mentor. Fired ONCE, on the send that actually
   *  stamps `intakeSentAt` — never on a reload or a repeat send. */
  completed: "intake_completed",
  /** One document stored. Fired on the upload that landed, not on the save that
   *  records it — a save that fails afterwards still means the file is on file. */
  document: "document_uploaded",
} as const;

/*
 * §12's ratio is `confirmed ÷ (confirmed + corrected)`, and it is EXACT for
 * proposals (filter `metadata.proposalId`) but OPTIMISTIC for `needs_review`
 * fields: correcting one arrives from the part page as an ordinary `PUT` and is
 * counted as `intake_field_answered`. A stated bias, not an oversight — making
 * it observable would mean every save path carrying its own idea of the event,
 * which is the fragmentation this single emitter prevents. The honest fix, if
 * the signal is ever needed, is server-side: the `PUT` route already reads the
 * existing row and knows it is overwriting a `needs_review` value.
 */

/** What the track route accepts: a known type and a small metadata object. */
export interface IntakeEventBody {
  type: string;
  metadata: Record<string, string | number>;
}

/** A ready-to-send event: where it goes, and what it says. */
export interface IntakeEvent {
  trackUrl: string;
  body: IntakeEventBody;
}

/** The portal's tracker, for one location. */
export function trackUrlFor(locationId: string): string {
  return `/api/portal/${locationId}/track`;
}

/** The once-per-visit open, with the same two properties the old page sent. */
export function openedEvent(answered: number, cohort: string): IntakeEventBody {
  return { type: INTAKE_EVENT.opened, metadata: { answered, cohort } };
}

/**
 * Carries both names on purpose: `fieldKey` is the row of the record, `kind` is
 * the `MemberDocument` it became, and they differ for the LLC row — the one
 * document `/tasks` counts. Not derived in `intakeEventFor`, because the upload
 * is a multipart POST the event-deriving transport never sees.
 */
export function documentUploadedEvent(fieldKey: string, kind: string): IntakeEventBody {
  return { type: INTAKE_EVENT.document, metadata: { fieldKey, kind } };
}

/** `handoff.mode` once she has sent; `sent` is terminal. */
const SENT = "sent";

/**
 * `intake_completed`, or `null` — THE TRANSITION, NOT THE REQUEST.
 *
 * `POST .../handoff` answers 200 to a repeat send too, with the same payload,
 * so the transport cannot tell the two apart and a second send would inflate
 * the count. The record held before the response can: only that route writes
 * `intakeSentAt`, so a mode that was not `sent` and now is happened here.
 */
export function completionEvent(
  before: MyBusinessPayload,
  after: MyBusinessPayload,
): IntakeEventBody | null {
  if (before.handoff.mode === SENT || after.handoff.mode !== SENT) return null;
  const metadata: IntakeEventBody["metadata"] = { answered: after.counter.answered };
  // Who it went to, when we know — captured at the send and never rewritten,
  // so the event and the receipt name the same person.
  if (after.handoff.sentMentor) metadata.mentor = after.handoff.sentMentor;
  return { type: INTAKE_EVENT.completed, metadata };
}

/** `/api/portal/{locationId}/business-profile/{rest}` — the only family that
 *  produces intake events. */
const ROUTE = /^\/api\/portal\/([^/]+)\/business-profile\/(.+)$/;
const PROPOSALS = "proposals";
/** `POST .../proposals/{id}/{act}` → the event that act is. */
const PROPOSAL_EVENT: Record<string, string> = {
  confirm: INTAKE_EVENT.confirmed,
  reject: INTAKE_EVENT.corrected,
};
const PROPOSAL_PATH_PARTS = 3;

/** One answer she typed, or one extraction she settled — or neither. */
function bodyFor(rest: string[], method: string): IntakeEventBody | null {
  if (rest.length === 1 && isKnownFieldKey(rest[0])) {
    // PUT is her own words; POST on the same path is the field-level confirm of
    // a value she did not type, which is what the deleted page tracked.
    if (method === "PUT") return { type: INTAKE_EVENT.answered, metadata: { fieldKey: rest[0] } };
    if (method === "POST") return { type: INTAKE_EVENT.confirmed, metadata: { fieldKey: rest[0] } };
    return null;
  }
  if (rest.length === PROPOSAL_PATH_PARTS && rest[0] === PROPOSALS && method === "POST") {
    // The proposal id, not the field key: the path does not carry one, and
    // `ProfileProposal.fieldKey` joins back to it in the warehouse.
    const type = PROPOSAL_EVENT[rest[2]];
    return type ? { type, metadata: { proposalId: rest[1] } } : null;
  }
  return null;
}

/**
 * The event a mutation on this route family is, or `null` for the ones that are
 * not intake events. Called on a request that SUCCEEDED — an act that did not
 * happen is not an act.
 */
export function intakeEventFor(url: string, method: string | undefined): IntakeEvent | null {
  const match = ROUTE.exec(url);
  if (!match) return null;
  const body = bodyFor(match[2].split("/"), (method ?? "GET").toUpperCase());
  return body ? { trackUrl: trackUrlFor(match[1]), body } : null;
}
