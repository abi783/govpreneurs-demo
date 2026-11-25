import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { updateJourney, useJourney } from "../../../lib/state/partnerJourney";
import { dateWords, moneyWords } from "./WorkingStep";
import type { StepProps } from "./types";

/**
 * Finished a job for them: the job she did, and one step to keep it as past
 * performance.
 *
 * PROTOTYPE. The app has no past-performance store that this step can write to.
 * The business profile list is a fixed fixture, and the micro-purchases store
 * (`recordWin()`) holds only orders from a government buyer. A job for a prime
 * contractor in that store would show on her capability statement as a federal
 * order. So this step keeps the record in the partner journey
 * (`pastPerformanceAdded`) and links to the business profile. A production port
 * must write a real past-performance entry with the company name and the job.
 */
export function FinishedStep({ entry }: StepProps) {
  const j = useJourney(entry.awardeeKey);
  const job = j.job;

  const add = () => updateJourney(entry.awardeeKey, { pastPerformanceAdded: true });

  return (
    <div className="pstep">
      {(job || j.finishedAt) && (
        <div className="work-summary">
          {job && <p className="work-summary__what">{job.what}</p>}
          {(j.finishedAt || job?.value) && (
            <dl className="work-summary__facts">
              {j.finishedAt && (
                <div className="work-summary__fact">
                  <dt>Finished</dt>
                  <dd>{dateWords(j.finishedAt)}</dd>
                </div>
              )}
              {job?.value && (
                <div className="work-summary__fact">
                  <dt>Worth</dt>
                  <dd className="work-summary__num">{moneyWords(job.value)}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
      {j.pastPerformanceAdded ? (
        <>
          <p className="pstep__status" role="status">
            <Check size={16} aria-hidden /> Added to your record of finished jobs.
          </p>
          <Link to="/business-profile" search={{ tab: "stay-ready" }} className="work-link">
            See your business profile <ArrowRight size={14} aria-hidden />
          </Link>
        </>
      ) : (
        <>
          <p className="pstep__note">
            A finished job proves that you can do the work. Buyers look for it.
          </p>
          <button type="button" className="pstep-btn" onClick={add}>
            Add this job to my record
          </button>
        </>
      )}
    </div>
  );
}
