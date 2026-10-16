"use client";

import { PlaybookView } from "./PlaybookView";
import { ProgressOverview } from "./ProgressOverview";
import type { SectionProgress, ActivePlaybook } from "@sc/types/portal";
// DEMO: the type only. lib/progress.ts holds Prisma code, so it does not come across.
import type { MainStepProgress } from "@/demo/sc/home/types";

/**
 * The home page shows the Action Plan only. Call-derived tasks now live on the
 * member's task ledger at /{locationId}/tasks (PR #22), which gates them on
 * exact transcript attribution — the earlier "Your Tasks" tab here matched
 * transcripts by any shared 3-character word and put one member's follow-ups
 * in front of another, so it was pulled the day it shipped.
 */

interface PortalMainTabsProps {
  sections: SectionProgress[];
  overallPercentage: number;
  roadmapMainSteps?: MainStepProgress[];
  roadmapOverallPercentage?: number;
  locationId?: string;
  /** General Admission Summit centre: "Go To Roadmap" becomes a locked notice. */
  roadmapLocked?: boolean;
  activePlaybooks: ActivePlaybook[];
  /** Assignment id from `?plan=` — that one plan opens, the rest stay shut. */
  openPlanId?: string | null;
}

export function PortalMainTabs({
  sections,
  overallPercentage,
  roadmapMainSteps,
  roadmapOverallPercentage,
  locationId,
  roadmapLocked = false,
  activePlaybooks,
  openPlanId = null,
}: PortalMainTabsProps) {
  const hasPlans = activePlaybooks.length > 0;

  const actionPlanSection = (
    <div>
      <div className="flex border-b border-white/[0.08] mb-4">
        <div className="px-1 pb-3 text-[0.85rem] font-bold text-white border-b-2 border-[var(--green-text)] -mb-px">
          Your Action Plan
          {hasPlans && (
            <span className="ml-1.5 text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[var(--text-muted)]">
              {activePlaybooks.length}
            </span>
          )}
        </div>
      </div>

      {hasPlans ? (
        <div className="flex flex-col gap-3">
          {activePlaybooks.map((p) => (
            <PlaybookView
              key={p.assignmentId}
              playbook={p}
              locationId={locationId}
              autoOpen={p.assignmentId === openPlanId}
            />
          ))}
        </div>
      ) : (
        <div className="text-[0.8rem] text-[var(--text-muted)] py-6 text-center">
          No action plan assigned yet.
        </div>
      )}
    </div>
  );

  const progressSection = (
    <ProgressOverview
      sections={sections}
      overallPercentage={overallPercentage}
      mainSteps={roadmapMainSteps}
      roadmapOverallPercentage={roadmapOverallPercentage}
      locationId={locationId}
      roadmapLocked={roadmapLocked}
    />
  );

  // The Action Plan leads the page when the member has one; without a plan
  // the empty state stays below the Account Status block.
  return (
    <div>
      {hasPlans ? (
        <>
          {actionPlanSection}
          <div className="mt-6">{progressSection}</div>
        </>
      ) : (
        <>
          {progressSection}
          {actionPlanSection}
        </>
      )}
    </div>
  );
}
