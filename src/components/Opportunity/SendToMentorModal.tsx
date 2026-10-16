// Send-an-opportunity-to-a-mentor dialog. The form and the wallet half live
// in `Mentors/MentorSendModal.tsx`, shared with the small-order dialog; this
// file supplies only what is the opportunity page's own: Grant's take as the
// "What I'm sending" line, and the bid-shaped help topics.
import type { Opportunity } from "../../lib/mock/opportunities";
import type { GrantVerdict } from "../../lib/mock/grantAnalysis";
import {
  MentorSendModal,
  type MentorHelpOption,
  type MentorRequest,
} from "../Mentors/MentorSendModal";

export const OPPORTUNITY_HELP_OPTIONS: MentorHelpOption[] = [
  { label: "Should I bid on this?" },
  { label: "Am I eligible?", detail: "(set-aside, licences, bonding, experience)" },
  { label: "Pricing" },
  { label: "Writing the proposal" },
  { label: "Teaming or subcontracting" },
  { label: "Something else" },
];

export function SendToMentorModal({
  opp,
  verdict,
  ...rest
}: {
  /** Only the title is read, so a forecast can send its own. */
  opp: Pick<Opportunity, "title">;
  /** Only the call and its reason are read, so a forecast can send Grant's call. */
  verdict: Pick<GrantVerdict, "rationale"> & { call: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (request: MentorRequest) => void;
  /** Live wallet balance (USD) from the backend. */
  balance: number;
  /** Per-review charge (USD) from the backend. */
  chargeAmount: number;
  sending?: boolean;
  loading?: boolean;
  error?: string | null;
  locationId?: string;
}) {
  return (
    <MentorSendModal
      {...rest}
      snapshotTitle={opp.title}
      snapshotLine={
        <>
          Grant's take: <strong>{verdict.call}</strong> — {verdict.rationale}
        </>
      }
      readLabel="I've read the scope of work"
      helpOptions={OPPORTUNITY_HELP_OPTIONS}
      questionPlaceholder={`e.g. "I do roofing but haven't done a water plant. Does my past work count, and is the bond a problem?"`}
    />
  );
}
