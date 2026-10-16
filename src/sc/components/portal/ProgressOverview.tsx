"use client";

import { useState } from "react";
import { Card } from "@sc/components/ui/Card";
import { ProgressBar } from "@sc/components/ui/ProgressBar";
import type { SectionProgress } from "@sc/types/portal";
// DEMO: the type only. lib/progress.ts holds Prisma code, so it does not come across.
import type { MainStepProgress } from "@/demo/sc/home/types";
import { SUMMIT_ROADMAP_LOCK_TITLE } from "@sc/lib/walletCopy";

interface ProgressOverviewProps {
  sections: SectionProgress[];
  overallPercentage: number;
  /** Section IDs to fully exclude from totals + breakdown (admin-set "Excluded" mode). */
  excludedSectionIds?: string[];
  /** When provided, render the new roadmap-driven view (main steps collapsible
   *  by sub-steps + "Go To Roadmap" CTA). When omitted, fall back to the legacy
   *  flat section grid used by the tasks page and admin center detail page. */
  mainSteps?: MainStepProgress[];
  roadmapOverallPercentage?: number;
  locationId?: string;
  /** General Admission Summit centre: the "Go To Roadmap" button becomes a
   *  locked notice. The progress rows stay — they are progress, not content. */
  roadmapLocked?: boolean;
}

const ROADMAP_MENU_LINK_ID = "fd379a59-2793-4d35-bec4-4541260e12cc";

// Always-expanded: the outer card no longer toggles. The customer
// lands on the Success Center and immediately sees the main-step
// progress bars under the header. Each main step is itself collapsed
// by default (no sub-step rail) and clicking an individual row
// expands its sub-steps. Tim's ask: don't make customers click once
// to see their main-step progress.

export function ProgressOverview({
  sections,
  overallPercentage,
  excludedSectionIds,
  mainSteps,
  roadmapOverallPercentage,
  locationId,
  roadmapLocked = false,
}: ProgressOverviewProps) {
  const useRoadmapView = Array.isArray(mainSteps) && mainSteps.length > 0;
  const displayPercentage = useRoadmapView
    ? (roadmapOverallPercentage ?? 0)
    : computeLegacyPercentage(sections, overallPercentage, excludedSectionIds);
  const displaySections = useRoadmapView
    ? []
    : (excludedSectionIds && excludedSectionIds.length > 0
        ? sections.filter((s) => !new Set(excludedSectionIds).has(s.id))
        : sections);

  return (
    <Card className="mb-5 overflow-hidden">
      <div className="w-full flex items-center justify-between p-4">
        <h3 className="text-[0.78rem] font-bold tracking-[0.08em] uppercase text-[var(--text-secondary)] text-left">
          Your Account Status — Overall Progress
        </h3>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-[0.8rem] font-bold text-[var(--green-text)]">
            {displayPercentage}% Complete
          </span>
        </div>
      </div>

      <div className="border-t border-white/[0.04] px-6 pt-4 pb-6">
        <ProgressBar value={displayPercentage} className="mb-5" />

        {useRoadmapView ? (
          <RoadmapMainSteps mainSteps={mainSteps!} locationId={locationId} roadmapLocked={roadmapLocked} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {displaySections.map((section) => (
              <div key={section.id} className="flex flex-col gap-1.5">
                <div className="text-[0.72rem] text-[var(--text-secondary)] font-medium leading-snug">
                  {section.title}
                </div>
                {section.subtitle && (
                  <div className="text-[0.65rem] text-[var(--text-muted)]">{section.subtitle}</div>
                )}
                <ProgressBar value={section.percentage} size="sm" />
                <div className="text-[0.68rem] font-bold text-[var(--green-text)]">
                  {section.percentage}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function RoadmapMainSteps({
  mainSteps,
  locationId,
  roadmapLocked,
}: {
  mainSteps: MainStepProgress[];
  locationId: string | undefined;
  roadmapLocked: boolean;
}) {
  // DEMO: was the GoHighLevel menu-link URL for the Roadmap. The demo's Roadmap is /roadmap.
  const roadmapHref = locationId ? "/roadmap" : null;
  // Exclusive accordion — opening one main step collapses the others.
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {mainSteps.map((step) => (
        <MainStepRow
          key={step.id}
          step={step}
          open={openId === step.id}
          onToggle={() => setOpenId((cur) => (cur === step.id ? null : step.id))}
        />
      ))}

      {roadmapHref && roadmapLocked && (
        <div
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[0.8rem] font-bold rounded-[var(--radius-sm)] bg-white/[0.06] border border-white/[0.1] text-[var(--text-muted)]"
          role="note"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {SUMMIT_ROADMAP_LOCK_TITLE}
        </div>
      )}

      {roadmapHref && !roadmapLocked && (
        <a
          href={roadmapHref}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[0.8rem] font-bold rounded-[var(--radius-sm)] transition-colors"
          style={{ background: "var(--gold)", color: "#ffffff" }}
        >
          Go To Roadmap
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      )}
    </div>
  );
}

function MainStepRow({
  step,
  open,
  onToggle,
}: {
  step: MainStepProgress;
  open: boolean;
  onToggle: () => void;
}) {
  const hasSubs = step.subSteps.length > 0;

  return (
    <div className="rounded-[var(--radius-sm)] border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => hasSubs && onToggle()}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${hasSubs ? "hover:bg-white/[0.03] cursor-pointer" : "cursor-default"}`}
        aria-expanded={open}
        disabled={!hasSubs}
      >
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.82rem] font-semibold text-white truncate text-left">{step.title}</span>
            <span className="text-[0.7rem] font-bold text-[var(--green-text)] flex-shrink-0">
              {step.percentage}%
            </span>
          </div>
          <ProgressBar value={step.percentage} size="sm" />
          <div className="text-[0.65rem] text-[var(--text-muted)] text-left">
            {step.completedCount} of {step.totalCount} steps
          </div>
        </div>
        {hasSubs && (
          <svg
            className={`w-4 h-4 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {hasSubs && open && (
        <div className="border-t border-white/[0.04] px-4 py-3 flex flex-col gap-2.5 bg-black/10">
          {step.subSteps.map((sub) => (
            <div key={sub.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.74rem] text-[var(--text-secondary)] truncate">{sub.title}</span>
                <span className="text-[0.65rem] font-bold text-[var(--green-text)] flex-shrink-0">
                  {sub.percentage}%
                </span>
              </div>
              <ProgressBar value={sub.percentage} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function computeLegacyPercentage(
  sections: SectionProgress[],
  overallPercentage: number,
  excludedSectionIds?: string[],
): number {
  if (!excludedSectionIds || excludedSectionIds.length === 0) return overallPercentage;
  const excl = new Set(excludedSectionIds);
  let total = 0, done = 0;
  for (const s of sections) {
    if (excl.has(s.id)) continue;
    total += s.totalCount;
    done += s.completedCount;
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}
