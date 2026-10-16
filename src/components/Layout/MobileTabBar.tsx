import { Link, useLocation } from "@tanstack/react-router";
import { Home, Target, FolderKanban, CheckSquare, Menu } from "lucide-react";
import { useJourney } from "@/lib/mock/currentMember";
import { isEmbeddedInGhl, pageKeyForRoute, requestCrossPageNav } from "@/lib/ghlNav";

interface Props {
  onOpenDrawer: () => void;
}

export function MobileTabBar({ onOpenDrawer }: Props) {
  const { tasksUnread, walletLow } = useJourney();
  const tasksHasDot = tasksUnread > 0;
  const moreHasDot = walletLow;
  const location = useLocation();
  const currentKey = pageKeyForRoute(location.pathname);

  // Opportunities is its own GHL custom-menu-link (see Sidebar.tsx's NavItem for
  // the full rationale) — relay through the parent frame when embedded and not
  // already on that page, otherwise the outer GHL sidebar goes out of sync.
  const handleOpportunitiesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (currentKey === "opportunities" || !isEmbeddedInGhl()) return;
    e.preventDefault();
    requestCrossPageNav("opportunities", "/opportunities");
  };

  return (
    <nav className="mobile-tab-bar" aria-label="Primary">
      <Link
        to="/home"
        className="mobile-tab-item"
        activeProps={{ className: "mobile-tab-item is-active" }}
        activeOptions={{ exact: false }}
      >
        <Home size={22} aria-hidden />
        <span className="mobile-tab-label">Home</span>
      </Link>
      <Link
        to="/opportunities"
        className="mobile-tab-item"
        activeProps={{ className: "mobile-tab-item is-active" }}
        onClick={handleOpportunitiesClick}
      >
        <Target size={22} aria-hidden />
        <span className="mobile-tab-label">Opportunities</span>
      </Link>
      <Link
        to="/pipeline"
        className="mobile-tab-item"
        activeProps={{ className: "mobile-tab-item is-active" }}
      >
        <FolderKanban size={22} aria-hidden />
        <span className="mobile-tab-label">Pipeline</span>
      </Link>
      <Link
        to="/tasks"
        className="mobile-tab-item"
        activeProps={{ className: "mobile-tab-item is-active" }}
      >
        <span className="mobile-tab-icon-wrap">
          <CheckSquare size={22} aria-hidden />
          {tasksHasDot ? <span className="mobile-tab-dot" aria-hidden /> : null}
        </span>
        <span className="mobile-tab-label">Tasks</span>
      </Link>
      <button
        type="button"
        className="mobile-tab-item mobile-tab-item--btn"
        onClick={onOpenDrawer}
        aria-label="Open more navigation"
        aria-controls="mobile-nav-drawer"
      >
        <span className="mobile-tab-icon-wrap">
          <Menu size={22} aria-hidden />
          {moreHasDot ? <span className="mobile-tab-dot" aria-hidden /> : null}
        </span>
        <span className="mobile-tab-label">More</span>
      </button>
    </nav>
  );
}
