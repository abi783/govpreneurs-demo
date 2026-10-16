// Roadmap v3 — inline stroke icons, lucide path data with lucide-compatible
// props so the ported JSX barely changes. Inline SVG per PAGES.md (the app
// deliberately carries no icon dependency).

import type { SVGProps } from "react";

type IconProps = { size?: number; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "strokeWidth">;

function make(name: string, children: React.ReactNode) {
  function Icon({ size = 24, strokeWidth = 2, ...rest }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {children}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const ArrowLeft = make("ArrowLeft", <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>);
export const ArrowRight = make("ArrowRight", <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>);
export const BookOpen = make("BookOpen", <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>);
export const CalendarCheck = make("CalendarCheck", <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>);
export const Check = make("Check", <path d="M20 6 9 17l-5-5" />);
export const CheckCircle2 = make("CheckCircle2", <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>);
export const ChevronDown = make("ChevronDown", <path d="m6 9 6 6 6-6" />);
export const ChevronLeft = make("ChevronLeft", <path d="m15 18-6-6 6-6" />);
export const ChevronRight = make("ChevronRight", <path d="m9 18 6-6-6-6" />);
export const CircleAlert = make("CircleAlert", <><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></>);
export const ClipboardList = make("ClipboardList", <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></>);
export const Clock = make("Clock", <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>);
export const Lock = make("Lock", <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>);
export const Mail = make("Mail", <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>);
export const Phone = make("Phone", <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />);
export const PlayCircle = make("PlayCircle", <><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></>);
export const Repeat = make("Repeat", <><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>);
export const Star = make("Star", <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />);
export const UserRound = make("UserRound", <><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>);
export const Users = make("Users", <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>);
export const Video = make("Video", <><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></>);
export const Wallet = make("Wallet", <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></>);
export const X = make("X", <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>);
