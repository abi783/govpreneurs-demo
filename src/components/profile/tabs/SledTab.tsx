import { Section } from "../Section";
import { FieldRow } from "../FieldRow";
import { SledRegistrationsTable } from "../SledRegistrationsTable";

export function SledTab() {
  return (
    <Section
      t1Fields={[<SledRegistrationsTable key="sled-table" />]}
      t2Fields={[
        <FieldRow
          key="sled-target-states"
          tier="T2"
          label="SLED Target States"
          state="attested"
          value="North Carolina, Virginia, South Carolina, Georgia"
          source="You told Hunter on 2026-04-18"
          chatEditable
        />,
      ]}
      t3Fields={[
        <FieldRow key="state-tax-ids" tier="T3" label="State Tax IDs" state="missing" />,
        <FieldRow
          key="insurance-state"
          tier="T3"
          label="Insurance Certificates per State"
          state="missing"
        />,
      ]}
      footerProgressText="0 of 4 states registered (1 in progress)"
      footerUnlocksText="SLED registrations unlock state and local opportunities in each registered state"
    />
  );
}
