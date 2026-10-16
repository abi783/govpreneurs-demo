import { Compass } from "lucide-react";
import { Section } from "../Section";
import { FieldRow } from "../FieldRow";
import { useProfileMode } from "../BusinessProfileMode";
import { ColdStartWelcomeBanner } from "../ColdStartWelcomeBanner";

export function PositioningTab() {
  const mode = useProfileMode();
  const cold = mode === "onboarding";

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
      <Section
        t1Fields={[
          cold ? (
            <FieldRow
              key="target-value"
              tier="T1"
              label="Target Contract Value Range"
              state="missing"
              helperMicrocopy="Tells Hunter your size so we stop showing wrong-sized opps."
              whyItMatters="Hunter filters by what you can comfortably win. Without this, you'd see contracts way too big or way too small for your team."
              chatEditable
            />
          ) : (
            <FieldRow
              key="target-value"
              tier="T1"
              label="Target Contract Value Range"
              state="attested"
              value="$250K – $1M"
              source="You told Hunter on 2026-04-18"
              whyItMatters="Hunter filters by what you can comfortably win. Without this, you'd see contracts way too big or way too small for your team."
              chatEditable
            />
          ),
          cold ? (
            <FieldRow
              key="geo-pref"
              tier="T1"
              label="Geographic Preference"
              state="missing"
              helperMicrocopy="Where you'll work — radius, states, or national. Hunter won't surface opportunities outside your reach."
              whyItMatters="Place of performance is often the deciding factor — Hunter prioritises opportunities in your reach."
              chatEditable
            />
          ) : (
            <FieldRow
              key="geo-pref"
              tier="T1"
              label="Geographic Preference"
              state="attested"
              value="Within 300mi of Fayetteville, NC (covers NC, VA, SC, GA). Willing to travel for contracts over $500K."
              source="You told Hunter on 2026-04-18"
              whyItMatters="Place of performance is often the deciding factor — Hunter prioritises opportunities in your reach."
              chatEditable
            />
          ),
          cold ? (
            <FieldRow
              key="set-aside"
              tier="T1"
              label="Set-Aside Appetite"
              state="missing"
              helperMicrocopy="Set-aside only, full-and-open only, or both. Shapes which opportunities Hunter focuses on."
              whyItMatters="Set-aside opportunities have less competition. Full-and-open are bigger but compete with everyone — this tells Hunter where to focus."
              chatEditable
            />
          ) : (
            <FieldRow
              key="set-aside"
              tier="T1"
              label="Set-Aside Appetite"
              state="attested"
              value="Both, leaning set-aside (you're SDVOSB eligible)"
              source="You told Hunter on 2026-04-18"
              whyItMatters="Set-aside opportunities have less competition. Full-and-open are bigger but compete with everyone — this tells Hunter where to focus."
              chatEditable
            />
          ),
        ]}
        t2Fields={[
          cold ? (
            <FieldRow
              key="target-agencies"
              tier="T2"
              label="Target Agencies"
              state="missing"
              helperMicrocopy="Agencies you most want to work with. Hunter will prioritise their solicitations."
              whyItMatters="Hunter prioritises solicitations from agencies you're hunting, including pre-solicitations."
              chatEditable
            />
          ) : (
            <FieldRow
              key="target-agencies"
              tier="T2"
              label="Target Agencies"
              state="attested"
              value="U.S. Army Corps of Engineers (USACE)"
              source="You told Hunter on 2026-05-02"
              whyItMatters="Hunter prioritises solicitations from agencies you're hunting, including pre-solicitations."
              chatEditable
            />
          ),
          cold ? (
            <FieldRow
              key="notif-cadence"
              tier="T2"
              label="Notification Cadence"
              state="missing"
              helperMicrocopy="How often you want a digest of new matches."
              chatEditable
            />
          ) : (
            <FieldRow
              key="notif-cadence"
              tier="T2"
              label="Notification Cadence"
              state="attested"
              value="Weekly digest"
              source="You told Hunter on 2026-04-18"
              chatEditable
            />
          ),
          <FieldRow
            key="win-themes"
            tier="T2"
            label="Win Themes"
            state="missing"
            helperMicrocopy="In your own words: why should a contracting officer pick you over a competitor? Ava uses these in proposals."
            whyItMatters="Without win themes, Ava's drafts are generic. Your honest answer — even rough — gives her something authentic to work from."
            chatEditable
          />,
        ]}
        t3Fields={[
          <FieldRow
            key="naics-priorities"
            tier="T3"
            label="NAICS Targeting Priorities"
            state="missing"
          />,
          <FieldRow
            key="avoid-agencies"
            tier="T3"
            label="Agencies to Avoid"
            state="missing"
          />,
          <FieldRow
            key="key-personnel"
            tier="T3"
            label="Key Personnel Highlight"
            state="missing"
          />,
        ]}
        footerProgressText={cold ? "0 of 6 essentials complete" : "5 of 6 essentials complete"}
        footerUnlocksText="This section unlocks: highly relevant Hunter matches and Ava's win themes"
      />
    </>
  );
}
