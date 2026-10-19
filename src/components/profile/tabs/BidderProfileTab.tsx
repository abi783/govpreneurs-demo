import { ProfileTabSection } from "../ProfileTabSection";

// DEMO: the fields come from the story (src/demo/profile/fields.tsx).
export function BidderProfileTab() {
  return (
    <ProfileTabSection
      tab="bidder-profile"
      unlocks="This section unlocks: Grant's risk-aware bid memos"
    />
  );
}
