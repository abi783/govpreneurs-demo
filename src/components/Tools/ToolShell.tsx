import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { GoogleG, SignInPanel } from "@/components/Tools/SignInPanel";
import { SummitInvite } from "@/components/Tools/SummitInvite";
import { useToolsAccount } from "@/lib/tools/account";
import { isEmbedMode } from "@/lib/tools/embed";
import { basepath, appHref } from "@/lib/basepath";

// Same BASE_URL normalization Avatar.tsx uses for public/agents/* assets.
const B = import.meta.env.BASE_URL.replace(/\/?$/, "/");
const LOGO_SRC = `${B}brand/govpreneurs-logo.svg`;

// The four tools owned by another agent in this build don't exist in the
// route tree yet, so they're plain hrefs (still correct once those routes
// land); the three this agent owns use typed `Link`s. Labels kept short and
// consistent-length so the nav (desktop text links, mobile tab strip) reads
// as one row rather than a ladder of different widths.
const EXTERNAL_TABS = [
  { href: appHref("/tools/registration-checklist"), label: "Registration" },
  { href: appHref("/tools/co-checklist"), label: "CO checklist" },
  { href: appHref("/tools/hubzone"), label: "HUBZone" },
  { href: appHref("/tools/capability-statement"), label: "Cap statement" },
];

const LOCAL_TABS = [
  { to: "/tools/demand" as const, label: "Demand" },
  { to: "/tools/naics" as const, label: "NAICS" },
  { to: "/tools/scorecard" as const, label: "Scorecard" },
];

interface NavTab {
  key: string;
  label: string;
  active: boolean;
  render: (className: string) => ReactNode;
}

function useNavTabs(pathname: string): NavTab[] {
  const local: NavTab[] = LOCAL_TABS.map((tab) => ({
    key: tab.to,
    label: tab.label,
    active: pathname.endsWith(tab.to),
    render: (className) => (
      <Link key={tab.to} to={tab.to} className={className}>
        {tab.label}
      </Link>
    ),
  }));
  const external: NavTab[] = EXTERNAL_TABS.map((tab) => ({
    key: tab.href,
    label: tab.label,
    active: pathname.endsWith(tab.href.replace(basepath, "")),
    render: (className) => (
      <a key={tab.href} href={tab.href} className={className}>
        {tab.label}
      </a>
    ),
  }));
  return [...local, ...external];
}

interface ToolShellProps {
  children: ReactNode;
  /** "Federal award records (FPDS), as of {date}" — omitted until a result has an asOf. */
  freshness?: string;
  cta?: ReactNode;
}

/**
 * Freshness line rendered inline by each tool page, right under its headline.
 * ToolShell is mounted once at the /tools layout level (see tools.tsx) so it
 * has no per-page slot to push this into — pages render it themselves via
 * this shared component instead, which is what keeps the wording and spacing
 * consistent without prop-drilling through the router.
 */
export function ToolFreshness({ asOf }: { asOf?: string | null }) {
  if (!asOf) return null;
  const d = new Date(asOf);
  const label = Number.isNaN(d.getTime())
    ? asOf
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
  return (
    <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: "var(--s-2)" }}>
      Federal award records (FPDS), as of {label}
    </p>
  );
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

