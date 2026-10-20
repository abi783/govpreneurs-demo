// THE CONTRACTOR: Derrick's Success Center home — Sarah's action plan, and the
// lines "Recent activity" adds to the ones every member gets (src/demo/sc/home/).
//
// The hero (the Fort Bragg training building) has no mentor review yet: Tim sends
// it live on the call. So the plan's review step is open, and the activity shows
// Sarah's other answers instead: Discuss on the summer school job (today, from the
// shared feed), Pass on the $25M–$35M barracks repair, and her MATOC how-to.

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
    id: "playbook-fort-bragg-repairs",
    title: "Your Fort Bragg repair plan: the next 30 days",
    description:
      `**From ${MENTOR.name}.** After your positioning call, these are the seven things that will move ${PERSONA.businessShortName} toward Corps of Engineers repair jobs at Fort Bragg, the Minor Construction MATOC and the Fayetteville VA.\n\n` +
      `Work from the top down. Check off each step when it is done. Your **Tasks** page shows the same work, with due dates.\n\n` +
      `> HUBZone repair jobs at Fort Bragg go to the lowest bid that follows every rule. Have your bond room, your wage rates and your staff named *before* bids open.`,
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
        title: `Send the training building bid to ${MENTOR.firstName} for review`,
        content:
          `${hero.plainTitle}: Grant says bid it. Before Ava finishes the bid, ask ${MENTOR.firstName}: pursue or pass?\n\n` +
          `A review is $${WALLET.mentorReviewPrice} from your wallet. She answers within one business day.`,
        resourceUrl: `/opportunities/${hero.id}`,
        sortOrder: 1,
      }),
      step({
        id: "step-ava",
        title: "Answer Ava's questions on the training building bid",
        content:
          `Ava has 3 questions: who your **quality control manager and safety officer** are, how you will do the **controls**, and how you **keep the building cool** during the switch. She cannot finish the bid without them. Due ${dueText("task-ava-training-building")}.`,
        resourceUrl: `/ava/${hero.id}`,
        sortOrder: 2,
      }),
      step({
        id: "step-grant-fixes",
        title: "Fix Grant's two things: bond room and the pipefitter rate",
        content:
          `1. Call your surety for the bid bond, and get its OK for the final bonds in writing. This job puts you at $3.6M of your $4M total. Due ${dueText("task-surety")}.\n` +
          `2. Ask the contract specialist before questions close: *"Which wage class applies to refrigerant piping and setting HVAC equipment?"* Every bidder sees the answer, so ask it plainly. Until then, price piping at the pipefitter rate. Due ${dueText("task-wage-class")}.\n` +
          `3. Upload the surety letter here. Ava uses it in the bid.`,
        allowMemberUpload: true,
        sortOrder: 3,
      }),
      step({
        id: "step-partner",
        title: `Reply to ${KEY_PARTNER.name} about the VA fan coils`,
        content:
          `${KEY_PARTNER.name}, a service-disabled veteran-owned builder in ${KEY_PARTNER.city}, plans to bid the Fayetteville VA's fan coil job. They want ${lowerFirst(KEY_PARTNER.seeking)}.\n\n` +
          `Write to ${KEY_PARTNER.contact}, their ${KEY_PARTNER.contactTitle.toLowerCase()}. Keep it short. Due ${dueText("task-blackjack-oak")}.\n\n` +
          `> "We are a HUBZone contractor in ${PERSONA.hqCity} with two electrical and two HVAC crews. We would like to do the fan coils, piping and power on your VA job."`,
        resourceUrl: "/partners",
        sortOrder: 4,
      }),
      step({
        id: "step-hubzone",
        title: "Start your HUBZone recertification",
        content:
          `Your HUBZone status renews every 3 years, and yours is due in 44 days. At least 35% of your staff must live in a HUBZone. You are at 9 of 25, so check where each new hire lives before you hire.\n\n` +
          `Start it from **Stay Ready**, or let us file it for you. Due ${dueText("task-hubzone-recert")}.`,
        resourceUrl: "/my-business",
        sortOrder: 5,
      }),
      step({
        id: "step-targeting",
        title: `Book your quarterly targeting call with ${MENTOR.firstName}`,
        content:
          `In 30 minutes, ${MENTOR.firstName} plans your next quarter of bids around Fort Bragg, Pope and the VA, and your answer to the MATOC sources sought. Pick a time on the **Mentors** page.`,
        resourceUrl: "/find-a-mentor",
        sortOrder: 6,
      }),
    ],
  };
}

/** Sarah's closed answers, which the shared feed (unread replies only) does not show. */
export function homeActivity(): ActivityItem[] {
  const out: ActivityItem[] = [];
  const pass = MENTOR_REVIEWS.find((r) => r.id === "rev-barracks-pass");
  if (pass) {
    const opp = pass.oppId ? getOpportunity(pass.oppId) : undefined;
    out.push({
      id: "act-barracks-pass",
      kind: "mentor",
      title: `${MENTOR.name} advised you to pass: ${opp?.plainTitle ?? pass.title}`,
      detail: pass.outcome,
      at: isoDaysFromNow(-pass.lastMessageDaysAgo, 14),
      to: `/mentors/${pass.id}`,
    });
  }
  const howTo = MENTOR_REVIEWS.find((r) => r.id === "rev-matoc-howto");
  if (howTo) {
    out.push({
      id: "act-matoc-howto",
      kind: "mentor",
      title: `${MENTOR.name} answered your question about the Minor Construction MATOC`,
      detail: howTo.outcome,
      at: isoDaysFromNow(-howTo.lastMessageDaysAgo, 14),
      to: `/mentors/${howTo.id}`,
    });
  }
  return out;
}
