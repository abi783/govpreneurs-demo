import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { crossPageClick } from "@/lib/ghlNav";
import govpreneursIcon from "@/assets/govpreneurs-icon.png.asset.json";
import {
  Target,
  Settings,
  UserSquare,
  MessagesSquare,
  Home,
  FolderKanban,
  Trophy,
  Award,
  CalendarRange,
  // Search, — only used by the disabled Ctrl+K command-bar trigger below
  CheckSquare,
  Wallet,
  ChevronDown,
  AlertTriangle,
  FileText,
  ScrollText,
  Banknote,
  Handshake,
  Lock,
} from "lucide-react";
// Ctrl+K command bar disabled — sidebar trigger commented out below.
// import { useCommandBar } from "../CommandBar/CommandBarProvider";
import { useJourney, useCurrentMember } from "@/lib/mock/currentMember";
import { useMentorUnread } from "@/lib/mentorReviewsApi";
import { useUIFlag } from "@/lib/uiState";
import { Button } from "@/components/ui";

function NavItem({
  to,
  icon: Icon,
  label,
  exact,
  signal,
  currentStep,
  extraClass,
  onNavigate,
}: {
  to: string;
  icon: typeof Target;
  label: string;
  exact?: boolean;
  signal?: ReactNode;
  currentStep?: boolean;
  extraClass?: string;
  onNavigate?: () => void;
}) {
  const cls = `nav-item${currentStep ? " is-current-step" : ""}${extraClass ? " " + extraClass : ""}`;
  const location = useLocation();

  // Each page key in ghlNav.ts (Opportunities, Mentors, Partners, Awards, Small
  // Orders, Forecasts) is its own GHL custom-menu-link,
  // and this app runs inside a GHL iframe. A plain <Link> nav between them only
  // changes the route inside the CURRENT iframe — the outer GHL sidebar would stay
  // on the old menu link while the target page rendered nested inside it. So when
  // embedded (and not already on that page) we relay through the parent frame
  // instead, same pattern as opportunities.$noticeId.tsx / awards.$awardId.tsx /
  // PrimeDetailPanel.tsx. Standalone (local dev) the native <Link> reaches it
  // directly, so we only intercept when embedded.
  const relay = crossPageClick(to, location.pathname);
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    relay(e);
  };

  return (
    <Link
      to={to}
      className={cls}
      activeProps={{ className: cls + " is-active" }}
      activeOptions={{ exact: exact ?? false }}
      onClick={handleClick}
    >
      <Icon />
      <span>{label}</span>
      {signal ? <span className="nav-item__signal">{signal}</span> : null}
    </Link>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// Gentle fade when the badge number changes. Re-mounts on value via key.
function AnimatedCount({ value, className }: { value: number | string; className?: string }) {
  return (
    <span key={String(value)} className={`nav-count-anim${className ? " " + className : ""}`}>
      {value}
    </span>
  );
}

/** Two-letter avatar initials from a display name (first + last word). */
function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <SidebarContent />
    </aside>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void } = {}) {
  // const cmd = useCommandBar(); // Ctrl+K command bar disabled
  const journey = useJourney();
  const member = useCurrentMember();
  const mentorUnread = useMentorUnread();
  const { roadmap, profileCompleteness, bidsCount, tasksUnread, walletLow, activeBid } = journey;

  const [exploreOpen, setExploreOpen] = useUIFlag<boolean>("nav.explore.open", true);

  const effectiveTasksUnread = tasksUnread;
  const effectiveWalletLow = walletLow;

  const overallPct = roadmap.overallPercent;
  const isReady = overallPct >= 100;

  // Ctrl+K command bar disabled — trigger handler commented out.
  // const handleCmd = () => {
  //   onNavigate?.();
  //   cmd.open();
  // };

  // Wrap body in a display:contents div so we can capture any nav anchor click
  // (drawer variant uses this to auto-close after navigation). Desktop sidebar
  // passes no onNavigate, so the handler is a no-op.
  const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onNavigate) return;
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor && anchor.getAttribute("href")) onNavigate();
  };

  return (
    <div style={{ display: "contents" }} onClick={handleBodyClick}>
      {/* Brand block */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "var(--s-4) var(--s-5) var(--s-3)",
        }}
      >
        <img
          src={govpreneursIcon.url}
          alt="GovPreneurs"
          width={28}
          height={28}
          style={{ display: "block", objectFit: "contain" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            GovPreneurs
          </span>
          <span className="kbd">v4.1</span>
        </div>
      </div>

      {/* Search → opens Command Bar (Ctrl+K disabled — trigger removed)
      <div className="search-wrap" style={{ marginBottom: "var(--s-2)" }}>
        <button
          type="button"
          className="input cmdk-trigger"
          onClick={handleCmd}
          aria-label="Open command bar"
        >
          <Search size={13} aria-hidden />
          <span className="cmdk-trigger-text">Search or jump to…</span>
        </button>
        <span className="kbd">⌘K</span>
      </div>
      */}

      {/* Nav — journey-aware, whitespace-grouped */}
      <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "var(--s-4)" }}>
        <div className="nav-section nav-section--flush">
          <NavItem to="/home" icon={Home} label="Home" />
        </div>

        <div className="nav-gap" />

        <div className="nav-section nav-section--flush">
          <NavItem
            to="/opportunities"
            icon={Target}
            label="Opportunities"
            signal={
              <span
                className={`nav-tag-preview${isReady ? " is-hidden" : ""}`}
                title="Preview — finish setup to unlock pursuing"
              >
                <Lock size={9} aria-hidden style={{ marginRight: 3 }} />
                preview
              </span>
            }
          />
          <NavItem
            to="/pipeline"
            icon={FolderKanban}
            label="Pipeline"
            signal={
              <span className="nav-count">
                <AnimatedCount value={bidsCount > 99 ? "99+" : bidsCount} />
              </span>
            }
          />
          <NavItem
            to="/business-profile"
            icon={UserSquare}
            label="My Business"
            signal={<span className="nav-pct">{profileCompleteness}%</span>}
          />
        </div>

        <div className="nav-gap" />

        <div className="nav-section nav-section--flush">
          <NavItem
            to="/tasks"
            icon={CheckSquare}
            label="Tasks"
            signal={
              effectiveTasksUnread > 0 ? (
                <span className="nav-dot-count">
                  <AnimatedCount value={effectiveTasksUnread} />
                </span>
              ) : null
            }
          />
          <NavItem
            to="/mentors"
            icon={MessagesSquare}
            label="Mentors"
            signal={
              mentorUnread > 0 ? (
                <span className="nav-dot-count">
                  <AnimatedCount value={mentorUnread} />
                </span>
              ) : null
            }
          />
          <NavItem
            to="/wallet"
            icon={Wallet}
            label="Wallet"
            signal={
              effectiveWalletLow ? (
                <AlertTriangle size={12} className="nav-warn" aria-label="low balance" />
              ) : null
            }
          />
        </div>

        <div className="nav-gap" />

        <div className="nav-section nav-section--flush">
          <button
            type="button"
            className="nav-group-header"
            onClick={() => setExploreOpen(!exploreOpen)}
            aria-expanded={exploreOpen}
          >
            <span>Know your market</span>
            <ChevronDown
              size={12}
              style={{
                transition: "transform var(--d-base) var(--ease)",
                transform: exploreOpen ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            />
          </button>
          <div
            className="nav-group-body"
            style={{
              maxHeight: exploreOpen ? 360 : 0,
              opacity: exploreOpen ? 1 : 0,
              pointerEvents: exploreOpen ? "auto" : "none",
            }}
          >
            <NavItem to="/government-buyers" icon={UserSquare} label="Government Buyers" />
            <NavItem to="/partners" icon={Handshake} label="Partners" />
            <NavItem to="/whos-winning" icon={Trophy} label="Who's Winning" />
            <NavItem to="/awards" icon={Award} label="Awards" />
            <NavItem to="/forecasts" icon={CalendarRange} label="Forecasts" />
            <NavItem to="/vehicles" icon={ScrollText} label="Vehicles" />
            <NavItem to="/labor-pricing" icon={Banknote} label="Labor Pricing" />
          </div>
        </div>

        {activeBid ? (
          <>
            <div className="nav-gap" />
            <div className="nav-section nav-section--flush">
              <NavItem
                to="/pipeline"
                icon={FileText}
                label={`Proposal: ${truncate(activeBid.title, 22)}`}
                extraClass="nav-item--ava"
              />
            </div>
          </>
        ) : null}
      </nav>

      {/* Footer / user */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "var(--s-3) var(--s-4)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--bg-element)",
            color: "var(--text)",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {nameInitials(member.ownerName)}
        </div>
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
          <div
            className="t-body-sm"
            style={{
              color: "var(--text)",
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {member.ownerName}
          </div>
          <div
            className="t-caption"
            style={{
              marginTop: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {[member.businessName, [member.hqCity, member.hqState].filter(Boolean).join(" ")]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Settings />}
          aria-label="Settings"
          style={{ padding: 6 }}
        />
      </div>
      <div
        style={{
          padding: "6px var(--s-4) var(--s-3)",
          fontSize: 10.5,
          letterSpacing: "0.04em",
          color: "var(--text-3)",
          textTransform: "uppercase",
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Sample data · Demo only · © GovPreneurs
      </div>
    </div>
  );
}
