// DEMO: the left menu. These items, in this order, and nothing else.
// The same list feeds the command palette. `match` lists the route prefixes that
// make an item active (the first path segment decides; "/" matches only itself).

import {
  Award,
  Banknote,
  Building2,
  CalendarRange,
  Columns3,
  GraduationCap,
  Handshake,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Map as MapIcon,
  MessagesSquare,
  ScrollText,
  ShoppingCart,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface MenuItem {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Route prefixes that mark this item active. Defaults to `[to]`. */
  match?: string[];
  /** Extra words for the command palette. */
  keywords?: string[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Home",
    items: [
      { key: "success-center", label: "Success Center", to: "/", icon: LayoutDashboard, keywords: ["home", "dashboard", "start"] },
      { key: "roadmap", label: "Roadmap", to: "/roadmap", icon: MapIcon, keywords: ["steps", "plan", "journey"] },
      { key: "tasks", label: "Tasks", to: "/tasks", icon: ListChecks, keywords: ["to do", "inbox", "actions"] },
    ],
  },
  {
    title: "Explore",
    items: [
      { key: "opportunities", label: "Opportunities", to: "/opportunities", icon: Target, match: ["/opportunities"], keywords: ["hunter", "feed", "bids", "rfp", "contracts"] },
      { key: "forecasts", label: "Forecasts", to: "/forecasts", icon: CalendarRange, keywords: ["upcoming", "future"] },
      { key: "small-orders", label: "Small Orders", to: "/small-orders", icon: ShoppingCart, keywords: ["micro purchase", "dibbs", "dla"] },
    ],
  },
  {
    title: "Your Workspace",
    items: [
      { key: "my-business", label: "My Business", to: "/my-business", icon: Building2, match: ["/my-business", "/business-profile"], keywords: ["profile", "company", "sam", "naics"] },
      { key: "pipeline", label: "Pipeline", to: "/pipeline", icon: Columns3, keywords: ["my bids", "saved", "tracking"] },
      { key: "ava", label: "Ava", to: "/ava", icon: Sparkles, keywords: ["proposal", "draft", "assistant", "ai"] },
      { key: "mentors", label: "Mentors", to: "/find-a-mentor", icon: GraduationCap, keywords: ["find a mentor", "directory", "coach"] },
      { key: "mentor-reviews", label: "Mentor Reviews", to: "/mentors", icon: MessagesSquare, keywords: ["feedback", "conversation", "sent to mentor"] },
    ],
  },
  {
    // Not in today's GHL menu: the market pages Tim shows on calls (Shyam, 17 Oct 2026).
    title: "Know Your Market",
    items: [
      { key: "government-buyers", label: "Government Buyers", to: "/government-buyers", icon: Landmark, match: ["/government-buyers", "/agencies"], keywords: ["agencies", "contracting officers", "buyers"] },
      { key: "partners", label: "Partners", to: "/partners", icon: Handshake, match: ["/partners", "/partner-finder", "/whos-winning"], keywords: ["teaming", "primes", "subcontract", "who's winning"] },
      { key: "awards", label: "Awards", to: "/awards", icon: Award, keywords: ["past awards", "incumbents", "winners"] },
      { key: "vehicles", label: "Vehicles", to: "/vehicles", icon: ScrollText, keywords: ["contract vehicles", "idiq", "gsa schedule", "bpa"] },
      { key: "labor-pricing", label: "Labor Pricing", to: "/labor-pricing", icon: Banknote, keywords: ["wages", "rates", "price", "wage determination"] },
    ],
  },
];

export const ALL_MENU_ITEMS: MenuItem[] = MENU_SECTIONS.flatMap((s) => s.items);

function matches(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** True when `pathname` belongs to `item` (route prefix match). */
export function isMenuItemActive(item: MenuItem, pathname: string): boolean {
  return (item.match ?? [item.to]).some((p) => matches(pathname, p));
}
