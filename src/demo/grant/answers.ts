// DEMO: what an answer to one of Grant's open questions changes.
//
// The visitor answers in the rail. The answer is stored (state.ts). The analysis is
// then built again with the answer applied: the question moves to "You told me",
// the confidence moves, the call gets one more sentence, and the trail records the
// answer. Grant's call itself (Bid, Needs review, No-bid) never changes in the
// demo. The story owns it.

import type { GrantAnalysis, OpenQuestion, RichLine, SuggestedChip } from "@/lib/grant/types";
import { PARTNER } from "./facts";
import { plain, rt } from "./rich";
import { V } from "./vocab";

const YES = /^\s*(y|yes|yeah|yep|sure|we did|i did|i have|already)\b/i;
const NO = /^\s*(n|no|nope|not yet|not really|we didn't|i didn't|haven't)\b/i;

export const isYes = (v: string): boolean => YES.test(v);
export const isNo = (v: string): boolean => NO.test(v) && !YES.test(v);

/** The sentence Grant adds to its call after an answer. */
function reaction(id: string, value: string): { gist: string; ack: string; dots: number } {
  const yes = isYes(value);
  const no = isNo(value);
  const own = V.reactions[id];
  if (own) return yes ? { ...own.yes, dots: 1 } : { ...own.no, dots: 0 };
  switch (id) {
    case "talked-to-partner":
      return yes
        ? {
            gist: `You have already talked with ${PARTNER.name}, so the subcontract path is now a plan.`,
            ack: `Good. You have spoken with ${PARTNER.name}, so the subcontract path is a plan now, not an idea. Ask ${PARTNER.contact} for the sub quote deadline. I raised my confidence.`,
            dots: 1,
          }
        : {
            gist: `You have not talked with ${PARTNER.name} yet. Call ${PARTNER.contact} this week: the subcontract path starts there.`,
            ack: `Thank you. Then the call to ${PARTNER.contact} is your first step. Open Partners to see ${PARTNER.name}. My confidence stays where it was.`,
            dots: 0,
          };
    case "which-meals":
      return {
        gist: `You could cover ${value.trim().replace(/[.!]+$/, "")}. Lead your sub quote with that.`,
        ack: `Noted: ${value.trim().replace(/[.!]+$/, "")}. That is the share to point you toward. Weekends and holidays are where a subcontractor helps a prime most. I raised my confidence.`,
        dots: 1,
      };
    case "has-prime":
      return yes
        ? { gist: "You know a prime who bids this kind of work, so the subcontract path is a plan.", ack: "Good. Then call that prime this week and ask for the sub quote deadline. I raised my confidence.", dots: 1 }
        : { gist: "You do not know a prime yet. Partners lists the firms that look for subcontractors.", ack: "That is fine. Open Partners: it lists the primes that look for subcontractors. My confidence stays where it was.", dots: 0 };
    case "local-crew":
      return yes ? { ...V.localQuestion.yes, dots: 1 } : { ...V.localQuestion.no, dots: 0 };
    case "second-crew":
      return yes
        ? { gist: "You said you can add a second crew or team up, so the size is less of a limit.", ack: "Good. A second crew or a team-up is what makes a contract this size workable. I raised my confidence.", dots: 1 }
        : { gist: "You cannot add a second crew, so the size stays a real limit.", ack: "Then the size stays a real limit. A prime on Partners may be the way around it. My confidence stays where it was.", dots: 0 };
    case "enough-time":
      return yes
        ? { gist: "You said you can finish in the time left, so the short window is less of a limit.", ack: "Good. Start with the references and the price: they take the longest. I raised my confidence.", dots: 1 }
        : { gist: "You cannot finish in the time left, so the short window stays a real limit.", ack: "Then the short window stays a real limit. A second opinion from Sarah can help you decide fast. My confidence stays where it was.", dots: 0 };
    default:
      return no
        ? { gist: "Noted.", ack: "Noted. My confidence stays where it was.", dots: 0 }
        : { gist: "Noted.", ack: "Noted. I used it to update my take.", dots: yes ? 1 : 0 };
  }
}

/** What Grant says back in the rail after the visitor answers. */
export function acknowledge(q: OpenQuestion, value: string): { reply: string; fact: { label: string; value: string } } {
  const r = reaction(q.id, value);
  const label = plain(q.question).replace(/\?$/, "").slice(0, 60);
  return { reply: r.ack, fact: { label, value: value.trim().slice(0, 120) } };
}

/** The open question that an answer text names, or null. */
export function findOpenQuestion(analysis: GrantAnalysis, questionText: string): OpenQuestion | null {
  const wanted = questionText.trim();
  return (
    analysis.rail.openQuestions.find((q) => plain(q.question) === wanted) ??
    analysis.rail.openQuestions.find((q) => plain(q.question).startsWith(wanted.slice(0, 40))) ??
    null
  );
}

/** Apply the stored answers to a freshly built analysis. */
export function applyAnswers(base: GrantAnalysis, answers: Record<string, string>): GrantAnalysis {
  const answered = base.rail.openQuestions.filter((q) => answers[q.id] !== undefined);
  if (answered.length === 0) return base;

  const remaining = base.rail.openQuestions.filter((q) => answers[q.id] === undefined);
  let dots = base.verdict.confidence.dots ?? (base.verdict.confidence.level === "high" ? 5 : base.verdict.confidence.level === "medium" ? 3 : 1);
  const extra: string[] = [];
  for (const q of answered) {
    const r = reaction(q.id, answers[q.id]);
    dots = Math.min(5, dots + r.dots);
    extra.push(r.gist);
  }
  const level: "high" | "medium" | "low" = dots >= 4 ? "high" : dots === 3 ? "medium" : "low";

  const gist: RichLine = [...base.verdict.gist, { text: ` ${extra.join(" ")}` }];
  const chips: SuggestedChip[] = base.rail.suggestedChips.filter(
    (c) => !(c.kind === "elicit" && answered.some((q) => q.id === c.target)),
  );
  const briefing = base.rail.briefing.map((l) =>
    plain(l).includes("question for you") || plain(l).includes("things I still need")
      ? remaining.length > 0
        ? l
        : rt("Ask me anything, or pick a question below.")
      : l,
  );

  const trail = base.trail.map((g, i) =>
    i === base.trail.length - 1
      ? {
          ...g,
          checkCount: g.checkCount + answered.length,
          items: [
            ...g.items,
            ...answered.map((q) => ({
              glyph: "ok" as const,
              text: rt(`You told me: **${answers[q.id].trim().slice(0, 80)}**`),
              source: "You told Grant",
            })),
          ],
        }
      : g,
  );

  return {
    ...base,
    verdict: {
      ...base.verdict,
      gist,
      confidence: {
        ...base.verdict.confidence,
        level,
        dots,
        openQuestions: remaining.length,
        remedy: remaining.length === 0 ? rt("This is as sharp as I can call it.") : base.verdict.confidence.remedy,
      },
    },
    trail,
    rail: {
      ...base.rail,
      briefing,
      openQuestions: remaining,
      suggestedChips: chips,
      answeredQuestions: [
        ...(base.rail.answeredQuestions ?? []),
        ...answered.map((q) => ({ id: q.id, question: q.question, value: answers[q.id].trim() })),
      ],
    },
  };
}
