// DEMO API area: Mentor reviews.
// Owns: /mentor-reviews/*, POST /opportunities/send-for-review.
// State lives in src/demo/state/mentorReviews.ts; sending a review charges the
// wallet (src/demo/state/wallet.ts).

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import {
  addMemberReply,
  createReview,
  getMentorReviewThread,
  listMentorReviews,
  markReviewViewed,
} from "../state/mentorReviews";
import { chargeWallet, MENTOR_REVIEW_PRICE } from "../state/wallet";
import { describeSaved } from "../state/workspace";

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/mentor-reviews",
    handler: () => ({ reviews: listMentorReviews() }),
  },
  {
    method: "GET",
    path: "/mentor-reviews/:id",
    handler: ({ params }) => getMentorReviewThread(params.id) ?? demoResponse(404, { message: "Review not found" }),
  },
  {
    method: "POST",
    path: "/mentor-reviews/:id/reply",
    handler: ({ params, body }) => {
      const text = body instanceof FormData ? String(body.get("body") ?? "") : String(body?.body ?? "");
      const files = body instanceof FormData ? body.getAll("attachments").map((f) => (f instanceof File ? f.name : String(f))) : [];
      const message = addMemberReply(params.id, text, files);
      return message ? { message } : demoResponse(404, { message: "Review not found" });
    },
  },
  {
    method: "POST",
    path: "/mentor-reviews/:id/viewed",
    handler: ({ params }) => {
      markReviewViewed(params.id);
      return { ok: true };
    },
  },
  {
    method: "POST",
    path: "/opportunities/send-for-review",
    handler: ({ body }) => {
      const oppKey = String(body?.opportunityIds?.[0] ?? body?.solNumbers?.[0] ?? "");
      if (!oppKey) return demoResponse(400, { message: "Nothing to send" });
      const detail = describeSaved(oppKey);
      const title = detail?.title ?? oppKey;
      createReview({ oppKey, title, message: String(body?.message ?? ""), sourceType: detail?.sourceType ?? null });
      chargeWallet(`Mentor review — ${title}`, MENTOR_REVIEW_PRICE);
      return { success: true, updatedCount: 1 };
    },
  },
];
