import { ProfileTabSection } from "../ProfileTabSection";

// DEMO: the fields come from the story (src/demo/profile/fields.tsx).
export function IdentityTab() {
  return (
    <ProfileTabSection
      tab="identity"
      unlocks="This section unlocks: most federal opportunities (once SAM is active and EIN is on file)"
    />
  );
}
