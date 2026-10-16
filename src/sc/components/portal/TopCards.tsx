import { AssignedMentorCard } from "./AssignedMentorCard";
import { NextAppointmentCard } from "./NextAppointmentCard";
import { ProgramSpecialistCard } from "./ProgramSpecialistCard";
import { WalletCard } from "./WalletCard";
import type { WalletUsageItem } from "./WalletUsageDrawer";
import type { WalletAmounts } from "@sc/lib/billing/walletDisplay";
// DEMO: the type only. lib/ghl/appointments.ts holds server code, so it does not come across.
import type { GHLAppointment } from "@/demo/sc/home/types";

interface AssignedMentor {
  id: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  consultationPrice: string | null;
  formEnabled?: boolean;
  formDescription?: string | null;
  comingSoon?: boolean;
}

interface ProgramSpecialist {
  name: string | null;
  title: string | null;
  avatarUrl: string | null;
  bio: string | null;
  calendarId: string | null;
}

interface Props {
  walletBalance: number | null;
  /** The paid balance and the promotional credit, shown apart on the wallet card. */
  walletAmounts: WalletAmounts | null;
  walletCurrency?: string;
  locationId: string;
  programSpecialist: ProgramSpecialist;
  assignedMentor: AssignedMentor | null;
  freeRemaining: number;
  hasContact: boolean;
  /** Summit attendee, not yet a member: the Your Mentor card is locked. */
  summitLocked?: boolean;
  featuredAppointment: GHLAppointment | null;
  /** Main contact's IANA timezone — appointment card + drawer render in
   *  this zone when set. */
  contactTimezone?: string | null;
  /** Full contact appointment list — feeds the Booking History drawer
   *  on the Next Appointment card. Same array we derive
   *  featuredAppointment from in page.tsx. */
  appointments: GHLAppointment[];
  /** Center-level override that suppresses the wallet-credit-conversion
   *  note even when freeRemaining > 0. Used for new members whose free
   *  sessions came from the plan default, not from the legacy credit
   *  conversion event. */
  hideWalletConversionNote?: boolean;
  /** Wallet spend ledger (DFY enrollments + paid bookings) for the Usage
   *  History drawer on the wallet card. */
  walletUsage: WalletUsageItem[];
  walletTotalSpent: number;
  /** Outstanding wallet debt (dollars) shown as negative on the wallet card. */
  walletOwed: number;
}

export function TopCards({
  walletBalance,
  walletAmounts,
  walletCurrency = "USD",
  locationId,
  programSpecialist,
  assignedMentor,
  freeRemaining,
  hasContact,
  summitLocked = false,
  featuredAppointment,
  contactTimezone = null,
  appointments,
  hideWalletConversionNote = false,
  walletUsage,
  walletTotalSpent,
  walletOwed,
}: Props) {
  const rechargeUrl = `https://app.govpreneurs.com/v2/location/${locationId}/settings/company-billing/billing?tab=wallet_transactions`;

  return (
    // 4 cards across on desktop. On smaller breakpoints they reflow to
    // 2-up then single column. The row now spans the full page width
    // above the roadmap + sidebar grid, so we can drop to lg:grid-cols-4
    // instead of waiting for xl. Order matches the spec:
    //   Program Specialist · Assigned Mentor · Next Appointment · Wallet
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {/* Card 1 — Program Specialist (configured in /admin/settings) */}
      <ProgramSpecialistCard
        name={programSpecialist.name}
        title={programSpecialist.title}
        avatarUrl={programSpecialist.avatarUrl}
        bio={programSpecialist.bio}
        calendarId={programSpecialist.calendarId}
        locationId={locationId}
      />

      {/* Card 2 — Assigned Mentor */}
      <AssignedMentorCard
        locationId={locationId}
        mentor={assignedMentor}
        freeRemaining={freeRemaining}
        walletBalance={walletBalance}
        walletCurrency={walletCurrency}
        hasContact={hasContact}
        summitLocked={summitLocked}
      />

      {/* Card 3 — Next/Last appointment */}
      <NextAppointmentCard locationId={locationId} appointment={featuredAppointment} appointments={appointments} contactTimezone={contactTimezone} />

      {/* Card 4 — Wallet */}
      <WalletCard
        locationId={locationId}
        walletBalance={walletBalance}
        walletAmounts={walletAmounts}
        walletCurrency={walletCurrency}
        freeRemaining={freeRemaining}
        hideWalletConversionNote={hideWalletConversionNote}
        rechargeUrl={rechargeUrl}
        usage={walletUsage}
        totalSpent={walletTotalSpent}
        walletOwed={walletOwed}
      />
    </div>
  );
}
