interface PortalHeaderProps {
  accountName: string;
  saasPlanName?: string | null;
  saasPlanId?: string | null;
  subscriptionStatus?: string | null;
  cohort?: string | null;
  /** Member Unique ID (e.g. "C19E") — when set it replaces the Cohort line. */
  memberUid?: string | null;
  renewed?: boolean;
  daysLeft?: number | null;
}

const STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-400/[0.08] border-emerald-400/[0.25]",
  trialing: "text-sky-400 bg-sky-400/[0.08] border-sky-400/[0.25]",
  past_due: "text-amber-400 bg-amber-400/[0.08] border-amber-400/[0.25]",
};

export function PortalHeader({ accountName, saasPlanName, saasPlanId, subscriptionStatus, cohort, memberUid, renewed, daysLeft }: PortalHeaderProps) {
  const planLabel = saasPlanName ?? saasPlanId;
  const statusStyle = subscriptionStatus
    ? (STATUS_STYLES[subscriptionStatus] ?? "text-[var(--text-muted)] bg-white/[0.04] border-white/[0.08]")
    : null;
  // Expiry warning replaces the status pill inside the final 30 days.
  // Renewals extend the term, so daysLeft already reflects the new end —
  // a renewed member sees this again only when their NEXT renewal nears.
  const expiresSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 30;

  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold tracking-[0.16em] uppercase text-[var(--green-text)] mb-2.5">
        <span className="block w-4 h-px bg-[var(--green-text)] opacity-50" />
        Your Success Center
        <span className="block w-4 h-px bg-[var(--green-text)] opacity-50" />
      </div>
      <h1 className="text-[1.65rem] font-extrabold tracking-tight text-white mb-1.5">
        Welcome To Your Success Center
      </h1>
      <p className="text-[0.83rem] text-[var(--text-secondary)] max-w-[600px] leading-relaxed">
        Welcome GovPreneurs! Here you&apos;ll find your membership details, available resources, and expert support to help you succeed in your GovPreneurial journey.
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.72rem] text-[var(--text-muted)]">
        {memberUid ? (
          <span>
            Unique ID:{" "}
            <span className="text-[var(--text-secondary)] font-semibold">{memberUid}</span>
          </span>
        ) : cohort ? (
          <span>
            Cohort:{" "}
            <span className="text-[var(--text-secondary)] font-semibold">{cohort}</span>
          </span>
        ) : (
          <span>
            Account:{" "}
            <span className="text-[var(--text-secondary)] font-semibold">{accountName}</span>
          </span>
        )}
        {planLabel && (
          <>
            <span className="text-[var(--text-dim)]">·</span>
            <span>
              Plan:{" "}
              <span className="text-[var(--text-secondary)] font-semibold">{planLabel}</span>
            </span>
          </>
        )}
        {expiresSoon ? (
          <span className="text-[0.65rem] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full border text-amber-400 bg-amber-400/[0.08] border-amber-400/[0.25]">
            {daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
          </span>
        ) : (
          statusStyle && subscriptionStatus && (
            <span className={`text-[0.65rem] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full border ${statusStyle}`}>
              {subscriptionStatus}
            </span>
          )
        )}
        {renewed && (
          <span className="text-[0.65rem] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-400/[0.08] border-emerald-400/[0.25]">
            Renewed
          </span>
        )}
      </div>
    </div>
  );
}
