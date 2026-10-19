import { RoadmapEnrollmentList } from "./RoadmapEnrollmentList";
import type { EnrolledService } from "./RoadmapEnrollmentList";

interface SidebarGlobalSettings {
  filesLink: string | null;
  filesTitle: string | null;
  filesDescription: string | null;
  filesButtonLabel: string | null;
  servicesLink: string | null;
  feedbackLink: string | null;
  feedbackTitle: string | null;
  feedbackDescription: string | null;
  feedbackButtonLabel: string | null;
  affiliateLink: string | null;
  affiliateTitle: string | null;
  affiliateDescription: string | null;
  affiliateButtonLabel: string | null;
  socialFacebook: string | null;
  socialTwitter: string | null;
  socialYoutube: string | null;
  socialLinkedin: string | null;
  socialInstagram: string | null;
}

interface DeliveredService {
  id: string;
  title: string;
  link: string;
  /** "view" (default) renders a neutral "View" button — used for admin-
   *  curated rows pointing to already-signed contracts / completed
   *  deliverables. "sign" renders a "Sign" CTA in the gold accent so the
   *  customer's outstanding signature is obvious at a glance — used for
   *  auto-surfaced pending deliveries derived from ServiceEnrollment. */
  kind?: "view" | "sign";
}

interface Props {
  enrolledServices: EnrolledService[];
  deliveredServices: DeliveredService[];
  globalSettings: SidebarGlobalSettings;
  /** "Your Current Offer" checklist (C24 + demo preview accounts only) —
   *  every DFY service the member is enrolled in, ticked when delivered.
   *  Null = card hidden (all other members). */
  currentOffer?: { title: string; done: boolean }[] | null;
}

const socialLinks = [
  { key: "socialFacebook" as const, label: "Facebook", icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
  { key: "socialInstagram" as const, label: "Instagram", icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z", viewBox: "0 0 24 24" },
  { key: "socialTwitter" as const, label: "X/Twitter", icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
  { key: "socialLinkedin" as const, label: "LinkedIn", icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
  { key: "socialYoutube" as const, label: "YouTube", icon: "M22.54 6.42a2.78 2.78 0 00-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
];

const SidebarCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass rounded-[var(--radius-lg)] p-4">
    <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
      <span className="block w-3 h-px bg-[var(--green-text)] opacity-50" />
      {title}
    </div>
    {children}
  </div>
);

const SidebarBtn = ({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className={`block text-center text-[0.78rem] font-semibold px-4 py-2 rounded-[var(--radius-sm)] transition-colors ${
      variant === "primary"
        ? "bg-[var(--gold)] text-white hover:bg-[var(--gold-bright)]"
        : "bg-white/[0.04] border border-white/[0.08] text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.08]"
    }`}>
    {children}
  </a>
);

export function PortalSidebar({ enrolledServices, deliveredServices, globalSettings: gs, currentOffer }: Props) {
  const hasSocial = [gs.socialFacebook, gs.socialTwitter, gs.socialYoutube, gs.socialLinkedin, gs.socialInstagram].some(Boolean);

  return (
    <div className="flex flex-col gap-4">

      {/* Your Current Offer — checklist of the member's enrolled DFY
          services (C24 + demo preview accounts), ticked when delivered. */}
      {currentOffer && (
        <SidebarCard title="Your Current Offer">
          {currentOffer.length === 0 ? (
            <p className="text-[0.74rem] text-[var(--text-secondary)]">No DFY services in your offer yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {currentOffer.map((o) => (
                <div key={o.title} className="flex items-center gap-2.5 py-0.5">
                  <span
                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={o.done
                      ? { background: "#15803d" }
                      // DEMO: was rgba(255,255,255,0.25), which is invisible on the light theme.
                      : { border: "1.5px solid var(--text-dim)" }}
                  >
                    {o.done && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-[0.78rem] min-w-0 ${o.done ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"}`}>
                    {o.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SidebarCard>
      )}

      {/* Your Files */}
      {/* Enrollment List — services from each roadmap step + their status */}
      <SidebarCard title="Enrollment List">
        <RoadmapEnrollmentList services={enrolledServices} />
      </SidebarCard>

      {/* Delivered Services — admin-curated signed documents + auto-
          surfaced pending-sign rows from ServiceEnrollment. */}
      {deliveredServices.length > 0 && (
        <SidebarCard title="Delivered Services">
          <div className="flex flex-col gap-1.5">
            {deliveredServices.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 py-1">
                <span className="text-[0.74rem] text-[var(--text-secondary)] truncate min-w-0">{d.title}</span>
                <a
                  href={d.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.62rem] font-semibold px-2 py-0.5 rounded-full border bg-[var(--gold)] text-white border-[var(--gold)] hover:bg-[var(--gold-bright)] flex-shrink-0 whitespace-nowrap"
                >
                  {d.kind === "sign" ? "Sign" : "View"}
                </a>
              </div>
            ))}
          </div>
        </SidebarCard>
      )}

      {/* Files Card */}
      {gs.filesLink && (
        <SidebarCard title={gs.filesTitle || "Your Files"}>
          {gs.filesDescription && (
            <p className="text-[0.75rem] text-[var(--text-secondary)] mb-3">{gs.filesDescription}</p>
          )}
          <SidebarBtn href={gs.filesLink}>{gs.filesButtonLabel || "Access Here"}</SidebarBtn>
        </SidebarCard>
      )}

      {/* Feedback Card */}
      {gs.feedbackLink && (
        <SidebarCard title={gs.feedbackTitle || "Share Your Feedback"}>
          {gs.feedbackDescription && (
            <p className="text-[0.75rem] text-[var(--text-secondary)] mb-3">{gs.feedbackDescription}</p>
          )}
          <SidebarBtn href={gs.feedbackLink} variant="secondary">{gs.feedbackButtonLabel || "Give Us Feedback"}</SidebarBtn>
        </SidebarCard>
      )}

      {/* Referral Card */}
      {gs.affiliateLink && (
        <SidebarCard title={gs.affiliateTitle || "Earn with GovPreneurs"}>
          {gs.affiliateDescription && (
            <p className="text-[0.75rem] text-[var(--text-secondary)] mb-3">{gs.affiliateDescription}</p>
          )}
          <SidebarBtn href={gs.affiliateLink}>{gs.affiliateButtonLabel || "Login to Affiliate Portal"}</SidebarBtn>
        </SidebarCard>
      )}

      {/* Our Services */}
      {gs.servicesLink && (
        <SidebarCard title="Our Services">
          <SidebarBtn href={gs.servicesLink} variant="primary">Our Services</SidebarBtn>
        </SidebarCard>
      )}

      {/* Stay Connected */}
      {hasSocial && (
        <SidebarCard title="Stay Connected">
          <div className="flex items-center gap-2 flex-wrap">
            {socialLinks.map(({ key, label, icon }) => {
              const url = gs[key];
              if (!url) return null;
              return (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                  title={label}
                  className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] bg-white/[0.04] border border-white/[0.08] text-[var(--text-muted)] hover:text-white hover:bg-white/[0.08] transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </a>
              );
            })}
          </div>
        </SidebarCard>
      )}

    </div>
  );
}
