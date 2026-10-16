import { Section } from "../Section";
import { FieldRow } from "../FieldRow";

export function CertificationsTab() {
  return (
    <Section
      t1Fields={[
        <FieldRow
          key="sba-set-aside"
          tier="T1"
          label="SBA Set-Aside Eligibility (from SAM)"
          state="verified"
          value="Small Business · SDVOSB eligible"
          source="SAM.gov on 2026-04-15"
          whyItMatters="These flags determine which set-aside contracts you can bid on. They come from your SAM.gov registration."
        />,
        <FieldRow
          key="small-business"
          tier="T1"
          label="Small Business Status (per NAICS 238160)"
          state="verified"
          value="Small (per NAICS 238160 size standard)"
          source="SAM.gov on 2026-04-15"
        />,
      ]}
      t2Fields={[
        <FieldRow
          key="dsbs"
          tier="T2"
          label="DSBS Profile"
          state="missing"
          helperMicrocopy="Your visibility on the Dynamic Small Business Search — where federal buyers find small business contractors."
          whyItMatters="Without a DSBS profile, federal buyers searching for small businesses in your NAICS can't find you proactively."
          dfy={{ service: "SBS Visibility Setup", price: 997 }}
        />,
      ]}
      t3Fields={[
        <FieldRow key="8a" tier="T3" label="8(a) Certification Document" state="missing" />,
        <FieldRow key="hubzone" tier="T3" label="HUBZone Certification" state="missing" />,
        <FieldRow
          key="sdvosb-doc"
          tier="T3"
          label="SDVOSB Certification Document (DD-214)"
          state="missing"
        />,
        <FieldRow
          key="wosb"
          tier="T3"
          label="WOSB/EDWOSB Certification"
          state="missing"
        />,
        <FieldRow key="cmmc" tier="T3" label="CMMC Level" state="missing" />,
        <FieldRow key="iso" tier="T3" label="ISO Certifications" state="missing" />,
        <FieldRow key="soc2" tier="T3" label="SOC 2 Report" state="missing" />,
        <FieldRow
          key="state-diversity"
          tier="T3"
          label="State Diversity Certifications (DBE/MBE/WBE/MWBE)"
          state="missing"
        />,
      ]}
      footerProgressText="2 of 3 essentials complete"
      footerUnlocksText="This section unlocks: set-aside opportunities you qualify for and DSBS-driven inbound interest"
    />
  );
}
