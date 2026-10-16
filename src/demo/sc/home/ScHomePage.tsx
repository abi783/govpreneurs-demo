// DEMO: the Success Center home page.
//
// This is the production server page (sc-main `src/app/[locationId]/page.tsx`)
// turned into one client component. The page layout, the order of the blocks and
// every card are production code. The page here only does what the server did:
// it gets the data (`useHomeData`) and gives it to the cards.
//
// Left out on purpose, because the sample member never sees them: the theme
// toggle, the "Reset Onboarding" button, the onboarding lock, the renewal bar
// and gate, the kickoff lock, and the PostHog tracking script.
//
// Added: the "Recent Activity" card at the top of the main column, and a few
// layout rules in home.css so the page fits the narrower area next to the demo
// menu (the real page sits in a frame that is as wide as the browser).

import { useSearchParams } from "next/navigation";
import { CompanyInfoCard } from "@sc/components/portal/CompanyInfoCard";
import { MainContactCard } from "@sc/components/portal/MainContactCard";
import { OnboardingStatusBar } from "@sc/components/portal/OnboardingStatusBar";
import { PortalHeader } from "@sc/components/portal/PortalHeader";
import { PortalMainTabs } from "@sc/components/portal/PortalMainTabs";
import { PortalSidebar } from "@sc/components/portal/PortalSidebar";
import { StrategyCallStatusBar } from "@sc/components/portal/StrategyCallStatusBar";
import { TopCards } from "@sc/components/portal/TopCards";
import { AddFundsHost } from "./addFunds";
import { RecentActivityCard } from "./RecentActivityCard";
import { useHomeData } from "./useHomeData";
import "./home.css";

function MetaCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[0.72rem] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)] whitespace-nowrap">{label}</span>
      <span className="text-[0.85rem] text-white truncate">{value && value.trim() ? value : "N/A"}</span>
    </div>
  );
}

export function ScHomePage() {
  const d = useHomeData();
  const searchParams = useSearchParams();
  const openPlanId = searchParams.get("plan");

  return (
    <>
      <div className="sc-home w-full px-6 lg:px-10 pt-9 pb-20">
        {/* Top row: header + contact card */}
        <div className="sc-home__top flex items-start justify-between gap-6 mb-6">
          <div className="flex-1 min-w-0">
            <PortalHeader
              accountName={d.businessName}
              saasPlanName={d.planName}
              saasPlanId={null}
              subscriptionStatus="active"
              cohort={null}
              memberUid={null}
              renewed={false}
              daysLeft={null}
            />
          </div>
          <div className="sc-home__contact flex-shrink-0 flex flex-col gap-4 w-[640px]">
            {/* The photo and logo buttons open a file picker, which the crawl cannot see. The flow is tested in qa/. */}
            <div className="grid grid-cols-2 gap-8 items-start" data-qa-skip>
              <MainContactCard
                locationId={d.locationId}
                firstName={d.contact.firstName}
                lastName={d.contact.lastName}
                email={d.contact.email}
                phone={d.contact.phone}
                photoUrl={d.contact.photoUrl}
              />
              <CompanyInfoCard
                locationId={d.locationId}
                accountName={d.company.accountName}
                address={d.company.address}
                website={d.company.website}
                logoUrl={d.company.logoUrl}
              />
            </div>
            <div className="border-t border-white/[0.08]" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              <MetaCell label="Entity Renewal" value={d.meta.entityRenewal} />
              <MetaCell label="UEI" value={d.meta.uei} />
              <MetaCell label="CAGE" value={d.meta.cage} />
              <MetaCell label="Primary NAICS" value={d.meta.primaryNaics} />
            </div>
          </div>
        </div>

        {/* Top cards: full-width row above the roadmap + sidebar grid */}
        <TopCards
          walletBalance={d.walletBalance}
          walletAmounts={d.walletAmounts}
          walletCurrency="USD"
          walletUsage={d.walletUsage}
          walletTotalSpent={d.walletTotalSpent}
          walletOwed={0}
          locationId={d.locationId}
          programSpecialist={d.programSpecialist}
          assignedMentor={d.assignedMentor}
          freeRemaining={d.freeRemaining}
          hasContact
          summitLocked={false}
          featuredAppointment={d.featuredAppointment}
          contactTimezone={d.contactTimezone}
          appointments={d.appointments}
          hideWalletConversionNote
        />

        {/* Road map + sidebar */}
        <div className="sc-home__grid mb-10">
          <div className="sc-home__main min-w-0">
            <RecentActivityCard firstName={d.ownerFirstName} items={d.activity} />
            <OnboardingStatusBar
              locationId={d.locationId}
              signed
              signedDocUrl={null}
              appointment={null}
              documentUrl=""
              bookingEnabled
            />
            <StrategyCallStatusBar locationId={d.locationId} appointment={null} completed />
            <PortalMainTabs
              sections={[]}
              overallPercentage={0}
              roadmapMainSteps={d.mainSteps}
              roadmapOverallPercentage={d.progressPercent}
              locationId={d.locationId}
              roadmapLocked={false}
              activePlaybooks={d.playbooks}
              openPlanId={openPlanId}
            />
          </div>
          <div className="sc-home__side min-w-0">
            <PortalSidebar
              enrolledServices={d.enrolledServices}
              deliveredServices={d.deliveredServices}
              globalSettings={d.sidebarSettings as unknown as Parameters<typeof PortalSidebar>[0]["globalSettings"]}
              currentOffer={d.currentOffer}
            />
          </div>
        </div>
      </div>
      <AddFundsHost />
    </>
  );
}
