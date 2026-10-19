/**
 * Saving one answer.
 *
 * The transport is `request.ts`'s `call`, so this adds no second idea of what a
 * failure looks like. It adds the one thing a save needs on top of a request:
 * the control's answer has to become what the key stores before it goes.
 *
 * The one refusal that never reaches the network is a value the record cannot
 * hold — `storedFrom` says so first, so she is told instead of watching a round
 * trip come back with nothing.
 */

"use client";

import { REFUSED_MESSAGE } from "@sc/lib/businessProfile/storedValue";

import { lowerForSave } from "@sc/lib/businessProfile/rowEditor";
import { splitTradeSave } from "@sc/lib/businessProfile/tradeCodes";
import { TRADE_FIELD_KEY } from "@sc/lib/businessProfile/writeBack";
import { call, type Outcome } from "./request";

export const SAVE_MESSAGE = "That did not save. You can try again.";
/** Refused before it was sent, so there is nothing to retry unchanged. */
/**
 * The sentence the SERVER refuses with, not a second copy of it. The client
 * catches the same value one layer earlier, and a refusal that reads
 * differently depending on which side caught it is two bugs reported as one.
 */
export const REJECTED_MESSAGE = REFUSED_MESSAGE;
/** Nothing was sent, so there is no status to report. */
const NOT_SENT = 0;
const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * The request that says yes to one proposal.
 *
 * ONE OWNER OF THE CONFIRM BODY. A card that offers more items than the row
 * keeps sends the items she kept; every other card sends no body at all, which
 * is the confirm every screen made before F5a. The two shapes live here so a
 * second screen cannot grow its own idea of what a pick looks like on the wire.
 *
 * It decides NOTHING about the pick — the cap, the items and what may be
 * confirmed all come from `subsetConfirm.ts`, and the route checks the pick
 * again against the proposal's own items.
 */
export function confirmInit(picked?: readonly string[]): RequestInit {
  if (!picked) return { method: "POST" };
  return { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ items: picked }) };
}

/**
 * Save one answer, in ONE round trip, and take the whole record back.
 *
 * The control's answer is lowered by `storedFrom` first: a legacy key stores it
 * unchanged — the control's shape IS the shape on disk — and a new key stores
 * the parsed `MbValue` its reader expects.
 *
 * A "Your trade" answer carries a `naicsScope` (the codes she kept ticked and
 * the codes the picker showed, Decisions log D130, D131). It is not part of the
 * stored value, so it travels beside `value` in the body.
 */
export async function saveField(
  locationId: string,
  fieldKey: string,
  answer: unknown,
): Promise<Outcome> {
  const { answer: value, naicsScope } =
    fieldKey === TRADE_FIELD_KEY ? splitTradeSave(answer) : { answer, naicsScope: null };
  const stored = lowerForSave(fieldKey, value);
  // The refusal's OWN sentence where the rule has one — "A UEI is twelve letters
  // and numbers, with no spaces or dashes." A malformed answer used to be
  // reported with the generic line, or with nothing she could see at all.
  if (!stored.ok) {
    return { ok: false, status: NOT_SENT, message: stored.message ?? REJECTED_MESSAGE };
  }
  return call(
    `/api/portal/${locationId}/business-profile/${fieldKey}`,
    {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(naicsScope ? { value: stored.value, naicsScope } : { value: stored.value }),
    },
    SAVE_MESSAGE,
  );
}

/**
 * "Yes, that is right" — she agrees with a value we put on the record.
 *
 * A POST to the row's own endpoint, which is the Confirm path the queue has
 * always used; the ordering it implies is the server's and is not reimplemented
 * here. It answers with the whole payload, like every other mutation, so one
 * response moves the row, the rail and the counts together.
 *
 * It is NOT a save: there is no value to send. Re-typing an answer she already
 * agrees with is the thing this exists to spare her.
 */
export async function confirmField(locationId: string, fieldKey: string): Promise<Outcome> {
  return call(
    `/api/portal/${locationId}/business-profile/${fieldKey}`,
    { method: "POST" },
    SAVE_MESSAGE,
  );
}

/**
 * Say yes to something a channel proposed, on the row that holds it.
 *
 * THE ONLY WAY THESE ARE ANSWERED NOW. They used to be answered on the "What
 * needs you" queue, which was removed — and the proposals kept being written,
 * kept being counted on the rail, and had nowhere left to be accepted. `tell`
 * would understand her perfectly and put the result somewhere she could not
 * reach.
 *
 * The endpoint is unchanged and already returns the whole payload, so accepting
 * one moves the row, the rail and the counts in a single render — the same
 * shape every other write on this page uses.
 *
 * `picked` is the items she kept where the row asked her to choose. It travels
 * through `confirmInit` above, so this function adds no second idea of what a
 * pick looks like on the wire, and a caller with nothing to pick sends the
 * bodiless confirm every screen sent before F5a.
 */
export async function confirmProposal(
  locationId: string,
  proposalId: string,
  picked?: readonly string[],
): Promise<Outcome> {
  return call(
    `/api/portal/${locationId}/business-profile/proposals/${proposalId}/confirm`,
    confirmInit(picked),
    SAVE_MESSAGE,
  );
}

/** Say no. The row keeps whatever it already had — a rejection is not a wipe. */
export async function rejectProposal(locationId: string, proposalId: string): Promise<Outcome> {
  return call(
    `/api/portal/${locationId}/business-profile/proposals/${proposalId}/reject`,
    { method: "POST" },
    SAVE_MESSAGE,
  );
}
