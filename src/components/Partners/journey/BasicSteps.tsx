import { ExternalLink, ShieldCheck } from "lucide-react";
import { useJourney } from "../../../lib/state/partnerJourney";
import type { PrimeCandidate } from "../../../lib/partnersApi";
import type { StepProps } from "./types";

/** Saved: one step, start the pursuit. */
export function SavedStep({ onMoveTo }: StepProps) {
  return (
    <div className="pstep">
      <button type="button" className="pstep-btn" onClick={() => onMoveTo("researching")}>
        Start pursuing
      </button>
    </div>
  );
}

const dateWords = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const monthYear = (d: Date) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

/**
 * When to contact them about their next job. The date is the earliest job end still
 * ahead. More than 12 months away, the line gives the month only: advice to wait four
 * years helps nobody.
 */
function nextJobLine(partner?: PrimeCandidate): string | null {
  const now = Date.now();
  const ends = (partner?.recentJobs ?? [])
    .map((j) => (j.endsAt ? new Date(j.endsAt).getTime() : NaN))
    .filter((t) => t > now);
  const months = partner?.economics.recompeteMonthsOut ?? null;
  const at = ends.length
    ? new Date(Math.min(...ends))
    : months !== null
      ? new Date(now + months * 30 * 86_400_000)
      : null;
  if (!at) return null;
  const inMonths = Math.max(1, Math.round((at.getTime() - now) / (30 * 86_400_000)));
  if (inMonths > 12) return `Their next job ends in ${monthYear(at)}.`;
  if (inMonths <= 3) return `Their next job ends in ${monthYear(at)}. Contact them now.`;
  const wait = inMonths - 3;
  return `Their next job ends in ${monthYear(at)}. Contact them in about ${wait} ${wait === 1 ? "month" : "months"}.`;
}

/**
 * On their vendor list: the proof that she is registered, the way back to it,
 * and the next step.
 */
export function VendorStep({ entry, partner, onMoveTo }: StepProps) {
  const j = useJourney(entry.awardeeKey);
  const proof =
    j.dfy?.status === "done" && j.dfy.doneAt
      ? `GovPreneurs registered you on ${dateWords(j.dfy.doneAt)}.`
      : j.diy?.registeredAt
        ? `You registered on ${dateWords(j.diy.registeredAt)}.`
        : null;
  const timing = nextJobLine(partner);
  return (
    <div className="pstep">
      {proof && (
        <p className="pstep__status">
          <ShieldCheck size={16} aria-hidden /> {proof}
        </p>
      )}
      {partner?.website && (
        <a
          className="pstep-btn pstep-btn--secondary"
          href={partner.website}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open their website <ExternalLink size={14} aria-hidden />
        </a>
      )}
      <p className="pstep__note">
        Send them your capability statement and ask about jobs that are coming up.
        {timing && ` ${timing}`}
      </p>
      <button type="button" className="pstep-btn" onClick={() => onMoveTo("active_partner")}>
        We started a job together
      </button>
    </div>
  );
}
