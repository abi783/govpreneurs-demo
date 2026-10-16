import type { CSSProperties } from "react";
import { daysUntil } from "../../lib/format";
import type { Opportunity } from "../../lib/mock/opportunities";

type Milestone = {
  key: "posted" | "questions" | "site" | "proposal" | "award";
  label: string;
  iso: string;
  /** Verbatim time + timezone as written in the summary, e.g. "4:00 PM CST". Never re-derived. */
  timeText?: string | null;
  estimate?: boolean;
};

type ParsedDate = { iso: string; timeText: string | null; raw: string };

/**
 * Parse a free-text key-date bullet such as
 * "Response Deadline: June 29, 2026, 4:00 PM CST" into a calendar date (for
 * positioning) plus the original time/timezone text (for display).
 *
 * The time is preserved verbatim and NOT reinterpreted through Date — the
 * stated timezone (CST/PST/Central/…) is authoritative, and re-deriving it in
 * the browser's local zone would show the wrong clock time.
 */
function parseKeyDate(text: string): ParsedDate | null {
  const m = text.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const [, mon, day, year] = m;
  const base = new Date(`${mon} ${day}, ${year}`);
  if (Number.isNaN(base.getTime())) return null;

  // Grab an optional "12:34 pm CST"-style tail that follows the date, up to the
  // next comma/end. Handles lowercase + no-space variants like "10:00am".
  const tail = text.slice((m.index ?? 0) + m[0].length).match(/\d{1,2}:\d{2}[^,]*/);
  const timeText = tail ? tail[0].replace(/\s+/g, " ").trim() : null;
  return { iso: base.toISOString(), timeText, raw: text };
}

/** First key-date bullet whose label matches `re`, parsed. */
function findKeyDate(keyDates: string[], re: RegExp): ParsedDate | null {
  for (const entry of keyDates) {
    if (re.test(entry)) {
      const parsed = parseKeyDate(entry);
      if (parsed) return parsed;
    }
  }
  return null;
}

function fmt(iso: string, includeYear = false): string {
  const d = new Date(iso);
  return d.toLocaleDateString(
    "en-US",
    includeYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" },
  );
}

function fmtFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function OpportunityTimeline({
  opp,
  keyDates = [],
}: {
  opp: Opportunity;
  /** Key-date bullets from the RAG summary; real Questions/Site-visit dates are sourced from here. */
  keyDates?: string[];
}) {
  // Real dates from the opportunity + summary. Questions and site-visit
  // milestones only appear when the summary actually contains them — we no
  // longer fabricate them from arbitrary offsets.
  const questions = findKeyDate(keyDates, /question|q\s*&\s*a|q&a|inquir/i);
  const siteVisit = findKeyDate(keyDates, /site\s*visit|walk\s*-?\s*through|pre-?\s*bid|pre-?\s*proposal/i);
  // The response deadline bullet often carries the precise closing time
  // (e.g. "4:00 PM CST") that the raw responseDeadline date lacks.
  const deadline = findKeyDate(keyDates, /response\s*deadline|offer\s*deadline|proposal\s*(due|submission)|bids?\s*due|quotes?\s*due|final\s*date/i);
  // Award date is only shown when the summary actually states one — never fabricated.
  const award = findKeyDate(keyDates, /award\s*date|(proposed|anticipated|estimated|projected|intent\s*to|notice\s*of\s*intent).*award/i);

  const milestones: Milestone[] = [];
  if (opp.postedAt) milestones.push({ key: "posted", label: "Posted", iso: opp.postedAt });
  if (siteVisit) milestones.push({ key: "site", label: "Site visit", iso: siteVisit.iso, timeText: siteVisit.timeText });
  if (questions) milestones.push({ key: "questions", label: "Questions due", iso: questions.iso, timeText: questions.timeText });
  if (opp.closesAt) milestones.push({ key: "proposal", label: "Proposal due", iso: opp.closesAt, timeText: deadline?.timeText ?? null });
  if (award) {
    // Many stated award dates are themselves projections ("estimated"/"anticipated").
    const isEstimate = /estimate|anticipat|proposed|projected|tentative|on or about/i.test(award.raw);
    milestones.push({ key: "award", label: "Award", iso: award.iso, timeText: award.timeText, estimate: isEstimate });
  }

  // Keep nodes chronological regardless of the order dates were discovered in.
  milestones.sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());

  // Nothing meaningful to show without at least two dated milestones.
  if (milestones.length < 2) return null;

  const now = Date.now();
  const times = milestones.map((m) => new Date(m.iso).getTime());
  const spansMultipleYears = new Set(times.map((t) => new Date(t).getFullYear())).size > 1;
  const start = times[0];
  const end = times[times.length - 1];
  const nowClamped = Math.min(Math.max(now, start), end);

  // Nodes are laid out on an even grid of N equal columns (one per milestone),
  // not proportional to actual elapsed time. The CSS grid centers each node
  // within its column, so node i sits at ((i + 0.5) / N) of the track width.
  // "Now" must be interpolated on that same column-center scale — not as a raw
  // fraction of the timestamp span, which would misplace it badly when gaps
  // between milestones are very uneven (e.g. Posted being a year before the rest).
  let segmentIndex = 0;
  for (let i = 0; i < times.length - 1; i++) {
    if (nowClamped >= times[i]) segmentIndex = i;
  }
  const segStart = times[segmentIndex];
  const segEnd = times[segmentIndex + 1] ?? segStart;
  const segSpan = Math.max(segEnd - segStart, 1);
  const segFrac = Math.min(Math.max((nowClamped - segStart) / segSpan, 0), 1);
  const nowPct = ((segmentIndex + 0.5 + segFrac) / times.length) * 100;

  const daysToProposal = daysUntil(opp.closesAt, new Date(now));
  const urgent = daysToProposal >= 0 && daysToProposal <= 21;
  const critical = daysToProposal >= 0 && daysToProposal <= 7;

  const nowLabel =
    daysToProposal < 0
      ? "Closed"
      : daysToProposal === 0
      ? "Proposal due today"
      : `${daysToProposal} ${daysToProposal === 1 ? "day" : "days"} to proposal`;

  return (
    <section className="opp-timeline" aria-label="Opportunity timeline">
      <div className="opp-timeline__head">
        <span className="opp-timeline__kicker">TIMELINE</span>
        <span
          className={`opp-timeline__now-label${urgent ? " is-urgent" : ""}${critical ? " is-critical" : ""}`}
        >
          {nowLabel}
        </span>
      </div>

      <div className="opp-timeline__track-wrap">
        <div className="opp-timeline__track" aria-hidden />
        {nowClamped > start && nowClamped < end && (
          <div
            className={`opp-timeline__now-marker${urgent ? " is-urgent" : ""}${critical ? " is-critical" : ""}`}
            style={{ left: `${nowPct}%` }}
            aria-hidden
          >
            <span className="opp-timeline__now-tag">Today</span>
            <span className="opp-timeline__now-pin" />
          </div>
        )}
        <ol
          className="opp-timeline__nodes"
          style={{ "--tl-count": milestones.length } as CSSProperties}
        >
          {milestones.map((m, i) => {
            const t = times[i];
            const past = t < now;
            const isProposal = m.key === "proposal";
            const state =
              past ? "past" :
              isProposal && urgent ? (critical ? "critical" : "urgent") :
              "future";
            return (
              <li
                key={m.key}
                className={`opp-timeline__node opp-timeline__node--${state}`}
                title={m.timeText ? `${fmtFull(m.iso)} · ${m.timeText}` : fmtFull(m.iso)}
              >
                <span className="opp-timeline__dot" aria-hidden />
                <span className="opp-timeline__date">{fmt(m.iso, spansMultipleYears)}</span>
                {m.timeText && <span className="opp-timeline__time">{m.timeText}</span>}
                <span className="opp-timeline__label">
                  {m.label}
                  {m.estimate && <span className="opp-timeline__est"> est.</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
