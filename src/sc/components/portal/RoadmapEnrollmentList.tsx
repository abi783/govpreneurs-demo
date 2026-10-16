type ServiceStatus =
  | "Verified"        // green — verification passed
  | "Completed"       // green — checklist done, waiting on verification
  | "Started"         // indigo — the delivery pipeline says work has begun
  | "In Progress"     // blue — team working the checklist
  | "Intake Needed"   // orange (highlighted) — customer must submit the intake form
  | "Waiting for SAM" // amber — bought, but blocked on their SAM registration
  | "Enrolled"        // legacy — pool-only services (no TaskSection)
  | "Not Enrolled";   // red — service not yet purchased

export interface EnrolledService {
  title: string;
  status: ServiceStatus;
  /** Set when status is "Intake Needed" — the row becomes clickable and
   *  opens this URL in a new tab. */
  intakeFormLink?: string | null;
}

interface BadgeStyle {
  bg: string;
  color: string;
  border: string;
}

const STATUS_BADGE: Record<ServiceStatus, BadgeStyle> = {
  Verified:       { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Completed:      { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Started:        { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
  "In Progress":  { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Intake Needed":{ bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" },
  "Waiting for SAM": { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  Enrolled:       { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  "Not Enrolled": { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
};

// Left-side circle icon, matched to the pill palette: red X for Not
// Enrolled, orange check for Intake Needed (action required — stands
// out), blue check for In Progress, green check for Completed /
// Verified / Enrolled.
const ICON_BG: Record<ServiceStatus, string> = {
  Verified: "#15803d",
  Completed: "#15803d",
  Started: "#6d28d9",
  "In Progress": "#1d4ed8",
  "Intake Needed": "#ea580c",
  "Waiting for SAM": "#d97706",
  Enrolled: "#15803d",
  "Not Enrolled": "#b91c1c",
};

function StatusIcon({ status }: { status: ServiceStatus }) {
  const notEnrolled = status === "Not Enrolled";
  const bg = ICON_BG[status];
  return (
    <div
      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: bg }}
    >
      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
        {notEnrolled ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        )}
      </svg>
    </div>
  );
}

interface RowInnerProps {
  svc: EnrolledService;
}

// Display labels — "In Progress" reads as "Enrolled" on the list (the
// internal status keys stay unchanged so the home page's ranking/dedupe
// logic is untouched; the blue palette still distinguishes it from the
// legacy green "Enrolled").
const STATUS_LABEL: Partial<Record<ServiceStatus, string>> = {
  "In Progress": "Enrolled",
  // "Started" is the delivery pipeline saying our team has picked the work
  // up — the member reads that as In Progress.
  Started: "In Progress",
};

function RowInner({ svc }: RowInnerProps) {
  const badge = STATUS_BADGE[svc.status];
  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <StatusIcon status={svc.status} />
        <span className="text-[0.74rem] text-[var(--text-secondary)] truncate">{svc.title}</span>
      </div>
      <span
        className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap"
        style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
      >
        {STATUS_LABEL[svc.status] ?? svc.status}
      </span>
    </>
  );
}

export function RoadmapEnrollmentList({ services }: { services: EnrolledService[] }) {
  if (services.length === 0) {
    return (
      <p className="text-[0.72rem] text-[var(--text-muted)]">No services configured yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {services.map((svc, idx) => {
        // Intake Needed rows get a translucent orange highlight — the
        // customer has an action to take, so the row must stand out from
        // the rest of the list (works on light + dark sidebars).
        const intakeHighlight = svc.status === "Intake Needed"
          ? { background: "rgba(234,88,12,0.10)", border: "1px solid rgba(234,88,12,0.35)" }
          : undefined;
        // Intake Needed + link present → whole row is a clickable anchor
        // that opens the intake form in a new tab. Hover tint marks it as
        // interactive without changing the row's rhythm.
        if (svc.status === "Intake Needed" && svc.intakeFormLink) {
          return (
            <a
              key={idx}
              href={svc.intakeFormLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 py-1 -mx-1 px-1.5 rounded-md hover:brightness-110 transition-all cursor-pointer"
              style={intakeHighlight}
            >
              <RowInner svc={svc} />
            </a>
          );
        }
        return (
          <div
            key={idx}
            className={`flex items-center justify-between gap-2 py-1 ${intakeHighlight ? "-mx-1 px-1.5 rounded-md" : ""}`}
            style={intakeHighlight}
          >
            <RowInner svc={svc} />
          </div>
        );
      })}
    </div>
  );
}
