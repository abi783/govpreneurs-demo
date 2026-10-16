import { Section } from "../Section";
import { FieldRow } from "../FieldRow";

export function DigitalTab() {
  return (
    <Section
      t1Fields={[]}
      t2Fields={[
        <FieldRow
          key="website"
          tier="T2"
          label="Website"
          state="error"
          value="williamsconstructionnc.com"
          errorMessage="We couldn't verify williamsconstructionnc.com — no MX records found. Your domain may not have email set up yet, or DNS may be slow."
          whyItMatters="Federal buyers check your website during evaluations. A broken or missing site hurts your credibility."
          dfy={{ service: "GovCompliant Digital Setup", price: 2997 }}
        />,
        <FieldRow
          key="custom-email"
          tier="T2"
          label="Custom Email Domain"
          state="error"
          value="marcus@williamsconstructionnc.com"
          errorMessage="We couldn't verify williamsconstructionnc.com — same domain issue as your website."
          dfy={{ service: "GovCompliant Digital Setup", price: 2997, leadField: false }}
        />,
      ]}
      t3Fields={[
        <FieldRow
          key="a2p"
          tier="T3"
          label="A2P Brand ID"
          state="missing"
          helperMicrocopy="Required if you send SMS workflows through GHL or other A2P systems."
        />,
        <FieldRow
          key="ghl"
          tier="T3"
          label="GHL Signals"
          state="missing"
          helperMicrocopy="Synced from your GHL account when connected."
        />,
      ]}
      footerProgressText="0 of 2 essentials complete"
      footerUnlocksText="This section unlocks: stronger proposal credibility and SMS workflow capability"
    />
  );
}
