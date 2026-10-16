// DEMO: the types that lifted Success Center components read from server files.
//
// The Success Center keeps these types in files that also hold server code
// (Prisma, GoHighLevel calls). Those files do not come across. The lifted
// components import these copies instead. Each shape is the same as in
// sc-main; only the file moved.

import type { ChargeBreakdown } from "@sc/lib/billing/chargeDetail";
import type { UsageReceipt } from "@sc/lib/billing/walletReceipt";

/** sc-main `src/lib/ghl/appointments.ts`: one appointment of the member's contact. */
export interface GHLAppointment {
  id: string;
  title?: string;
  startTime: string;
  endTime: string;
  calendarId?: string;
  locationId?: string;
  contactId?: string;
  appointmentStatus?: string;
  assignedUserId?: string;
  /** A meeting address or meeting URL. */
  address?: string;
  /** "custom" | "zoom" | "google" | "outlook" | "phone". */
  meetingLocationType?: string;
  source?: string;
  calendarName?: string;
  assignedUserName?: string;
  /** Wallet credit paid for a booking made in the portal. */
  amount?: number;
  currency?: string;
}

/** sc-main `src/lib/progress.ts`: one sub-step row of the Overall Progress card. */
export interface SubStepProgress {
  id: string;
  title: string;
  sortOrder: number;
  completedCount: number;
  totalCount: number;
  percentage: number;
  excluded: boolean;
}

/** sc-main `src/lib/progress.ts`: one main-step row of the Overall Progress card. */
export interface MainStepProgress {
  id: string;
  title: string;
  sortOrder: number;
  completedCount: number;
  totalCount: number;
  percentage: number;
  excluded: boolean;
  subSteps: SubStepProgress[];
}

/** sc-main `src/lib/billing/walletUsage.ts`: one wallet charge in the Usage History drawer. */
export interface WalletUsageItem {
  id: string;
  kind: "service" | "booking";
  title: string;
  amount: number;
  currency: string;
  at: string;
  pending: boolean;
  note?: string;
  outstanding?: number;
  receipt?: UsageReceipt;
  breakdown?: ChargeBreakdown;
}
