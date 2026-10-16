"use client";

import { Card } from "@sc/components/ui/Card";
import { openIntercomChat } from "@sc/lib/intercom";

interface Props {
  name: string | null;
  title: string | null;
  avatarUrl: string | null;
  bio: string | null;
  // calendarId + locationId are kept on the props for backward-compat
  // with existing callers — they're no longer used now that the CTA
  // is "Need Help? Click Here" (Intercom) instead of "Book a Call".
  calendarId?: string | null;
  locationId?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

/**
 * Top-of-portal card surfacing the assigned Program Specialist (the
 * member's primary point of contact). All fields are pulled from
 * GlobalSettings.programSpecialist* — they're global, not per-mentor.
 *
 * Renders an "unconfigured" stub when name is missing so admin can
 * see the slot before populating it.
 *
 * The CTA used to be "Book a Call" (calendar modal). Tim asked for it
 * to become a support shortcut into the existing Intercom widget that
 * the GHL parent frame loads — so the button now reads
 * "Need Help? Click Here" and forwards the click to the parent.
 */
export function ProgramSpecialistCard({ name, title, avatarUrl, bio }: Props) {
  const configured = !!name;

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
        <span className="block w-3 h-px bg-[var(--gold)] opacity-60" />
        Program Specialist
      </div>

      {!configured ? (
        <p className="text-[0.78rem] text-[var(--text-muted)] italic">
          Your Program Specialist hasn&apos;t been assigned yet. Reach out to support.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name ?? "Program Specialist"}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--gold)]/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/15 ring-2 ring-[var(--gold)]/40 flex items-center justify-center text-[0.95rem] font-extrabold text-[var(--gold)]">
                {initials(name ?? "")}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[0.95rem] font-extrabold text-white leading-tight truncate">{name}</div>
              {title && (
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-[var(--gold)] truncate">{title}</div>
              )}
            </div>
          </div>

          {bio && (
            <p className="text-[0.78rem] text-[var(--text-secondary)] leading-relaxed line-clamp-4">{bio}</p>
          )}

          {/* Red CTA — forwards the click to the parent GHL frame's
              Intercom widget via postMessage. .navigategov is kept on
              the class list as a safety net in case the success-center
              is ever embedded same-origin (Intercom would pick it up
              via its custom_launcher_selector). */}
          <button
            type="button"
            onClick={openIntercomChat}
            className="navigategov mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#DC2626] text-white text-[0.8rem] font-bold hover:bg-[#B91C1C] transition-colors"
          >
            Need Help? Click Here
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </>
      )}
    </Card>
  );
}
