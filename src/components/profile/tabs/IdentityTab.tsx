import { Section } from "../Section";
import { FieldRow } from "../FieldRow";

export function IdentityTab() {
  return (
    <Section
      t1Fields={[
        <FieldRow
          key="legal-name"
          tier="T1"
          label="Legal Name"
          state="verified"
          value="Williams Construction LLC"
          source="SAM.gov on 2026-04-15"
          whyItMatters="Your business's official legal name. Hunter uses this on proposals; mismatches with SAM can disqualify bids."
        />,
        <FieldRow
          key="ein"
          tier="T1"
          label="EIN"
          state="missing"
          helperMicrocopy="Your federal tax ID — the IRS issued this when your business was formed. It's on your CP-575 letter."
          whyItMatters="Federal contracts require your EIN for invoicing and tax forms. Most opportunities can't move forward without it."
        />,
        <FieldRow
          key="uei"
          tier="T1"
          label="UEI"
          state="verified"
          value={<span className="fr-mono">LW1SL1HLED3</span>}
          source="SAM.gov on 2026-04-15"
          whyItMatters="Your Unique Entity Identifier — the federal government's way to identify your business. It comes with SAM.gov registration."
        />,
        <FieldRow
          key="cage"
          tier="T1"
          label="CAGE"
          state="verified"
          value={<span className="fr-mono">16WG0</span>}
          source="SAM.gov on 2026-04-15"
          whyItMatters="Your Commercial and Government Entity code — used by DoD and other agencies for vendor identification."
        />,
        <FieldRow
          key="sam-status"
          tier="T1"
          label="SAM Status"
          state="verified"
          value="Active until April 15, 2027"
          source="SAM.gov on 2026-04-15"
          whyItMatters="An active SAM.gov registration is required for almost every federal opportunity. Renew before expiration."
        />,
      ]}
      t2Fields={[
        <FieldRow
          key="entity-type"
          tier="T2"
          label="Entity Type"
          state="verified"
          value="LLC"
          source="Articles of Organization on 2026-04-12"
          whyItMatters="Federal contracting generally requires a formal entity (LLC, Corp, Partnership) — sole proprietors are restricted."
        />,
        <FieldRow
          key="formation-state"
          tier="T2"
          label="Formation State"
          state="verified"
          value="North Carolina"
          source="Articles of Organization on 2026-04-12"
        />,
        <FieldRow
          key="physical-address"
          tier="T2"
          label="Physical Address"
          state="verified"
          value="201 Hay St, Fayetteville, NC 28301"
          source="SAM.gov on 2026-04-15"
        />,
        <FieldRow
          key="sos-status"
          tier="T2"
          label="Secretary of State Status"
          state="stale"
          value="Active"
          staleAgeInDays={16}
          staleConsequence="verifying status takes a moment"
        />,
        <FieldRow
          key="business-phone"
          tier="T2"
          label="Business Phone"
          state="missing"
          helperMicrocopy="The phone number on your federal proposals. Required for POC fields."
          whyItMatters="Federal proposals always need a phone POC. Included in our GovCompliant Digital Setup service."
          dfy={{ service: "GovCompliant Digital Setup", price: 2997, leadField: false }}
        />,
      ]}
      t3Fields={[
        <FieldRow
          key="formation-date"
          tier="T3"
          label="Formation Date"
          state="verified"
          value="June 14, 2024"
        />,
        <FieldRow
          key="mailing-address"
          tier="T3"
          label="Mailing Address"
          state="conflict"
          conflictValues={[
            { source: "SAM.gov", value: "201 Hay St, Fayetteville, NC 28301" },
            { source: "You typed this on 2026-04-20", value: "PO Box 5512, Fayetteville, NC 28302" },
          ]}
        />,
        <FieldRow
          key="linkedin"
          tier="T3"
          label="LinkedIn Profile"
          state="missing"
          helperMicrocopy="Optional. A LinkedIn page adds credibility on proposals."
        />,
        <FieldRow
          key="years-in-business"
          tier="T3"
          label="Years in Business"
          state="inferred"
          value="~2 years"
          source="computed from your formation date"
        />,
      ]}
      footerProgressText="4 of 5 essentials complete"
      footerUnlocksText="This section unlocks: most federal opportunities (once SAM is active and EIN is on file)"
    />
  );
}
