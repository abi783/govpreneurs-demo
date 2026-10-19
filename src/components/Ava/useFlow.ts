// One hook for the two-phase workspace: where the bid stands (lib/ava/flow),
// the steps and the header, her mentor's reviews, and Ava's simulated work
// clock. Every view reads this, so none of them work any of it out again.

import { useEffect, useMemo, useState } from "react";
import { useLiveSlice } from "../../lib/eventBus";
import {
  mentorTooLate,
  CHECK_LINE_MS,
  checkFixes,
  checkLines,
  checkSig,
  flowOf,
  headlineOf,
  READ_FILE_MS,
  stepsOf,
  type Flow,
  type Headline,
  type MentorStatus,
  type Step,
} from "../../lib/ava/flow";
import { DEMO } from "../../lib/ava/derive";
import { ava } from "../../lib/ava/store";
import type { MentorRead } from "../../lib/ava/thread";
import {
  getReviewByOpportunity,
  MENTOR,
  MENTOR_REPLY_DAYS,
  type MentorReview,
} from "../../demo/ava/mentorReviews";
import type { AvaContext } from "./useAva";

export interface FlowView {
  /** Device clock in milliseconds, for Ava's simulated reading and checking. */
  now: number;
  flow: Flow;
  steps: Step[];
  head: Headline;
  /** Her mentor's read of the opportunity, sent from Grant's page. */
  oppReview: MentorReview | null;
  /** Her mentor's review of her bid, sent from Ava. */
  bidReview: MentorReview | null;
  /** Her ask to a mentor from the paused card: what to do about a rule she
   *  cannot meet. Shown in the paused card, never asked twice. */
  pausedReview: MentorReview | null;
  mentorRead: MentorRead | null;
  mentorName: string;
}

/** The device clock, ticking while Ava works on screen. Zero until the page
 *  reaches the browser, so the first render matches the server's. */
export function useSimNow(active: boolean): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}

function mentorStatus(r: MentorReview | null): MentorStatus | null {
  if (!r) return null;
  return { name: r.mentorName ?? MENTOR.name, status: r.status };
}

/** The mentor's last words in a review, as plain text. */
export function mentorNote(r: MentorReview): string {
  const last = [...r.messages].reverse().find((m) => m.from === "mentor");
  return (last?.body ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function useFlow(ctx: AvaContext, focus: string | null): FlowView {
  const { bid, s, id } = ctx;
  const oppReview = useLiveSlice("mentorReviews", () => getReviewByOpportunity(id));
  const bidReview = useLiveSlice("mentorReviews", () => getReviewByOpportunity(id, "bid"));
  const pausedReview = useLiveSlice("mentorReviews", () => getReviewByOpportunity(id, "paused"));
  // The clock ticks only while Ava works on screen: reading, or checking.
  const now = useSimNow(!s.read?.doneAt || (!!s.check && !s.check.doneAt));
  const mentorNo = oppReview?.verdict === "dont-pursue";

  const flow = useMemo(
    () => flowOf(bid, s, { now, focus, mentorNo }),
    [bid, s, now, focus, mentorNo],
  );
  const mentor = mentorStatus(bidReview);
  const mentorName = bidReview?.mentorName ?? oppReview?.mentorName ?? MENTOR.name;
  const steps = useMemo(() => stepsOf(bid, s, flow, mentor), [bid, s, flow, mentor]);
  const head = useMemo(
    () =>
      headlineOf(bid, s, flow, {
        mentor,
        mentorName,
        pending: !!(flow.current && s.pending[flow.current.key]),
        late: mentorTooLate(bid, MENTOR_REPLY_DAYS),
      }),
    [bid, s, flow, mentor, mentorName],
  );
  const mentorRead: MentorRead | null = oppReview
    ? {
        name: oppReview.mentorName ?? MENTOR.name,
        verdict: oppReview.verdict ?? null,
        note: mentorNote(oppReview),
        reviewId: oppReview.id,
      }
    : null;

  // Ava's work on screen: she starts reading as soon as she may, ticks the
  // files off, then checks the bid on her own once every question is
  // answered. The prototype calls no model, so the pace is simulated.
  const files = bid.files.filter((f) => !f.supersededBy).length;
  useEffect(() => {
    if (now === 0) return;
    if (flow.stage === "mentor-no" || flow.stage === "stopped") return;
    if (!s.read) {
      ava.startReading(id, Date.now());
      return;
    }
    if (!s.read.doneAt && now - s.read.startedAt >= files * READ_FILE_MS)
      ava.finishReading(id, Date.now());
  }, [now, flow.stage, s.read, files, id]);

  // The check runs in phase 1 once every question is answered, and again in
  // phase 2 after any change she or her mentor makes (flow.ts checkSig).
  const recheck = flow.stage === "read" && flow.holds.some((h) => h.kind === "checking");
  useEffect(() => {
    if (now === 0 || (flow.stage !== "checking" && !recheck)) return;
    const sig = checkSig(s);
    if (!s.check || s.check.sig !== sig) {
      ava.startCheck(id, Date.now(), sig);
      return;
    }
    const lines = checkLines(bid, s).length;
    if (!s.check.doneAt && now - s.check.startedAt >= lines * CHECK_LINE_MS)
      ava.finishCheck(id, Date.now(), checkFixes(bid, s), !!s.fixes[DEMO.checkFails]);
  }, [now, flow.stage, recheck, s, bid, id]);

  return { now, flow, steps, head, oppReview, bidReview, pausedReview, mentorRead, mentorName };
}
