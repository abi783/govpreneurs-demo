// THE CONSULTANT: Simone's Success Center home — Diana's action plan, and the
// lines "Recent activity" adds to the ones every member gets (src/demo/sc/home/).
//
// The hero (the Fayetteville VA supervisor program) has no mentor review yet: Tim
// sends it live on the call. So the plan's review step is open, and the activity
// shows Diana's other answers instead: Discuss on the Army Reserve analysts (today,
// from the shared feed), Pass on the state supervisor curriculum, and her how-to on
// the interim CPARS.

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
    id: "playbook-va-and-army-programs",
    title: "Your VA and Army program plan: the next 30 days",
    description:
      `**From ${MENTOR.name}.** After your positioning call, these are the seven things that will move ${PERSONA.businessShortName} toward VA training set aside for service-disabled veteran-owned firms, more Army work at Fort Bragg and a GSA schedule.\n\n` +
      `Work from the top down. Check off each step when it is done. Your **Tasks** page shows the same work, with due dates.\n\n` +
      `> On a veteran-owned set-aside, at least half of what VA pays must stay with your own firm. Know who teaches each class, and who is on your payroll, *before* you quote.`,
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
        title: `Send the VA supervisor program to ${MENTOR.firstName} for review`,
        content:
          `${hero.plainTitle}: Grant says bid it. Before Ava finishes the quote, ask ${MENTOR.firstName}: pursue or pass?\n\n` +
          `A review is $${WALLET.mentorReviewPrice} from your wallet. She answers within one business day.`,
        resourceUrl: `/opportunities/${hero.id}`,
        sortOrder: 1,
      }),
      step({
        id: "step-ava",
        title: "Answer Ava's questions on the VA supervisor program",
        content:
          `Ava has 3 questions: who your **Program Manager and Lead Facilitator** are, who **teaches the four cohorts**, and how you meet the **coach credential**. She cannot finish the quote without them. Due ${dueText("task-ava-va-program")}.`,
        resourceUrl: `/ava/${hero.id}`,
        sortOrder: 2,
      }),
      step({
        id: "step-grant-fixes",
        title: "Fix Grant's two things: the 50% rule and the coach line",
        content:
          `1. Count the paid hours by person. Your contract facilitators may count as subcontractors, so your own staff should carry at least half. If they don't, move one facilitator to payroll now. Due ${dueText("task-count-hours")}.\n` +
          `2. Ask the contracting officer before Q&A closes: *"Does an ICF ACC with 100+ hours coaching federal supervisors meet PCC or equal?"* Every bidder sees the answer, so ask it plainly. Due ${dueText("task-coach-question")}.\n` +
          `3. Upload your hours count here. Ava uses it for the certificate that goes in with the quote.`,
        allowMemberUpload: true,
        sortOrder: 3,
      }),
      step({
        id: "step-partner",
        title: `Reply to ${KEY_PARTNER.name} about the Army training`,
        content:
          `${KEY_PARTNER.name}, in ${KEY_PARTNER.city}, holds the Army's HR Solutions contract. Only holders can bid the family readiness training when it comes back, so they want ${lowerFirst(KEY_PARTNER.seeking)}.\n\n` +
          `Write to ${KEY_PARTNER.contact}, their ${KEY_PARTNER.contactTitle.toLowerCase()}. Keep it short. Due ${dueText("task-halyard-point")}.\n\n` +
          `> "We are a service-disabled veteran-owned consulting firm in ${PERSONA.hqCity}. We taught your Southeast virtual classes from 2023 to 2025. We would like to teach the in-person classes in NC, SC and VA on the next order."`,
        resourceUrl: "/partners",
        sortOrder: 4,
      }),
      step({
        id: "step-vetcert",
        title: "Start your VetCert recertification",
        content:
          `Your service-disabled veteran-owned status renews every 3 years, and your eligibility ends in 87 days. The 90-day window is open now, and VA checks your status at award. Without it, you can't quote the supervisor program.\n\n` +
          `Start it from **Stay Ready**, or let us file it for you. Due ${dueText("task-vetcert-renewal")}.`,
        resourceUrl: "/my-business",
        sortOrder: 5,
      }),
      step({
        id: "step-gsa",
        title: "Start your GSA schedule offer",
        content:
          `The Fort Bragg manpower order was open only to GSA schedule holders, and much of the base's consulting work is bought that way. You have been in business 8 years, so you meet the two-year rule. Gather two years of financials and three references. An offer takes months, so start now. Due ${dueText("task-gsa-offer")}.`,
        resourceUrl: "/my-business",
        sortOrder: 6,
      }),
    ],
  };
}

/** Diana's closed answers, which the shared feed (unread replies only) does not show. */
export function homeActivity(): ActivityItem[] {
  const out: ActivityItem[] = [];
  const pass = MENTOR_REVIEWS.find((r) => r.id === "rev-oshr-pass");
  if (pass) {
    const opp = pass.oppId ? getOpportunity(pass.oppId) : undefined;
    out.push({
      id: "act-oshr-pass",
      kind: "mentor",
      title: `${MENTOR.name} advised you to pass: ${opp?.plainTitle ?? pass.title}`,
      detail: pass.outcome,
      at: isoDaysFromNow(-pass.lastMessageDaysAgo, 14),
      to: `/mentors/${pass.id}`,
    });
  }
  const howTo = MENTOR_REVIEWS.find((r) => r.id === "rev-cpars-howto");
  if (howTo) {
    out.push({
      id: "act-cpars-howto",
      kind: "mentor",
      title: `${MENTOR.name} answered your question about the interim CPARS`,
      detail: howTo.outcome,
      at: isoDaysFromNow(-howTo.lastMessageDaysAgo, 14),
      to: `/mentors/${howTo.id}`,
    });
  }
  return out;
}
