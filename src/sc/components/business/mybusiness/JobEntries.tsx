/**
 * JobEntries — the jobs she has done, each as its own entry. FRAMEWORKS & DRIVERS.
 *
 * STRUCTURED BECAUSE BUYERS ASK FOR IT STRUCTURED. A live school-district
 * solicitation demands five references, two of them from accounts of similar
 * size. A paragraph cannot answer that, and neither could what this row used to
 * render: `formatValue` flattens a job into one string — customer, scope, worth,
 * dates and place run together with "·" — and three jobs into one line joined
 * with "; ". Everything needed was on the record and none of it was legible.
 *
 * It reads the stored `JobEntry` rather than a `DisplayPart`, because the parts
 * are strings and this needs the fields. That is the only reason this component
 * exists rather than another case in `ValueLines`.
 *
 * HER WORDS FOR THE MONEY, WHERE SHE GAVE THEM. `valueText` holds the worth
 * exactly as she typed it — "about 25k" is a real answer that no number can
 * carry — so it wins over the formatted `valueUSD`. See `mbValue.ts`.
 */

"use client";

import type { ReactElement } from "react";
import { fullDate, usd, type JobEntry } from "@sc/lib/businessProfile/mbValue";
import "./mybusiness.css";

/** What kind of buyer it was, in her words rather than the stored slug. */
const CUSTOMER: Record<JobEntry["customerType"], string> = {
  federal: "US government",
  state: "State",
  local: "City or county",
  school: "School district",
  nonprofit: "Community",
  private: "Private",
};

export interface JobEntriesProps {
  jobs: readonly JobEntry[];
}

/** The worth, as she gave it. */
function worthOf(job: JobEntry): string | null {
  if (job.valueText && job.valueText.trim() !== "") return job.valueText;
  return job.valueUSD != null ? usd(job.valueUSD) : null;
}

/** When it ran. A job with no end date is still running, and says so. */
function whenOf(job: JobEntry): string | null {
  if (!job.startedAt) return null;
  return job.endedAt
    ? `${fullDate(job.startedAt)} to ${fullDate(job.endedAt)}`
    : `${fullDate(job.startedAt)} until now`;
}

/** Every job on the row, newest arrangement left to the record's own order. */
export function JobEntries({ jobs }: JobEntriesProps): ReactElement {
  return (
    <ul className="mb-jobs">
      {jobs.map((job, i) => {
        const worth = worthOf(job);
        const when = whenOf(job);
        const meta = [worth, when, job.place].filter((part) => part != null && part !== "");
        return (
          <li className="mb-job" key={job.id || `${job.customer}${i}`}>
            <div className="mb-job__head">
              <span className="mb-job__customer">{job.customer}</span>
              <span className="gpds-mono mb-job__type">{CUSTOMER[job.customerType]}</span>
            </div>
            {job.scope ? <p className="mb-job__scope">{job.scope}</p> : null}
            {/* DEMO: show the outcome line (for example "no rating yet"). */}
            {job.outcome ? <p className="mb-job__scope">{job.outcome}</p> : null}
            {meta.length > 0 ? (
              <p className="mb-job__meta">
                {meta.map((part, j) => (
                  <span key={j}>
                    {j > 0 ? (
                      <span className="mb-job__sep" aria-hidden>
                        {" · "}
                      </span>
                    ) : null}
                    <span className={j === 0 && worth ? "gpds-mono mb-job__worth" : undefined}>
                      {part}
                    </span>
                  </span>
                ))}
              </p>
            ) : null}
            {/* THE REFERENCE IS THE FIELD BUYERS ACTUALLY USE — they phone it.
                So it is shown, and whether she has said we may pass it on is
                shown with it. A name we cannot pass on is not a reference yet,
                and saying so is the only way she learns to fix it. */}
            {job.reference ? (
              <p className={job.reference.mayContact ? "mb-job__ref" : "mb-job__ref mb-job__ref--held"}>
                {job.reference.mayContact ? (
                  <>
                    <CheckMark />
                    {job.reference.name}
                    {job.reference.title ? `, ${job.reference.title}` : ""} can speak for you
                  </>
                ) : (
                  <>{job.reference.name} — you have not said we can share this</>
                )}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** The one glyph this view needs, inline — the drawing convention this folder
 *  follows. Decorative: the sentence beside it already says what it means. */
function CheckMark(): ReactElement {
  return (
    <svg
      className="mb-job__tick"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
