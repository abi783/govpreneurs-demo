import { apiFetch, buildApiError, API_BASE_URL } from "./api";
import { getGhlUserToken } from "./ghlUserToken";

/**
 * Mentor-review API client.
 *
 * The backend `POST /opportunities/send-for-review` endpoint requires the GHL
 * *user* token in an `X-GHL-User-Token` header (distinct from the `X-GHL-Token`
 * session token that `apiFetch` attaches automatically). We acquire it via
 * `getGhlUserToken()` and pass it through `options.headers` — `apiFetch` merges
 * these and layers `X-GHL-Token` on top.
 *
 * Ported from the v1 client (`frontend/src/services/opportunityService.ts`
 * `sendForReview`) to v2 conventions; the body/header contract is identical.
 */

/** The mentor-review status the backend reports for an opp/user pair. */
export type MentorReviewStatus = "discuss" | "reject" | "pursue" | "pending" | null;

/**
 * POST /opportunities/send-for-review — sends one or more opportunities to a
 * mentor for review. Awaits the GHL user token first, then posts with it.
 */
export async function sendForReview(params: {
  userId: string;
  locationId: string;
  solNumbers: string[];
  opportunityIds: string[];
  message?: string;
}): Promise<{ success?: boolean; updatedCount?: number; message?: string }> {
  const userToken = await getGhlUserToken();
  const response = await apiFetch(`${API_BASE_URL}/opportunities/send-for-review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-GHL-User-Token": userToken,
    },
    body: JSON.stringify({
      userId: params.userId,
      locationId: params.locationId,
      solNumbers: params.solNumbers,
      opportunityIds: params.opportunityIds,
      message: params.message ?? "",
    }),
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to send for review");
  }
  return response.json() as Promise<{
    success?: boolean;
    updatedCount?: number;
    message?: string;
  }>;
}
