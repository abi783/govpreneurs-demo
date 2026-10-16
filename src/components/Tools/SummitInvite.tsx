import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToolsAccount } from "@/lib/tools/account";
import { useToolsAnalytics } from "@/lib/tools/analytics";
import { SUMMIT_COUPON, SUMMIT_DISCOUNT_LABEL, SUMMIT_URL } from "@/lib/tools/summit";

// Same BASE_URL normalization ToolShell.tsx uses for public/brand/* assets.
const B = import.meta.env.BASE_URL.replace(/\/?$/, "/");
const HERO_SRC = `${B}brand/summit/hero.jpg`;
const SUMMIT_DATES = "Nov 9–10, 2026";
const SUMMIT_VENUE = "Raleigh Convention Center, NC";
const SUMMIT_DESCRIPTION =
  "Make 2027 the year you win more government contracts. Two days in person with the people who actually win them — compliance, certifications and positioning on day one; opportunity discovery, AI tools, proposal strategy and teaming on day two.";

interface Speaker {
  name: string;
  file: string;
}

// mirrors summit.govpreneurs.com — update when the site changes
const SPEAKERS: Speaker[] = [
  { name: "Timur Sabir", file: "timur-sabir" },
  { name: "Alex Lazatin", file: "alex-lazatin" },
  { name: "Diana Potts", file: "diana-potts" },
  { name: "William Thornton", file: "william-thornton" },
  { name: "Karthik Anand", file: "karthik-anand" },
  { name: "Tiffany Lymon", file: "tiffany-lymon" },
];

/**
 * Fires once per mount, right after a visitor completes sign-in (email OTP or
 * Google) anywhere in /tools/* — not on page load for an already-signed-in
 * visitor. Tracked via a "was anonymous" ref rather than storage: the modal
 * only needs to catch the transition within this mount's lifetime.
 */
export function SummitInvite() {
  const { user, loading } = useToolsAccount();
  const track = useToolsAnalytics();
  const wasAnonRef = useRef(false);
  const shownRef = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      wasAnonRef.current = true;
      return;
    }
    if (wasAnonRef.current && !shownRef.current) {
      shownRef.current = true;
      setOpen(true);
      track("tools_summit_invite_shown");
    }
  }, [user, loading, track]);

  return (
    <Modal.Root open={open} onOpenChange={setOpen}>
      <Modal.Content size="md" className="summit-invite">
        <div className="summit-invite__hero">
          <img src={HERO_SRC} alt="GovPreneurs Inaugural Summit, Nov 9–10" />
          <Modal.Close asChild>
            <button type="button" className="summit-invite__close" aria-label="Close">
              <X size={18} aria-hidden />
            </button>
          </Modal.Close>
        </div>

        <div className="summit-invite__body">
          <span className="summit-invite__eyebrow">
            {SUMMIT_DATES} · {SUMMIT_VENUE}
          </span>

          <Modal.Title className="t-heading">
            You&apos;re in. Now come learn how to win.
          </Modal.Title>
          <Modal.Description className="t-body-sm">{SUMMIT_DESCRIPTION}</Modal.Description>

          <div className="summit-invite__speakers">
            <div className="summit-invite__avatars">
              {SPEAKERS.map((speaker) => (
                <img
                  key={speaker.file}
                  src={`${B}brand/summit/${speaker.file}.jpg`}
                  alt={speaker.name}
                  loading="lazy"
                />
              ))}
            </div>
            <span className="t-body-sm">{SPEAKERS.map((s) => s.name).join(", ")} + more</span>
          </div>

          {/*
            The discount, but no ticket prices. This modal mirrors
            summit.govpreneurs.com, and pricing there changes (early-bird tiers,
            promos) faster than this file gets updated — a stale price shown next
            to a live discount code is worse than no price at all, because the
            member only discovers the real total at checkout. The percentage
            holds whatever the tier costs.
          */}
          <div className="summit-invite__offer">
            <strong>{SUMMIT_DISCOUNT_LABEL} for tools members</strong>
            <span>
              Use code <code className="summit-invite__coupon">{SUMMIT_COUPON}</code> at checkout —
              on top of current ticket pricing.
            </span>
          </div>

          <div className="summit-invite__actions">
            <a
              className="btn btn-primary summit-invite__cta"
              href={SUMMIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("tools_summit_invite_clicked");
                setOpen(false);
              }}
            >
              Claim my {SUMMIT_DISCOUNT_LABEL} →
            </a>
            <Modal.Close asChild>
              <button type="button" className="btn btn-secondary">
                Maybe later
              </button>
            </Modal.Close>
          </div>
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}
