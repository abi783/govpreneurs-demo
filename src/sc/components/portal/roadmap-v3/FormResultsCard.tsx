"use client";

// Roadmap v3 — what the audit found, after she submitted the form.
//
// Before this, submitting the Digital Compliance Audit Form on v3 made the
// Form card vanish and showed nothing in its place: the check had run, its
// findings were sitting in the verification row, and she never saw them. v2
// has shown this list since June; this is the same rule (`form.results()` in
// lib/roadmapV3/forms.ts) rendered in v3's own vocabulary.
//
// A row's verdict is the scan's, UNLESS the gap has since been closed — the
// scan is frozen at submission time and would otherwise keep saying "Gap
// found" about something a mentor already fixed.

import { useState } from "react";
import { dcProvidedHref } from "@sc/lib/digitalCompliance";
import type { FormResult } from "@sc/lib/roadmapV3/forms";
import { ArrowRight, ChevronDown } from "./Icon";

/** Verdict → the badge classes the design system already ships. */
const BADGE: Record<FormResult["status"], { cls: string; label: string }> = {
  pass: { cls: "badge badge-pos no-dot", label: "Verified" },
  fixed: { cls: "badge badge-pos no-dot", label: "Fixed" },
  needs_review: { cls: "badge badge-warn no-dot", label: "Needs review" },
  fail: { cls: "badge badge-urg no-dot", label: "Gap found" },
  // A field she left blank IS a gap — rendering it as "Not yet" would read as
  // optional, which it is not.
  skipped: { cls: "badge badge-urg no-dot", label: "Gap found" },
  // Her own opt-out answers — verified, nothing to do, so quiet neutrals.
  not_applicable: { cls: "badge badge-neutral no-dot", label: "Not Applicable" },
  refused: { cls: "badge badge-neutral no-dot", label: "Refused" },
};

export function FormResultsCard({
  title,
  results,
  button,
  onGoTo,
}: {
  /** The form's card title, so the results read as belonging to it. */
  title: string;
  results: FormResult[];
  button?:
    | { label: string; url: string }
    | { label: string; phaseIndex: number; subId: string };
  onGoTo: (phaseIndex: number, subId: string, opts?: { toTop?: boolean }) => void;
}) {
  const gaps = results.filter((r) => r.status === "fail" || r.status === "skipped").length;
  /* Twelve rows, each with a description, its evidence and what she typed —
     open, it is most of a screen, and on the audit step it sat between her
     and the call she came to book. The summary line above carries the count,
     so collapsed it still says what was found; this only holds back the
     detail behind it. Closed by default for the same reason. */
  const [open, setOpen] = useState(false);
  const listId = "rm3-results-list";

  return (
    <div className="rm2-panel rm3-results">
      <div className="rm3-results__head">
        <div className="rm2-panel-title">{title}</div>
        <div className="rm2-panel-desc">
          {gaps === 0
            ? "We checked your answers — nothing is flagged."
            : `We checked your answers and found ${gaps === 1 ? "1 gap" : `${gaps} gaps`}.`}{" "}
          Your mentor&apos;s audit overrides anything here.
        </div>
      </div>

      <button
        type="button"
        className="rm3-results__toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {open ? "Hide" : "Show"} what we checked
          <span className="rm3-results__count"> ({results.length})</span>
        </span>
        <ChevronDown size={16} className={open ? "is-open" : undefined} aria-hidden />
      </button>

      <ul className="rm3-results__list" id={listId} hidden={!open}>
        {results.map((r) => (
          <li key={r.title} className="rm3-results__row">
            <div className="rm3-results__main">
              <span className="rm3-results__title">{r.title}</span>
              {r.description && <span className="rm3-results__desc">{r.description}</span>}
              {r.provided && (
                <span className="rm3-results__prov">
                  You provided:{" "}
                  {dcProvidedHref(r.provided) ? (
                    <a href={dcProvidedHref(r.provided)!} target="_blank" rel="noopener noreferrer">
                      {r.provided}
                    </a>
                  ) : (
                    r.provided
                  )}
                </span>
              )}
              {r.evidence && <span className="rm3-results__ev">{r.evidence}</span>}
            </div>
            <span className={BADGE[r.status].cls}>{BADGE[r.status].label}</span>
          </li>
        ))}
      </ul>

      {button &&
        ("url" in button ? (
          <a href={button.url} className="rm2-btn rm2-btn--blue-outline">
            {button.label} <ArrowRight size={14} />
          </a>
        ) : (
          <button
            type="button"
            className="rm2-btn rm2-btn--blue-outline"
            // Another part of the roadmap — land at the top of it, not
            // half way down whatever was already on screen.
            onClick={() => onGoTo(button.phaseIndex, button.subId, { toTop: true })}
          >
            {button.label} <ArrowRight size={14} />
          </button>
        ))}
    </div>
  );
}
