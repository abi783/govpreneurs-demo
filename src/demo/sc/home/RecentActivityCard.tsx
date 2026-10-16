// DEMO: the "Recent Activity" card in the Success Center home sidebar.
//
// The production home has no activity list. This card is new. It uses the same
// card look as the sidebar cards next to it (`glass`, the green rule, the small
// capital title), and every row opens the page it talks about.

import Link from "next/link";
import type { ActivityItem } from "./homeData";

const KIND: Record<ActivityItem["kind"], { bg: string; color: string; path: string }> = {
  ava: { bg: "#ede9fe", color: "#6d28d9", path: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
  mentor: { bg: "#dcfce7", color: "#15803d", path: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
  grant: { bg: "#fef3c7", color: "#92400e", path: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
  bid: { bg: "#dbeafe", color: "#1d4ed8", path: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" },
  booking: { bg: "#dbeafe", color: "#1d4ed8", path: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
  message: { bg: "#dbeafe", color: "#1d4ed8", path: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
  wallet: { bg: "#dcfce7", color: "#15803d", path: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
};

/** "Just now", "40 min ago", "Today", "Yesterday", "6 days ago". */
export function timeAgo(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  const minutes = Math.round((now - t) / 60_000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (t >= start.getTime()) return "Today";
  const days = Math.ceil((start.getTime() - t) / 86_400_000);
  return days <= 1 ? "Yesterday" : `${days} days ago`;
}

export function RecentActivityCard({ firstName, items }: { firstName: string; items: ActivityItem[] }) {
  return (
    <div className="glass rounded-[var(--radius-lg)] p-5 mb-4" data-testid="recent-activity">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3.5">
        <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
          <span className="block w-3 h-px bg-[var(--green-text)] opacity-50" />
          Recent Activity
        </div>
        <p className="text-[0.78rem] text-[var(--text-secondary)]">Hi {firstName}, here is what moved this week.</p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {items.map((item) => {
          const k = KIND[item.kind];
          return (
            <li key={item.id} className="min-w-0">
              <Link
                href={item.to}
                className="flex items-start gap-3 h-full p-3 rounded-[var(--radius-md)] border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: k.bg, color: k.color }}
                  aria-hidden
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={k.path} />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 flex flex-col">
                  <span className="text-[0.82rem] font-semibold leading-snug text-[var(--text-primary)] line-clamp-2">{item.title}</span>
                  <span className="text-[0.74rem] leading-snug text-[var(--text-muted)] mt-0.5 line-clamp-2">{item.detail}</span>
                  <span className="text-[0.64rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-dim)] mt-1.5">
                    {timeAgo(item.at)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
