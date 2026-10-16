import type { LucideIcon } from "lucide-react";

/** One tab in a {@link TabBar}. */
export interface TabBarTab<K extends string> {
  key: K;
  label: string;
  icon: LucideIcon;
  /** The badge. `null` or absent renders no badge — an unfetched count is not
   *  a measurement. */
  count?: number | null;
}

/** An underlined tab strip with an icon and an optional count badge on each
 *  tab. The opportunities feed and the small-orders board both render it. */
export function TabBar<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly TabBarTab<K>[];
  active: K;
  onChange: (next: K) => void;
}) {
  return (
    <div className="opps-tabs" role="tablist">
      {tabs.map(({ key, label, icon: Icon, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            className={`opps-tab${isActive ? " is-active" : ""}`}
            onClick={() => onChange(key)}
            aria-pressed={isActive}
          >
            <Icon size={14} />
            <span className="opps-tab-label">{label}</span>
            {count != null && <span className="opps-tab-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
