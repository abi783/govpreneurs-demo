// DEMO: the action plan on the Success Center home ("Your Action Plan").
//
// In production a mentor assigns a plan: a title, a description and steps, all
// written in Markdown. The home shows each plan as a card that opens to its
// steps. The member on stage has one, written by Diana after the positioning
// call. Every fact in the text comes from the story files; none is typed twice.
// Amira's (the caterer's) plan is below; Dana's (the agency's) is in
// src/demo/members/agency/sc/home.ts.

import type { ActivePlaybook } from "@sc/types/portal";
import { byMember, own } from "@/demo/member";
import { getOpportunity } from "@/demo/story/opportunities";
import { KEY_PARTNER, MENTOR, PERSONA } from "@/demo/story/persona";
import { TASKS } from "@/demo/story/workspace";
import { getPlaybookState } from "./store";
import { HERO_IDS as CATERER_HERO } from "@/demo/members/caterer/opportunities";

const { homePlan } = own(
  import.meta.glob<typeof import("@/demo/members/agency/sc/home")>("/src/demo/members/*/sc/home.ts", { eager: true }),
);

export const PLAN_ASSIGNMENT_ID = "plan-fort-bragg-and-va";

/** One plan's own content: the rest of the card is the same for every member. */
export interface PlanContent {
  id: string;
  title: string;
  description: string;
  /** Steps that are done when the demo opens. The rest she can tick. */
  doneAtStart: string[];
  steps: ActivePlaybook["steps"];
}

/** A title inside a sentence: lower-case the first letter only, so names such as "Camp Mackall" keep their capitals. */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** The story's due dates for the tasks that these steps repeat. */
export function dueText(taskId: string): string {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task || task.dueInDays === null) return "";
  return task.dueInDays === 1 ? "tomorrow" : `in ${task.dueInDays} days`;
}

function catererPlan(): PlanContent {
  const fieldMeals = getOpportunity(CATERER_HERO.hero)!;
  return {
    id: "playbook-fort-bragg-and-va",
    title: "Your Fort Bragg and VA plan: the next 30 days",
    description:
      `**From ${MENTOR.name}.** After your positioning call, these are the six things that will move ${PERSONA.businessShortName} toward Fort Bragg dining and the VA.\n\n` +
      `Work from the top down. Check off each step when it is done. Your **Tasks** page shows the same work, with due dates.\n\n` +
      `> Fort Bragg and the VA buy food service on a schedule. Be registered, referenced and ready *before* the solicitation posts.`,
    doneAtStart: ["step-cap-statement", "step-mackall-review"],
    steps: [
      {
        id: "step-cap-statement",
        title: "Finish your capability statement",
        content:
          "Your capability statement is the one page that every buyer asks for. Yours is done and saved in **My Business**. Hunter now uses it to explain each match.",
        videoUrl: null,
        resourceUrl: "/my-business",
        attachmentUrl: PERSONA.capabilityStatementFile,
        attachmentName: "Haddad Catering capability statement (PDF)",
        allowMemberUpload: false,
        sortOrder: 0,
      },
      {
        id: "step-mackall-review",
        title: `Send "${fieldMeals.plainTitle}" to ${MENTOR.firstName} for review`,
        content:
          `${MENTOR.firstName} read it and said **pursue it**. Her notes are in Mentor Reviews.\n\n- It is a woman-owned set-aside with no incumbent.\n- It is sized for your kitchen.`,
        videoUrl: null,
        resourceUrl: "/mentors",
        attachmentUrl: null,
        attachmentName: null,
        allowMemberUpload: false,
        sortOrder: 1,
      },
      {
        id: "step-certificates",
        title: "Get your last two cooks food-handler certified",
        content:
          `The Camp Mackall quote asks for proof for **every cook**. ${PERSONA.foodHandlerCertified} of your ${PERSONA.employeesW2} cooks hold a certificate today.\n\n` +
          `1. Book the ServSafe food-handler course for the two cooks who do not have it.\n` +
          `2. When they pass, upload the certificates here as one PDF.\n` +
          `3. Ava uses them in your quote. Due ${dueText("task-certificates")}.`,
        videoUrl: null,
        resourceUrl: null,
        attachmentUrl: null,
        attachmentName: null,
        allowMemberUpload: true,
        sortOrder: 2,
      },
      {
        id: "step-ava",
        title: `Answer Ava's questions on ${lowerFirst(fieldMeals.plainTitle)}`,
        content:
          `Ava has questions about your **delivery times** and your **staffing plan**. She cannot finish the quote without them. It takes about ten minutes. Due ${dueText("task-ava-mackall")}.`,
        videoUrl: null,
        resourceUrl: `/ava/${CATERER_HERO.hero}`,
        attachmentUrl: null,
        attachmentName: null,
        allowMemberUpload: false,
        sortOrder: 3,
      },
      {
        id: "step-partner",
        title: `Contact ${KEY_PARTNER.name} about the Fort Bragg dining recompete`,
        content:
          `${KEY_PARTNER.name} has run the two Fort Bragg dining halls since 2019. They are looking for woman-owned subcontractors, and you worked for them in 2024.\n\n` +
          `Call ${KEY_PARTNER.contact}, their ${KEY_PARTNER.contactTitle.toLowerCase()}. Keep it short:\n\n` +
          `> "We worked together on the weekend dining shifts. The recompete is open. We are woman-owned, and we would like to be on your team."`,
        videoUrl: null,
        resourceUrl: "/partners",
        attachmentUrl: null,
        attachmentName: null,
        allowMemberUpload: false,
        sortOrder: 4,
      },
      {
        id: "step-targeting",
        title: `Book your quarterly targeting call with ${MENTOR.firstName}`,
        content:
          `In 30 minutes, ${MENTOR.firstName} plans your next quarter of bids around Fort Bragg and the VA. Pick a time on the **Mentors** page.`,
        videoUrl: null,
        resourceUrl: "/find-a-mentor",
        attachmentUrl: null,
        attachmentName: null,
        allowMemberUpload: false,
        sortOrder: 5,
      },
    ],
  };
}

function plan(): PlanContent {
  return byMember({ caterer: catererPlan, pack: homePlan })();
}

function seedStatuses(): Record<string, string> {
  return Object.fromEntries(plan().doneAtStart.map((id) => [id, "completed"]));
}

export function getActionPlans(): ActivePlaybook[] {
  const saved = getPlaybookState();
  const statuses = saved.statuses[PLAN_ASSIGNMENT_ID] ?? seedStatuses();
  const uploads = saved.uploads[PLAN_ASSIGNMENT_ID] ?? {};
  const content = plan();

  return [
    {
      id: content.id,
      assignmentId: PLAN_ASSIGNMENT_ID,
      title: content.title,
      description: content.description,
      sourceDocUrl: null,
      sourceDocName: null,
      currentStepIndex: 0,
      stepStatuses: statuses,
      stepUploads: Object.fromEntries(
        Object.entries(uploads).map(([stepId, u]) => [
          stepId,
          {
            url: `/api/portal/${PERSONA.locationId}/playbook-file/${PLAN_ASSIGNMENT_ID}/${stepId}`,
            name: u.name,
            uploadedAt: u.uploadedAt,
          },
        ]),
      ),
      steps: content.steps,
    },
  ];
}

export { seedStatuses as planSeedStatuses };
