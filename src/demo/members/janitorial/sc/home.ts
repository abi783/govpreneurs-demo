// THE JANITORIAL FIRM: Reggie's Success Center home — Diana's action plan, and the
// lines "Recent activity" adds to the ones every member gets (src/demo/sc/home/).
//
// The hero (Fort Bragg pressure washing) has no mentor review yet: Tim sends it
// live on the call. So the plan's review step is open, and the activity shows
// Diana's other answers instead: Discuss on the I-95 rest areas (today, from the
// shared feed), Pass on the EPA campus, and her reference-letter how-to.

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
    id: "playbook-fort-bragg-exteriors",
    title: "Your Fort Bragg exterior-cleaning plan: the next 30 days",
    description:
      `**From ${MENTOR.name}.** After your positioning call, these are the seven things that will move ${PERSONA.businessShortName} toward its first Army prime at Fort Bragg, more calls at Seymour Johnson, and a team seat on the Army Reserve centers.\n\n` +
      `Work from the top down. Check off each step when it is done. Your **Tasks** page shows the same work, with due dates.\n\n` +
      `> Cleaning at Fort Bragg goes to the lowest price that follows every rule. Know your wage floor, your backup rig and your two managers *before* you price.`,
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
        title: `Send the Fort Bragg exterior-cleaning quote to ${MENTOR.firstName} for review`,
        content:
          `${hero.plainTitle}: Grant says bid it. Before Ava finishes the quote, ask ${MENTOR.firstName}: pursue or pass?\n\n` +
          `A review is $${WALLET.mentorReviewPrice} from your wallet. She answers within one business day.`,
        resourceUrl: `/opportunities/${hero.id}`,
        sortOrder: 1,
      }),
      step({
        id: "step-ava",
        title: "Answer Ava's questions on the Fort Bragg exterior-cleaning quote",
        content:
          `Ava has 3 questions: who your **project manager and QC manager** are, how you will cover **sandblasting** when the COR approves it, and how you answer a **2-hour call** when both rigs are booked. She cannot finish the quote without them. Due ${dueText("task-ava-pressure-washing")}.`,
        resourceUrl: `/ava/${hero.id}`,
        sortOrder: 2,
      }),
      step({
        id: "step-grant-fixes",
        title: "Fix Grant's two things: the sandblasting line and the wage floor",
        content:
          `1. Ask the contract specialist before questions close: *"How many square feet were sandblasted last year, and are lead-painted surfaces excluded?"* Every bidder sees the answer, so ask it plainly. Due ${dueText("task-sandblasting-question")}.\n` +
          `2. Get a signed rate from a blasting subcontractor, so its cost fits inside your one square-foot price. Due ${dueText("task-blasting-sub")}.\n` +
          `3. Build your price up from the county wage floor: General Maintenance Worker, $21.41 plus $5.92 health and welfare. Ask which class DPW expects. Due ${dueText("task-wage-class")}.\n` +
          `4. Upload the blasting quote here. Ava uses it to price the job.`,
        allowMemberUpload: true,
        sortOrder: 3,
      }),
      step({
        id: "step-partner",
        title: `Reply to ${KEY_PARTNER.name} about the Army Reserve centers`,
        content:
          `${KEY_PARTNER.name}, an 8(a) firm in ${KEY_PARTNER.city}, holds the current contract and plans to bid the next one. They want ${lowerFirst(KEY_PARTNER.seeking)}.\n\n` +
          `Write to ${KEY_PARTNER.contact}, their ${KEY_PARTNER.contactTitle.toLowerCase()}. Keep it short. Due ${dueText("task-ashepoo")}.\n\n` +
          `> "We are a HUBZone janitorial firm in ${PERSONA.hqCity} with night crews in Cumberland, Hoke and Robeson counties. We would like to clean and mow your North Carolina centers."`,
        resourceUrl: "/partners",
        sortOrder: 4,
      }),
      step({
        id: "step-reference",
        title: "Ask the Seymour Johnson COR for a reference letter",
        content:
          `The dorm job was too small for a performance rating (CPARS), so a one-page letter from the COR is your federal reference. Ask now, while they remember the job.\n\n` +
          `Use ${MENTOR.firstName}'s template: the dates, the scope, on time, no rework. Due ${dueText("task-cor-letter")}.`,
        resourceUrl: "/mentors/rev-reference-howto",
        sortOrder: 5,
      }),
      step({
        id: "step-hubzone",
        title: "Start your HUBZone recertification",
        content:
          `Your HUBZone status renews every year, and yours is due in 38 days. At least 35% of your staff must live in a HUBZone. You are at 41%, but night crews turn over, so check where each new hire lives.\n\n` +
          `Start it from **Stay Ready**, or let us file it for you. Due ${dueText("task-hubzone-recert")}.`,
        resourceUrl: "/my-business",
        sortOrder: 6,
      }),
    ],
  };
}

/** Diana's closed answers, which the shared feed (unread replies only) does not show. */
export function homeActivity(): ActivityItem[] {
  const out: ActivityItem[] = [];
  const pass = MENTOR_REVIEWS.find((r) => r.id === "rev-epa-pass");
  if (pass) {
    const opp = pass.oppId ? getOpportunity(pass.oppId) : undefined;
    out.push({
      id: "act-epa-pass",
      kind: "mentor",
      title: `${MENTOR.name} advised you to pass: ${opp?.plainTitle ?? pass.title}`,
      detail: pass.outcome,
      at: isoDaysFromNow(-pass.lastMessageDaysAgo, 14),
      to: `/mentors/${pass.id}`,
    });
  }
  const howTo = MENTOR_REVIEWS.find((r) => r.id === "rev-reference-howto");
  if (howTo) {
    out.push({
      id: "act-reference-howto",
      kind: "mentor",
      title: `${MENTOR.name} answered your question about a reference for the Seymour Johnson job`,
      detail: howTo.outcome,
      at: isoDaysFromNow(-howTo.lastMessageDaysAgo, 14),
      to: `/mentors/${howTo.id}`,
    });
  }
  return out;
}
