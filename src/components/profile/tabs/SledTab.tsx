import { ProfileTabSection } from "../ProfileTabSection";
import { SledRegistrationsTable } from "../SledRegistrationsTable";
import { useSledRegistrations } from "../../../demo/profile/sled";

// DEMO: the registrations table and the target states come from the demo store.
export function SledTab() {
  const rows = useSledRegistrations();
  const registered = rows.filter((r) => r.status === "registered").length;
  const pending = rows.filter((r) => r.status === "pending_dfy").length;
  return (
    <ProfileTabSection
      tab="sled"
      unlocks="SLED registrations unlock state and local opportunities in each registered state"
      extra={{ T1: [<SledRegistrationsTable key="sled-table" />] }}
      progress={`${registered} of ${rows.length} states registered${pending ? ` (${pending} in progress)` : ""}`}
    />
  );
}
