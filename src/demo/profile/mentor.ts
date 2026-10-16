// DEMO: the mentor sessions on the Business Profile. They come from the mentor
// reviews in the story (MENTOR_REVIEWS), with Sarah Mitchell as the mentor.

import { MENTOR } from "../story/persona";
import { MENTOR_REVIEWS } from "../story/workspace";
import { isoDaysFromNow } from "../story/clock";
import { readDemoState, updateDemoState, useDemoState } from "./store";

export interface MentorSessionRecord {
  id: string;
  /** ISO instant. */
  at: string;
  mentor: string;
  status: "completed" | "scheduled" | "cancelled";
  /** What the member took away, in one sentence. */
  takeaway?: string;
  /** The mentor review thread this session belongs to. */
  reviewId?: string;
  title?: string;
}

const KEY = "profile.mentorSessions";

function seed(): MentorSessionRecord[] {
  return [...MENTOR_REVIEWS]
    .sort((a, b) => a.openedDaysAgo - b.openedDaysAgo)
    .map((r, i) => ({
      id: `session-${r.id}`,
      at: isoDaysFromNow(-r.openedDaysAgo, 9),
      mentor: MENTOR.name,
      status: "completed" as const,
      title: r.title,
      reviewId: r.id,
      // The newest review has no takeaway yet, so the page can show how one is added.
      takeaway: i === 0 ? undefined : r.outcome,
    }));
}

export function useMentorSessions(): MentorSessionRecord[] {
  const [rows] = useDemoState<MentorSessionRecord[]>(KEY, seed);
  return rows;
}

export function getMentorSessions(): MentorSessionRecord[] {
  return readDemoState<MentorSessionRecord[]>(KEY, seed);
}

export function setTakeaway(id: string, takeaway: string): void {
  updateDemoState<MentorSessionRecord[]>(KEY, seed, (prev) =>
    prev.map((s) => (s.id === id ? { ...s, takeaway: takeaway.trim() || undefined } : s)),
  );
}
