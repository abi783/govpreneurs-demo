// THE IT SERVICES FIRM: Hector's Success Center home — Sarah's action plan, and
// the lines "Recent activity" adds to the ones every member gets (src/demo/sc/home/).
//
// The hero (the Army Reserve help desk) has no mentor review yet: Tim sends it
// live on the call. So the plan's review step is open, and the activity shows
// Sarah's other answers instead: Discuss on the Pope sources sought (today, from
// the shared feed), Pass on the Hoke County Chromebook purchase, and her SPRS how-to.

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
    id: "playbook-fort-bragg-it",
    title: "Your Fort Bragg IT plan: the next 30 days",
    description:
      `**From ${MENTOR.name}.** After your positioning call, these are the seven things that will move ${PERSONA.businessShortName} toward Army IT support at Fort Bragg, the Seymour Johnson follow-on and the Army hospital's IT work.\n\n` +
      `Work from the top down. Check off each step when it is done. Your **Tasks** page shows the same work, with due dates.\n\n` +
      `> Army help desk quotes at Fort Bragg are checked against the wage floor first. Have every tech priced at or above it, and every tech's Security+ named, *before* you send.`,
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
        title: `Send the help desk quote to ${MENTOR.firstName} for review`,
        content:
          `${hero.plainTitle}: Grant says bid it. Before Ava finishes the quote, ask ${MENTOR.firstName}: pursue or pass?\n\n` +
          `A review is $${WALLET.mentorReviewPrice} from your wallet. She answers within one business day.`,
        resourceUrl: `/opportunities/${hero.id}`,
        sortOrder: 1,
      }),
      step({
        id: "step-ava",
        title: "Answer Ava's questions on the help desk quote",
        content:
          `Ava has 3 questions: who your **site lead and alternate** are, how you **staff six seats** in the 30-day phase-in, and how you **price the techs**. She cannot finish the quote without them. Due ${dueText("task-ava-help-desk")}.`,
        resourceUrl: `/ava/${hero.id}`,
        sortOrder: 2,
      }),
      step({
        id: "step-grant-fixes",
        title: "Fix Grant's two things: Security+ and the wage floor",
        content:
          `1. Book Security+ exams for the two techs who don't have it, and name all six techs in the quote. Due ${dueText("task-security-plus")}.\n` +
          `2. Price every tech at or above the wage floor: $37.50 an hour plus $5.92 health and welfare for a PC support technician. Show it line by line. Due ${dueText("task-wage-floor")}.\n` +
          `3. Ask the contract specialist before questions close: *"Does the Army issue laptops and tools to the techs?"* Every bidder sees the answer. Due ${dueText("task-gear-question")}.\n` +
          `4. Upload the two exam bookings here. Ava uses them in the quote.`,
        allowMemberUpload: true,
        sortOrder: 3,
      }),
      step({
        id: "step-partner",
        title: `Reply to ${KEY_PARTNER.name} about the Army hospital IT`,
        content:
          `${KEY_PARTNER.name}, an 8(a) IT firm in ${KEY_PARTNER.city}, plans to quote the Army hospital's IT support at Fort Bragg. Only 8(a) STARS III holders can quote it, and they hold it. They want ${lowerFirst(KEY_PARTNER.seeking)}.\n\n` +
          `Write to ${KEY_PARTNER.contact}, their ${KEY_PARTNER.contactTitle.toLowerCase()}. Keep it short. Due ${dueText("task-brackwater")}.\n\n` +
          `> "We are an 8(a) IT firm in ${PERSONA.hqCity} with Security+ techs. We run desktop support at Seymour Johnson AFB today, and we would like to run the deskside techs on your hospital job."`,
        resourceUrl: "/partners",
        sortOrder: 4,
      }),
      step({
        id: "step-cmmc",
        title: "Close 4 of your 9 open CMMC items",
        content:
          `Your CMMC Level 2 self-assessment scores 92 of 110. Any Army job that touches controlled information will ask for it. Close the 4 quickest items, then post the new score in SPRS and have it affirmed.\n\n` +
          `Bring the list to ${MENTOR.firstName} if you get stuck. Due ${dueText("task-cmmc-items")}.`,
        resourceUrl: "/my-business",
        sortOrder: 5,
      }),
      step({
        id: "step-targeting",
        title: `Book your quarterly targeting call with ${MENTOR.firstName}`,
        content:
          `In 30 minutes, ${MENTOR.firstName} plans your next quarter of bids around Fort Bragg, Pope and Seymour Johnson, and your answer to the Pope sources sought. Pick a time on the **Mentors** page.`,
        resourceUrl: "/find-a-mentor",
        sortOrder: 6,
      }),
    ],
  };
}

/** Sarah's closed answers, which the shared feed (unread replies only) does not show. */
export function homeActivity(): ActivityItem[] {
  const out: ActivityItem[] = [];
  const pass = MENTOR_REVIEWS.find((r) => r.id === "rev-hoke-chromebooks");
  if (pass) {
    const opp = pass.oppId ? getOpportunity(pass.oppId) : undefined;
    out.push({
      id: "act-hoke-chromebooks-pass",
      kind: "mentor",
      title: `${MENTOR.name} advised you to pass: ${opp?.plainTitle ?? pass.title}`,
      detail: pass.outcome,
      at: isoDaysFromNow(-pass.lastMessageDaysAgo, 14),
      to: `/mentors/${pass.id}`,
    });
  }
  const howTo = MENTOR_REVIEWS.find((r) => r.id === "rev-sprs-howto");
  if (howTo) {
    out.push({
      id: "act-sprs-howto",
      kind: "mentor",
      title: `${MENTOR.name} answered your question about posting your CMMC score in SPRS`,
      detail: howTo.outcome,
      at: isoDaysFromNow(-howTo.lastMessageDaysAgo, 14),
      to: `/mentors/${howTo.id}`,
    });
  }
  return out;
}
