import { createFileRoute, useSearch } from "@tanstack/react-router";
import * as Switch from "@radix-ui/react-switch";
import { usePageMeta } from "../components/Layout/page-meta";
import { ReadinessHeader } from "../components/profile/ReadinessHeader";
import { TabNavigation, TAB_SLUGS, type TabSlug } from "../components/profile/TabNavigation";
import { SectionSelect } from "../components/profile/SectionSelect";
import { IdentityTab } from "../components/profile/tabs/IdentityTab";
import { CapabilitiesTab } from "../components/profile/tabs/CapabilitiesTab";
import { CertificationsTab } from "../components/profile/tabs/CertificationsTab";
import { DigitalTab } from "../components/profile/tabs/DigitalTab";
import { SledTab } from "../components/profile/tabs/SledTab";
import { PositioningTab } from "../components/profile/tabs/PositioningTab";
import { BidderProfileTab } from "../components/profile/tabs/BidderProfileTab";
import { PastPerformanceTab } from "../components/profile/tabs/PastPerformanceTab";
import { MentorHistoryTab } from "../components/profile/tabs/MentorHistoryTab";
import { KnowledgeTab } from "../components/profile/tabs/KnowledgeTab";
import { StayReadyOverview } from "../components/StayReady/StayReadyOverview";


import {
  BusinessProfileModeContext,
  EditModeContext,
  type ProfileMode,
} from "../components/profile/BusinessProfileMode";
// DEMO: the Edit mode switch is saved in the demo store.
import { useEditModeState } from "../demo/profile/store";

interface BusinessProfileSearch {
  tab: TabSlug;
  onboarding?: boolean;
}

export const Route = createFileRoute("/business-profile")({
  head: () => ({
    meta: [
      { title: "Business Profile — GovPreneurs" },
      {
        name: "description",
        content:
          "What Hunter knows about your business and what would help us serve you better.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): BusinessProfileSearch => {
    const onboarding =
      search.onboarding === true ||
      search.onboarding === "true" ||
      search.onboarding === 1;
    const fallback: TabSlug = onboarding ? "positioning" : "positioning";
    const raw = typeof search.tab === "string" ? search.tab : fallback;
    const tab = (TAB_SLUGS as readonly string[]).includes(raw)
      ? (raw as TabSlug)
      : fallback;
    return { tab, onboarding: onboarding || undefined };
  },
  component: BusinessProfilePage,
});

function BusinessProfilePage() {
  usePageMeta({ layout: "wide" });
  const [editMode, setEditMode] = useEditModeState();
  const { tab, onboarding } = useSearch({ from: "/business-profile" });
  const mode: ProfileMode = onboarding ? "onboarding" : "default";

  return (
    <BusinessProfileModeContext.Provider value={mode}>
      <EditModeContext.Provider value={editMode}>
      <div className="bp-shell">
        <div className="bp-shell-inner">
          <header className="bp-header">
            <h1 className="bp-title">Business Profile</h1>
            <label className="bp-edit-mode">
              <span className="bp-edit-mode-label">Edit mode</span>
              <Switch.Root
                checked={editMode}
                onCheckedChange={setEditMode}
                className="bp-edit-switch"
                aria-label="Edit mode"
              >
                <Switch.Thumb className="bp-edit-switch-thumb" />
              </Switch.Root>
            </label>
          </header>

          <ReadinessHeader />

          {!editMode && (
            <p className="bp-view-note" role="status">
              Edit mode is off. You are looking at a read-only view. Turn it on to change anything.
            </p>
          )}

          <div className="bp-two-pane">
            <TabNavigation />
            <div className="bp-section-select-row">
              <SectionSelect />
            </div>
            <div className="bp-section-content" role="tabpanel">
              {renderTab(tab)}
            </div>
          </div>
        </div>
      </div>
      </EditModeContext.Provider>
    </BusinessProfileModeContext.Provider>
  );
}

function renderTab(tab: TabSlug) {
  switch (tab) {
    case "identity":
      return <IdentityTab />;
    case "capabilities":
      return <CapabilitiesTab />;
    case "certifications":
      return <CertificationsTab />;
    case "positioning":
      return <PositioningTab />;
    case "digital":
      return <DigitalTab />;
    case "sled":
      return <SledTab />;
    case "bidder-profile":
      return <BidderProfileTab />;
    case "past-performance":
      return <PastPerformanceTab />;
    case "mentor-history":
      return <MentorHistoryTab />;
    case "knowledge":
      return <KnowledgeTab />;
    case "stay-ready":
      return <StayReadyOverview />;
  }
}
