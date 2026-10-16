// Her Save and Cancel on a Hunter profile update card — the one network seam.
//
// Nothing here throws into the card. Every failure comes back as an
// `unavailable` answer with a sentence she can read, because a Save that fails
// silently reads as a Save that worked. Her identity is the session's: the
// backend takes `locationId` from the GHL token, never from this request.

import { apiFetch, API_BASE_URL } from "../api";
import type { ProfileUpdateAnswer } from "../hunterChat";

/** Fixed copy for an answer the browser could not get. Nothing was saved. */
export const PROFILE_UPDATE_NOT_SENT =
  "Hunter could not reach your profile just now. Nothing was saved. Try again in a moment.";

/** The statuses that carry a sentence for her. */
const MESSAGE_STATUSES = new Set(["refused", "gone", "unavailable"]);

/** A non-empty string, or null. */
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/**
 * Reads the server's answer. A shape this card does not know is `unavailable`,
 * never `confirmed`: only an answer that names the saved row counts as saved.
 */
export function readProfileUpdateAnswer(body: unknown): ProfileUpdateAnswer {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.status === "confirmed" && text(b.label)) {
    return { status: "confirmed", label: b.label as string };
  }
  if (b.status === "rejected") return { status: "rejected" };
  if (typeof b.status === "string" && MESSAGE_STATUSES.has(b.status) && text(b.message)) {
    return {
      status: b.status as "refused" | "gone" | "unavailable",
      message: b.message as string,
    };
  }
  return { status: "unavailable", message: PROFILE_UPDATE_NOT_SENT };
}

/** POSTs one answer and reads it. Every failure becomes `unavailable`. */
async function answer(
  proposalId: string,
  action: "confirm" | "reject",
  body: object,
): Promise<ProfileUpdateAnswer> {
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/hunter-chat/profile-update/${encodeURIComponent(proposalId)}/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.warn(`Profile update ${action} failed (${res.status})`);
      return { status: "unavailable", message: PROFILE_UPDATE_NOT_SENT };
    }
    return readProfileUpdateAnswer(await res.json());
  } catch (err) {
    console.warn(`Profile update ${action} failed:`, err);
    return { status: "unavailable", message: PROFILE_UPDATE_NOT_SENT };
  }
}

/** Saves one proposed change. `items` is her pick when the card asked for one. */
export function confirmProfileUpdate(
  proposalId: string,
  items?: string[],
): Promise<ProfileUpdateAnswer> {
  return answer(proposalId, "confirm", items ? { items } : {});
}

/** Cancels one proposed change. Her profile does not change. */
export function rejectProfileUpdate(proposalId: string): Promise<ProfileUpdateAnswer> {
  return answer(proposalId, "reject", {});
}
