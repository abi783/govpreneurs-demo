// THE AGENCY: Dana's Success Center home — Sarah's action plan, and the lines
// "Recent activity" adds to the ones every member gets (src/demo/sc/home/).
//
// The hero (the Family Advocacy campaign) has no mentor review yet: Tim sends it
// live on the call. So the plan's review step is open, and the activity shows
// Sarah's other two verdicts instead: Discuss on the FAST proposal (today, from the
// shared feed) and Pass on Visit NC, plus her answer on the NC Guard rating.

import { getOpportunity } from "../../../story/opportunities";
import { KEY_PARTNER, MENTOR, PERSONA } from "../../../story/persona";
import { MENTOR_REVIEWS, WALLET } from "../../../story/workspace";
import { isoDaysFromNow } from "../../../story/clock";
import { dueText, lowerFirst, type PlanContent } from "../../../sc/home/actionPlan";
import type { ActivityItem } from "../../../sc/home/homeData";
import { HERO_IDS } from "../opportunities";

const step = (s: Partial<PlanContent["steps"][number]> & Pick<PlanContent["steps"][number], "id" | "title" | "content" | "sortOrder">) => ({
  videoUrl: null,
  resourceUrl: null,
  attachmentUrl: null,
  attachmentName: null,
  allowMemberUpload: false,
  ...s,
});

export function homePlan(): PlanContent {
  const hero = getOpportunity(HERO_IDS.hero)!;
  return {
    id: "playbook-fort-bragg-and-guard",
    title: "Your Fort Bragg and NC Guard plan: the next 30 days",
    description:
      `**From ${MENTOR.name}.** After your positioning call, these are the seven things that will move ${PERSONA.businessShortName} toward Army family programs at Fort Bragg, the NC Guard and the VA.\n\n` +
      `Work from the top down. Check off each step when it is done. Your **Tasks** page shows the same work, with due dates.\n\n` +
      `> Army family programs buy outreach every year. Have your rating, your rates and your team named *before* the solicitation posts.`,
    doneAtStart: ["step-cap-statement"],
    steps: [
      step({
        id: "step-cap-statement",
        title: "Finish your capability statement",
        content:
          "Your capability statement is the one page that every buyer asks for. Yours is done and saved in **My Business**. Hunter now uses it to explain each match.",
        resourceUrl: "/my-business",
        attachmentUrl: PERSONA.capabilityStatementFile,
        attachmentName: `${PERSONA.businessShortName} capability statement (PDF)`,
        sortOrder: 0,
      }),
      step({
        id: "step-hero-review",
        title: `Send the ${hero.plainTitle} to ${MENTOR.firstName} for review`,
        content:
          `Grant says bid it. Before Ava finishes the quote, ask ${MENTOR.firstName}: pursue or pass?\n\n` +
          `A review is $${WALLET.mentorReviewPrice} from your wallet. She answers within one business day.`,
        resourceUrl: `/opportunities/${hero.id}`,
        sortOrder: 1,
      }),
      step({
        id: "step-ava",
        title: `Answer Ava's questions on the ${hero.plainTitle}`,
        content:
          `Ava has 3 questions: who your **project manager and alternate** are, how you will make the **24 videos**, and how you cover the **app line**. She cannot finish the quote without them. Due ${dueText("task-ava-family-advocacy")}.`,
        resourceUrl: `/ava/${hero.id}`,
        sortOrder: 2,
      }),
      step({
        id: "step-grant-fixes",
        title: "Fix Grant's two things: the app line and the print rates",
        content:
          `1. Ask the contract specialist before questions close: *"Does a local news partner's app meet the app requirement?"* Every bidder sees the answer, so ask it plainly. Due ${dueText("task-app-question")}.\n` +
          `2. Get a signed rate quote from each of the four local papers, locked for 12 months, with a stated increase for each option year. Due ${dueText("task-print-quotes")}.\n` +
          `3. Upload the quotes here as one PDF. Ava uses them to price the print line.`,
        allowMemberUpload: true,
        sortOrder: 3,
      }),
      step({
        id: "step-partner",
        title: `Reply to ${KEY_PARTNER.name} about the VA campaign`,
        content:
          `${KEY_PARTNER.name}, a veteran-owned firm in ${KEY_PARTNER.city}, runs the VA's current hiring campaign. For the next one, they want ${lowerFirst(KEY_PARTNER.seeking)}.\n\n` +
          `Write to ${KEY_PARTNER.contact}, their ${KEY_PARTNER.contactTitle.toLowerCase()}. Keep it short. Due ${dueText("task-bluestone")}.\n\n` +
          `> "We are a woman-owned agency in ${PERSONA.hqCity} with a two-person video crew. We would like to run your Southeast shoots."`,
        resourceUrl: "/partners",
        sortOrder: 4,
      }),
      step({
        id: "step-rating",
        title: "Ask the Army for an interim rating on your NC Guard campaign",
        content:
          `The campaign ended in February and has no performance rating yet. Grant uses one as past performance on the Guard's next campaign.\n\n` +
          `Email the contracting officer with ${MENTOR.firstName}'s template: the contract number, the dates, and one line on what you delivered. Due ${dueText("task-rating")}.`,
        resourceUrl: "/mentors/rev-ncng-rating",
        sortOrder: 5,
      }),
      step({
        id: "step-targeting",
        title: `Book your quarterly targeting call with ${MENTOR.firstName}`,
        content:
          `In 30 minutes, ${MENTOR.firstName} plans your next quarter of bids around Fort Bragg, the NC Guard and the VA. Pick a time on the **Mentors** page.`,
        resourceUrl: "/find-a-mentor",
        sortOrder: 6,
      }),
    ],
  };
}

/** Sarah's closed answers, which the shared feed (unread replies only) does not show. */
export function homeActivity(): ActivityItem[] {
  const out: ActivityItem[] = [];
  const pass = MENTOR_REVIEWS.find((r) => r.id === "rev-visitnc-pass");
  if (pass) {
    const opp = pass.oppId ? getOpportunity(pass.oppId) : undefined;
    out.push({
      id: "act-visitnc-pass",
      kind: "mentor",
      title: `${MENTOR.name} advised you to pass: ${opp?.plainTitle ?? pass.title}`,
      detail: pass.outcome,
      at: isoDaysFromNow(-pass.lastMessageDaysAgo, 14),
      to: `/mentors/${pass.id}`,
    });
  }
  const rating = MENTOR_REVIEWS.find((r) => r.id === "rev-ncng-rating");
  if (rating) {
    out.push({
      id: "act-ncng-rating",
      kind: "mentor",
      title: `${MENTOR.name} answered your question about the NC Guard rating`,
      detail: rating.outcome,
      at: isoDaysFromNow(-rating.lastMessageDaysAgo, 14),
      to: `/mentors/${rating.id}`,
    });
  }
  return out;
}
