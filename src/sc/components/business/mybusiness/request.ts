/**
 * One request, one payload or one message.
 *
 * Every mutation on this route family answers with the whole
 * `MyBusinessPayload`, so a confirm or save is `setData(await res.json())` —
 * one round trip, never a mutation followed by a re-GET. This is the only place
 * that shape is unwrapped, so no screen grows its own idea of a failure.
 *
 * NOTHING FAILS QUIETLY: a request that does not land returns a sentence for
 * the screen to say above the button she pressed.
 *
 * It is also the only `fetch` on this surface, and therefore the only place the
 * PRD §11 intake events fire from — four screens save an answer and none knows
 * it is being counted. WHICH event a request is is `intakeEvents.ts`, tested
 * there; this file only sends it. The two that are not a request — the
 * once-per-visit open and the completion transition — are called in by
 * `RecordStore`, still through the one `emit` below.
 *
 * ANALYTICS NEVER BREAKS HER ACTION. The track POST fires after the mutation
 * succeeded, is never awaited, retried or reported.
 */

import {
  completionEvent,
  documentUploadedEvent,
  intakeEventFor,
  openedEvent,
  trackUrlFor,
  type IntakeEventBody,
} from "@sc/lib/businessProfile/intakeEvents";
import type { MyBusinessPayload } from "@sc/lib/businessProfile/payload";

/** The record moved under her: her screen is out of date, not wrong. */
export const CONFLICT = 409;

export const NETWORK_MESSAGE =
  "We could not reach the server. Nothing was lost — try again in a moment.";

/**
 * A response, unwrapped. `T` is the payload every route on this family answers
 * with; one route answers with MORE than that — `POST .../tell` adds its own
 * account of the submission — so the type widens rather than a second transport
 * being written beside this one. `T` must still BE a payload: the store this
 * feeds holds nothing else.
 */
export type Outcome<T extends MyBusinessPayload = MyBusinessPayload> =
  | { ok: true; payload: T }
  | { ok: false; status: number; message: string };

const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * Tell the tracker, and do not wait to hear back.
 *
 * Deliberately not awaited and deliberately swallowing: the member's save has
 * already landed by the time this runs, and a failed count must not turn into a
 * message, a retry or a blocked button. The receiver documents the same
 * contract — "the portal always ignores them".
 */
function emit(trackUrl: string, body: IntakeEventBody): void {
  void fetch(trackUrl, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body) }).catch(
    () => {},
  );
}

/** PRD §11 `intake_opened`: once per visit, from the store above the screen. */
export function trackIntakeOpened(locationId: string, answered: number, cohort: string): void {
  emit(trackUrlFor(locationId), openedEvent(answered, cohort));
}

/**
 * PRD §11 `intake_completed`: the send that stamped `intakeSentAt`, and only
 * that one.
 *
 * It takes the record BEFORE and AFTER because the response alone cannot say
 * which send this was — the handoff route answers 200 to a repeat send too.
 * `completionEvent` decides; this only sends what it decides, or nothing.
 */
export function trackIntakeCompleted(
  locationId: string,
  before: MyBusinessPayload,
  after: MyBusinessPayload,
): void {
  const body = completionEvent(before, after);
  if (body) emit(trackUrlFor(locationId), body);
}

/**
 * PRD §11 `document_uploaded`: one file stored.
 *
 * Not derived by `call` like the act events, because an upload is a multipart
 * POST to a different route family and answers with a document rather than the
 * record — there is no payload for `call` to unwrap. It still goes out through
 * the one `emit`, so it fails as quietly as every other count.
 */
export function trackDocumentUploaded(locationId: string, fieldKey: string, kind: string): void {
  emit(trackUrlFor(locationId), documentUploadedEvent(fieldKey, kind));
}

/** POST or PUT once, and read the whole record back. */
export async function call<T extends MyBusinessPayload = MyBusinessPayload>(
  url: string,
  init: RequestInit,
  fallback: string,
): Promise<Outcome<T>> {
  try {
    const res = await fetch(url, init);
    const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (res.ok && body) {
      // Only what actually happened is counted, and only after it has.
      const event = intakeEventFor(url, init.method);
      if (event) emit(event.trackUrl, event.body);
      return { ok: true, payload: body };
    }
    return { ok: false, status: res.status, message: body?.error ?? fallback };
  } catch {
    return { ok: false, status: 0, message: NETWORK_MESSAGE };
  }
}
