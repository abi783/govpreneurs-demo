// THE TRUCKING COMPANY: Tanya's Success Center home — Diana's action plan, and the
// lines "Recent activity" adds to the ones every member gets (src/demo/sc/home/).
//
// The hero (the Fayetteville VA supply and linen runs) has no mentor review yet:
// Tim sends it live on the call. So the plan's review step is open, and the
// activity shows Diana's other answers instead: Discuss on the lab courier quote
// (today, from the shared feed), Pass on the national secure-freight program, and
// her how-to on SDDC's carrier program.

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
    id: "playbook-va-and-fort-bragg-freight",
    title: "Your VA and Fort Bragg freight plan: the next 30 days",
    description:
      `**From ${MENTOR.name}.** After your positioning call, these are the seven things that will move ${PERSONA.businessShortName} toward VA trucking set aside for service-disabled veteran-owned firms, Fort Bragg's hauling jobs and DoD freight.\n\n` +
      `Work from the top down. Check off each step when it is done. Your **Tasks** page shows the same work, with due dates.\n\n` +
      `> VA route contracts run five years at a fixed price. Know your diesel price, your drivers and your backup truck *before* you quote.`,
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
        title: `Send the VA supply runs to ${MENTOR.firstName} for review`,
        content:
          `${hero.plainTitle}: Grant says bid it. Before Ava finishes the quote, ask ${MENTOR.firstName}: pursue or pass?\n\n` +
          `A review is $${WALLET.mentorReviewPrice} from your wallet. She answers within one business day.`,
        resourceUrl: `/opportunities/${hero.id}`,
        sortOrder: 1,
      }),
      step({
        id: "step-ava",
        title: "Answer Ava's questions on the VA supply runs",
        content:
          `Ava has 3 questions: who your **PM and Alternate** are, which **trucks** run the routes, and how you answer the **license line**. She cannot finish the quote without them. Due ${dueText("task-ava-va-routes")}.`,
        resourceUrl: `/ava/${hero.id}`,
        sortOrder: 2,
      }),
      step({
        id: "step-grant-fixes",
        title: "Fix Grant's two things: the license line and diesel",
        content:
          `1. Ask the contract specialist before questions close: *"Which license does the hazardous material license number line mean, and what bond amount do drivers need?"* Every bidder sees the answer, so ask it plainly. Due ${dueText("task-license-question")}.\n` +
          `2. Ask whether VA will add a fuel adjustment. If not, quote diesel at a stated base price and write it into your quote. Due ${dueText("task-fuel-price")}.\n` +
          `3. Upload the answers here. Ava uses them in the quote.`,
        allowMemberUpload: true,
        sortOrder: 3,
      }),
      step({
        id: "step-partner",
        title: `Reply to ${KEY_PARTNER.name} about Fort Bragg's logistics contract`,
        content:
          `${KEY_PARTNER.name}, in ${KEY_PARTNER.city}, holds ${lowerFirst(KEY_PARTNER.holds)}. Only holders can bid the next one, so they want ${lowerFirst(KEY_PARTNER.seeking)}.\n\n` +
          `Write to ${KEY_PARTNER.contact}, their ${KEY_PARTNER.contactTitle.toLowerCase()}. Keep it short. Due ${dueText("task-brightwater")}.\n\n` +
          `> "We are a service-disabled veteran-owned carrier in ${PERSONA.hqCity}. We ran 46 trailer and container moves for the 18th Airborne Corps last year. We would like to run the freight and trailer moves on your Fort Bragg team."`,
        resourceUrl: "/partners",
        sortOrder: 4,
      }),
      step({
        id: "step-vetcert",
        title: "Start your VetCert recertification",
        content:
          `Your service-disabled veteran-owned status renews every 3 years, and your eligibility ends in 47 days. The 90-day window is open now. Without it, you can't quote VA set-asides like the supply and linen runs.\n\n` +
          `Start it from **Stay Ready**, or let us file it for you.`,
        resourceUrl: "/my-business",
        sortOrder: 5,
      }),
      step({
        id: "step-sddc",
        title: "Register in SDDC's carrier program",
        content:
          `Most DoD freight is booked through SDDC, and only registered carriers get it. You meet the three-year authority rule. You still need a Syncada account, a DoD bond and cargo insurance on file. Registration opens in seasons, so have the papers ready. ${MENTOR.firstName}'s checklist is in your **Mentors** thread.`,
        resourceUrl: "/mentors/rev-sddc-howto",
        sortOrder: 6,
      }),
    ],
  };
}

/** Diana's closed answers, which the shared feed (unread replies only) does not show. */
export function homeActivity(): ActivityItem[] {
  const out: ActivityItem[] = [];
  const pass = MENTOR_REVIEWS.find((r) => r.id === "rev-tps-pass");
  if (pass) {
    const opp = pass.oppId ? getOpportunity(pass.oppId) : undefined;
    out.push({
      id: "act-tps-pass",
      kind: "mentor",
      title: `${MENTOR.name} advised you to pass: ${opp?.plainTitle ?? pass.title}`,
      detail: pass.outcome,
      at: isoDaysFromNow(-pass.lastMessageDaysAgo, 14),
      to: `/mentors/${pass.id}`,
    });
  }
  const howTo = MENTOR_REVIEWS.find((r) => r.id === "rev-sddc-howto");
  if (howTo) {
    out.push({
      id: "act-sddc-howto",
      kind: "mentor",
      title: `${MENTOR.name} answered your question about SDDC's carrier program`,
      detail: howTo.outcome,
      at: isoDaysFromNow(-howTo.lastMessageDaysAgo, 14),
      to: `/mentors/${howTo.id}`,
    });
  }
  return out;
}
