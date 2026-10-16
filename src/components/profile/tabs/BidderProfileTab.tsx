import { Section } from "../Section";
import { FieldRow } from "../FieldRow";
import { useProfileMode } from "../BusinessProfileMode";

export function BidderProfileTab() {
  const cold = useProfileMode() === "onboarding";
  return (
    <>
      {cold && (
        <p className="bp-empty-hint">
          Nothing here yet — Grant fills this in as you discuss specific
          opportunities. Or add fields manually below.
        </p>
      )}
      <Section

      t1Fields={[]}
      t2Fields={[
        <FieldRow
          key="annual-revenue"
          tier="T2"
          label="Annual Revenue Band"
          state="missing"
          helperMicrocopy="Roughly what your firm makes in a year. Used by Grant to scale capacity expectations."
          whyItMatters="Grant uses revenue size to flag contracts that would overload your firm or be too small to bother with."
        />,
        <FieldRow
          key="employees"
          tier="T2"
          label="Total Employees (W-2)"
          state="attested"
          value="3"
          source="You told Hunter on 2026-04-18"
        />,
        <FieldRow
          key="basic-insurance"
          tier="T2"
          label="Basic Insurance"
          state="missing"
          helperMicrocopy="Just whether you have general liability insurance. Detail can be added later."
          whyItMatters="Most federal contracts require minimum insurance — Grant flags ones where your coverage is short."
        />,
        <FieldRow
          key="concurrent-capacity"
          tier="T2"
          label="Concurrent Contract Capacity"
          state="inferred"
          value="1 contract at a time"
          source="Hunter's guess based on your team size of 3"
          whyItMatters="Helps Grant flag contracts that would conflict if you won them simultaneously."
        />,
      ]}
      t3Fields={[
        <FieldRow key="cash-flow" tier="T3" label="Cash Flow Tolerance" state="missing" />,
        <FieldRow key="bonding" tier="T3" label="Bonding Capability" state="missing" />,
        <FieldRow key="insurance-detail" tier="T3" label="Insurance — per coverage type" state="missing" />,
        <FieldRow key="risk" tier="T3" label="Risk Appetite" state="missing" />,
        <FieldRow key="competitors" tier="T3" label="Competitors Known" state="missing" />,
        <FieldRow key="teaming" tier="T3" label="Teaming Partners" state="missing" />,
        <FieldRow key="dealbreakers" tier="T3" label="Bid/No-Bid Deal-Breakers" state="missing" />,
        <FieldRow key="subs" tier="T3" label="Subcontractor Pool Size" state="missing" />,
        <FieldRow key="mpa" tier="T3" label="Mentor-Protégé Agreement" state="missing" />,
        <FieldRow key="jv" tier="T3" label="Joint Ventures" state="missing" />,
      ]}
      footerProgressText="2 of 4 essentials complete"
      footerUnlocksText="This section unlocks: Grant's risk-aware bid memos"
    />
    </>
  );
}