function AccountSlot() {
  const { user, loading, signOut } = useToolsAccount();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Route change closes the dropdown.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Click outside closes.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  if (loading) {
    return <div className="tool-account-placeholder" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Modal.Root open={open} onOpenChange={setOpen}>
        <Modal.Trigger asChild>
          <button
            type="button"
            className="btn btn-secondary tool-signin-btn"
            aria-label="Sign in with Google or email"
          >
            <GoogleG size={16} />
            <span>Sign in</span>
          </button>
        </Modal.Trigger>
        <Modal.Content size="sm">
          <Modal.Body>
            <img
              src={LOGO_SRC}
              alt=""
              height={20}
              style={{ display: "block", marginBottom: "var(--s-3)" }}
            />
            <SignInPanel
              description="Save your results across tools — free, no card required."
              emailButtonLabel="Send me a code"
              onUnlocked={() => setOpen(false)}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    );
  }

  const fullName = user.name ?? user.email;
  const displayName = (user.name ? user.name.split(/\s+/)[0] : user.email.split("@")[0]) || "You";
  const initials = initialsFor(user.name ?? user.email.split("@")[0] ?? "You");

  const closeAndFocusButton = () => {
    setMenuOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="tool-account" style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        type="button"
        className="tool-account-btn"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") closeAndFocusButton();
        }}
      >
        <span className="tool-account-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="tool-account-name">{displayName}</span>
        <ChevronDown size={14} className="tool-account-chevron" aria-hidden="true" />
      </button>
      {menuOpen && (
        <div ref={menuRef} role="menu" className="tool-account-menu">
          <div className="tool-account-menu__header">
            <div className="tool-account-menu__name">{fullName}</div>
            <div className="tool-account-menu__email">{user.email}</div>
          </div>
          <div className="tool-account-menu__divider" />
          <Link
            to="/tools"
            role="menuitem"
            className="tool-account-menu__item"
            onClick={() => setMenuOpen(false)}
          >
            My results
          </Link>
          <button
            type="button"
            role="menuitem"
            className="tool-account-menu__item"
            onClick={() => {
              setMenuOpen(false);
              signOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function ToolShell({ children, freshness, cta }: ToolShellProps) {
  const embed = isEmbedMode();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = useNavTabs(pathname);
  const activeKey = tabs.find((t) => t.active)?.key;
  const stripRef = useRef<HTMLElement>(null);

  // Scroll the active tab into view on load / route change so a deep link
  // (e.g. landing straight on "Cap statement") isn't hidden off-strip.
  useEffect(() => {
    if (!activeKey) return;
    const el = stripRef.current?.querySelector<HTMLElement>(
      `[data-tab-key="${CSS.escape(activeKey)}"]`,
    );
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [activeKey]);

  return (
    <div
      className="tool-shell"
      style={{ background: "var(--bg)", minHeight: embed ? undefined : "100vh" }}
    >
      <div className="brand-stripe" />
      {!embed && (
        <header className="tool-header">
          <div className="tool-container tool-header-row">
            <Link to="/tools" className="tool-brand-lockup">
              <img
                src={LOGO_SRC}
                alt="GovPreneurs"
                height={24}
                className="tool-brand-lockup__logo"
              />
              <span className="tool-brand-lockup__suffix">Tools</span>
            </Link>
            <nav className="tool-nav-desktop" aria-label="Tools">
              {tabs.map((tab) => tab.render(`tool-nav-link${tab.active ? " active" : ""}`))}
            </nav>
            <div className="tool-header-account">
              <AccountSlot />
            </div>
          </div>
          <nav className="tool-nav-strip" aria-label="Tools" ref={stripRef}>
            {tabs.map((tab) => (
              <span key={tab.key} data-tab-key={tab.key} className="tool-nav-strip__item">
                {tab.render(`tool-nav-tab${tab.active ? " active" : ""}`)}
              </span>
            ))}
          </nav>
        </header>
      )}
      <main
        className="tool-container"
        style={{ paddingTop: "var(--s-6)", paddingBottom: "var(--s-8)" }}
      >
        {children}
        {freshness && (
          <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: "var(--s-5)" }}>
            {freshness}
          </p>
        )}
        {cta && <div style={{ marginTop: "var(--s-4)" }}>{cta}</div>}
      </main>
      <SummitInvite />
      {!embed && (
        <footer style={{ borderTop: "1px solid var(--border)" }}>
          <div
            className="tool-container tool-footer-row"
            style={{ paddingTop: "var(--s-5)", paddingBottom: "var(--s-5)" }}
          >
            <div className="tool-footer-brand">
              <img
                src={LOGO_SRC}
                alt="GovPreneurs"
                // Inline height: a global `img { height: auto }` reset beats the
                // attribute, which is how the footer logo once rendered 150px tall.
                style={{ height: 20, width: "auto", opacity: 0.6, flexShrink: 0 }}
              />
              <p className="t-body-sm" style={{ color: "var(--n-8)" }}>
                {/* Non-breaking space around the separator: on narrow screens plain
                    text wraps wherever it likes, splitting "govpreneurs.com" onto
                    its own line right after a trailing "·". Keep each side of the
                    separator as one unbreakable phrase instead. */}
                © {new Date().getFullYear()} GovPreneurs LLC ·{" "}govpreneurs.com
              </p>
            </div>
            <p className="t-body-sm" style={{ color: "var(--n-8)" }}>
              Figures are counted from federal award records (FPDS) and agency postings. Never a
              forecast.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
