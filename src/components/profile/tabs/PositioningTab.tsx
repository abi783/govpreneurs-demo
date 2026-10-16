import { Compass } from "lucide-react";
import { ProfileTabSection } from "../ProfileTabSection";
import { useProfileMode } from "../BusinessProfileMode";
import { ColdStartWelcomeBanner } from "../ColdStartWelcomeBanner";

// DEMO: the fields come from the story (src/demo/profile/fields.tsx). The welcome
// banner shows with ?onboarding=true; the answers Amira already gave stay.
export function PositioningTab() {
  const cold = useProfileMode() === "onboarding";

  return (
    <>
      {cold && <ColdStartWelcomeBanner />}

      <div className="bp-leverage-banner" role="note">
        <Compass size={20} className="bp-leverage-icon" aria-hidden />
        <span className="bp-leverage-text">
          This is the highest-impact section for Hunter's match quality. Each field here
          measurably improves what shows up in your feed.
        </span>
      </div>
      <ProfileTabSection
        tab="positioning"
        unlocks="This section unlocks: highly relevant Hunter matches and Ava's win themes"
      />
    </>
  );
}
